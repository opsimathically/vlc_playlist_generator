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

  const temporary = await fs_promises.mkdtemp(path.join(os.tmpdir(), 'vlc-unit-'));
  const playlist_outfile = path.join(temporary, 'playlist.m3u');
  const search_dir = path.join(temporary, 'synthetic-media');
  await fs_promises.mkdir(search_dir);
  await fs_promises.writeFile(path.join(search_dir, 'synthetic.mp4'), 'synthetic fixture');
  try {

  const result = await vlc_playlist_generator.createPlaylist({
    number_of_results: 100,
    output_playlist_file_destination: playlist_outfile,
    source_search_directory: search_dir
  });

  assert.ok(result === playlist_outfile, 'File name mismatch.');
  const stat_result = await fs_promises.stat(playlist_outfile);
  assert.ok(stat_result.isFile(), 'Error: playlist file could not be created.');
  await fs_promises.unlink(playlist_outfile);
  } finally {
    await fs_promises.rm(temporary, { recursive: true, force: true });
  }
});
