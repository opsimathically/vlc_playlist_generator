import { VLCPlaylistGenerator } from './classes/vlc_playlist_generator/VLCPlaylistGenerator.class';

type command_line_arguments_t = {
    source_search_directory: string;
    output_playlist_file_destination: string;
    number_of_results: number;
    filename_matching_regular_expression: RegExp | string;
};

type raw_command_line_arguments_t = {
    source_search_directory?: string;
    output_playlist_file_destination?: string;
    number_of_results?: string;
    filename_matching_regular_expression?: string;
    filename_matching_regular_expression_flags?: string;
    help_requested: boolean;
};

export { VLCPlaylistGenerator };

function BuildUsageText(): string {
    return [
        'Usage:',
        '  node dist/index.js --source-search-directory <path> --output-playlist-file-destination <path> --number-of-results <number> [--filename-matching-regular-expression <regex>] [--filename-matching-regular-expression-flags <flags>]',
        '',
        'Required Arguments:',
        '  --source-search-directory, -s',
        '  --output-playlist-file-destination, -o',
        '  --number-of-results, -n',
        '',
        'Optional Arguments:',
        '  --filename-matching-regular-expression, -r   Default: .*',
        '  --filename-matching-regular-expression-flags, -f',
        '  --help, -h'
    ].join('\n');
}

function ParseRawCommandLineArguments(params: {
    command_line_tokens: string[];
}): raw_command_line_arguments_t {
    const parsed_arguments: raw_command_line_arguments_t = {
        help_requested: false
    };
    const option_aliases = new Map<string, keyof raw_command_line_arguments_t>([
        ['--source-search-directory', 'source_search_directory'],
        ['-s', 'source_search_directory'],
        ['--output-playlist-file-destination', 'output_playlist_file_destination'],
        ['-o', 'output_playlist_file_destination'],
        ['--number-of-results', 'number_of_results'],
        ['-n', 'number_of_results'],
        [
            '--filename-matching-regular-expression',
            'filename_matching_regular_expression'
        ],
        ['-r', 'filename_matching_regular_expression'],
        [
            '--filename-matching-regular-expression-flags',
            'filename_matching_regular_expression_flags'
        ],
        ['-f', 'filename_matching_regular_expression_flags'],
        ['--help', 'help_requested'],
        ['-h', 'help_requested']
    ]);

    for (let index = 0; index < params.command_line_tokens.length; index++) {
        const raw_token = params.command_line_tokens[index];
        const split_index = raw_token.indexOf('=');
        const has_inline_value = split_index !== -1;
        const option_key = has_inline_value
            ? raw_token.slice(0, split_index)
            : raw_token;
        const parsed_option_key = option_aliases.get(option_key);

        if (parsed_option_key === undefined) {
            throw new Error(`Unknown argument: ${option_key}`);
        }

        if (parsed_option_key === 'help_requested') {
            parsed_arguments.help_requested = true;
            continue;
        }

        const option_value = has_inline_value
            ? raw_token.slice(split_index + 1)
            : params.command_line_tokens[index + 1];

        if (option_value === undefined || option_value.startsWith('-')) {
            throw new Error(`Missing value for argument: ${option_key}`);
        }

        parsed_arguments[parsed_option_key] = option_value;

        if (!has_inline_value) {
            index++;
        }
    }

    return parsed_arguments;
}

function ParseFilenameMatcher(params: {
    filename_matching_regular_expression?: string;
    filename_matching_regular_expression_flags?: string;
}): RegExp | string {
    const regex_pattern = params.filename_matching_regular_expression ?? '.*';
    const regex_flags = params.filename_matching_regular_expression_flags ?? '';

    return new RegExp(regex_pattern, regex_flags);
}

function ParseCommandLineArguments(params: {
    command_line_tokens: string[];
}): command_line_arguments_t | null {
    const raw_arguments = ParseRawCommandLineArguments({
        command_line_tokens: params.command_line_tokens
    });

    if (raw_arguments.help_requested) {
        return null;
    }

    if (raw_arguments.source_search_directory === undefined) {
        throw new Error('Missing required argument: --source-search-directory');
    }

    if (raw_arguments.output_playlist_file_destination === undefined) {
        throw new Error(
            'Missing required argument: --output-playlist-file-destination'
        );
    }

    if (raw_arguments.number_of_results === undefined) {
        throw new Error('Missing required argument: --number-of-results');
    }

    const parsed_number_of_results = Number(raw_arguments.number_of_results);

    if (!Number.isInteger(parsed_number_of_results)) {
        throw new Error('--number-of-results must be an integer value.');
    }

    return {
        source_search_directory: raw_arguments.source_search_directory,
        output_playlist_file_destination:
            raw_arguments.output_playlist_file_destination,
        number_of_results: parsed_number_of_results,
        filename_matching_regular_expression: ParseFilenameMatcher({
            filename_matching_regular_expression:
                raw_arguments.filename_matching_regular_expression,
            filename_matching_regular_expression_flags:
                raw_arguments.filename_matching_regular_expression_flags
        })
    };
}

async function RunCommandLineApplication(): Promise<void> {
    try {
        const command_line_arguments = ParseCommandLineArguments({
            command_line_tokens: process.argv.slice(2)
        });

        if (command_line_arguments === null) {
            console.log(BuildUsageText());
            return;
        }

        const vlc_playlist_generator = new VLCPlaylistGenerator();
        const output_playlist_path = await vlc_playlist_generator.createPlaylist(
            {
                source_search_directory:
                    command_line_arguments.source_search_directory,
                output_playlist_file_destination:
                    command_line_arguments.output_playlist_file_destination,
                number_of_results: command_line_arguments.number_of_results,
                filename_matching_regular_expression:
                    command_line_arguments.filename_matching_regular_expression
            }
        );

        console.log(`Playlist generated: ${output_playlist_path}`);
    } catch (error) {
        const error_message =
            error instanceof Error ? error.message : String(error);
        console.error(error_message);
        console.error('');
        console.error(BuildUsageText());
        process.exitCode = 1;
    }
}

function IsDirectCommandLineExecution(): boolean {
    if (typeof require === 'undefined') {
        return false;
    }

    if (typeof module === 'undefined') {
        return false;
    }

    return require.main === module;
}

if (IsDirectCommandLineExecution()) {
    void RunCommandLineApplication();
}
