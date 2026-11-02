import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

type create_playlist_params_t = {
  source_search_directory: string;
  output_playlist_file_destination: string;
  number_of_results: number;
  filename_matching_regular_expression?: RegExp | string;
};

type discovered_video_file_t = {
  absolute_file_path: string;
  file_name: string;
};

function ShuffleArray<value_t>(params: { values: value_t[] }): value_t[] {
  const values_copy = [...params.values];

  for (let index = values_copy.length - 1; index > 0; index--) {
    const random_index = Math.floor(Math.random() * (index + 1));
    const current_value = values_copy[index];
    values_copy[index] = values_copy[random_index];
    values_copy[random_index] = current_value;
  }

  return values_copy;
}

export class VLCPlaylistGenerator {
  private readonly video_extensions: Set<string>;

  constructor(
    params: {
      video_extensions?: string[];
    } = {}
  ) {
    const fallback_extensions = [
      '.3gp',
      '.avi',
      '.m4v',
      '.mkv',
      '.mov',
      '.mp4',
      '.mpeg',
      '.mpg',
      '.ogv',
      '.webm',
      '.wmv'
    ];

    const extensions_to_use = params.video_extensions ?? fallback_extensions;
    this.video_extensions = new Set(
      extensions_to_use.map((extension) => extension.toLowerCase())
    );
  }

  async createPlaylist(params: create_playlist_params_t): Promise<string> {
    await this.validateCreatePlaylistParams({ params });

    const source_directory_path = path.resolve(params.source_search_directory);
    const output_playlist_path = path.resolve(
      params.output_playlist_file_destination
    );
    const filename_matcher = this.getFilenameMatcher({
      filename_matching_regular_expression:
        params.filename_matching_regular_expression
    });
    const filtered_files = await this.findVideoFiles({
      directory_path: source_directory_path,
      filename_matcher
    });
    const randomized_files = ShuffleArray({ values: filtered_files });
    const selected_files = randomized_files.slice(
      0,
      Math.min(params.number_of_results, randomized_files.length)
    );
    const playlist_contents = this.buildM3UContents({
      selected_files
    });

    await mkdir(path.dirname(output_playlist_path), { recursive: true });
    await writeFile(output_playlist_path, playlist_contents, 'utf8');

    return output_playlist_path;
  }

  private async validateCreatePlaylistParams(params: {
    params: create_playlist_params_t;
  }): Promise<void> {
    if (params.params.source_search_directory.trim() === '') {
      throw new Error('source_search_directory must not be empty.');
    }

    if (params.params.output_playlist_file_destination.trim() === '') {
      throw new Error('output_playlist_file_destination must not be empty.');
    }

    if (!Number.isInteger(params.params.number_of_results)) {
      throw new Error(
        'number_of_results must be an integer value greater than 0.'
      );
    }

    if (params.params.number_of_results <= 0) {
      throw new Error('number_of_results must be greater than 0.');
    }

    const source_search_directory_stats = await stat(
      params.params.source_search_directory
    ).catch(() => null);

    if (!source_search_directory_stats?.isDirectory()) {
      throw new Error(
        `source_search_directory is not a valid directory: ${params.params.source_search_directory}`
      );
    }
  }

  private getFilenameMatcher(params: {
    filename_matching_regular_expression?: RegExp | string;
  }): RegExp {
    if (params.filename_matching_regular_expression === undefined) {
      return /^.*$/;
    }

    if (params.filename_matching_regular_expression instanceof RegExp) {
      return params.filename_matching_regular_expression;
    }

    return new RegExp(params.filename_matching_regular_expression);
  }

  private async findVideoFiles(params: {
    directory_path: string;
    filename_matcher: RegExp;
  }): Promise<discovered_video_file_t[]> {
    const entries = await readdir(params.directory_path, {
      withFileTypes: true
    });
    const files: discovered_video_file_t[] = [];

    for (const entry of entries) {
      const absolute_entry_path = path.join(params.directory_path, entry.name);

      if (entry.isDirectory()) {
        const nested_files = await this.findVideoFiles({
          directory_path: absolute_entry_path,
          filename_matcher: params.filename_matcher
        });
        files.push(...nested_files);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (!this.isVideoFile({ file_name: entry.name })) {
        continue;
      }

      if (
        !this.doesFilenameMatchPattern({
          file_name: entry.name,
          filename_matcher: params.filename_matcher
        })
      ) {
        continue;
      }

      files.push({
        absolute_file_path: absolute_entry_path,
        file_name: entry.name
      });
    }

    return files;
  }

  private isVideoFile(params: { file_name: string }): boolean {
    const file_extension = path.extname(params.file_name).toLowerCase();
    return this.video_extensions.has(file_extension);
  }

  private doesFilenameMatchPattern(params: {
    file_name: string;
    filename_matcher: RegExp;
  }): boolean {
    params.filename_matcher.lastIndex = 0;
    return params.filename_matcher.test(params.file_name);
  }

  private buildM3UContents(params: {
    selected_files: discovered_video_file_t[];
  }): string {
    const m3u_lines = ['#EXTM3U'];

    for (const selected_file of params.selected_files) {
      m3u_lines.push(
        `#EXTINF:-1,${selected_file.file_name}`,
        selected_file.absolute_file_path
      );
    }

    return `${m3u_lines.join('\n')}\n`;
  }
}
