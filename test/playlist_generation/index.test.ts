import test from 'node:test';
import assert from 'node:assert';
import { VLCPlaylistGenerator } from '@src/index';
import fs_promises from 'fs/promises';
import os from 'os';
import path from 'path';

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%% Test Definitions %%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

test('Arbitrary test(s).', async function () {
  const vlc_playlist_generator = new VLCPlaylistGenerator();

  const playlist_outfile = '/tmp/blahplaylist.m3u';
  const search_dir = path.join(os.homedir(), 'Downloads/');

  const result = await vlc_playlist_generator.createPlaylist({
    number_of_results: 100,
    output_playlist_file_destination: playlist_outfile,
    source_search_directory: search_dir
  });

  assert.ok(result === playlist_outfile, 'File name mismatch.');
  const stat_result = await fs_promises.stat(playlist_outfile);
  assert.ok(stat_result.isFile(), 'Error: playlist file could not be created.');
  await fs_promises.unlink(playlist_outfile);
});
