# VLC Playlist Generator

I was spending too much time every day trying to figure out what background noise to have playing while I worked, so I created this project which will just scan a directory, select some random content and shove it in a m3u playlist file. That way you can just queue up whatever random nonsense, let it play, and get to work.

```bash
# You can run it as a command line bin.
npx tsx ./src/index.ts --source-search-directory /home/your_user/Downloads/ \
    --output-playlist-file-destination /tmp/my_playlist.m3u \
    --number-of-results 25
```

```typescript
// You can import the class as a typescript module.
import { VLCPlaylistGenerator } from '@opsimathically/vlc_playlist_generator';

// create class handle
const vlc_playlist_generator = new VLCPlaylistGenerator();

// generate playlist
await vlc_playlist_generator.createPlaylist({
  number_of_results: 100,
  output_playlist_file_destination: '/tmp/whatever_random_playlistname.m3u',
  source_search_directory: '/home/your_user/Downloads/'
});
```

## Install

```bash
npm install @opsimathically/vlc_playlist_generator
```

## Building from source

This package is intended to be run via npm, but if you'd like to build from source,
clone this repo, enter directory, and run `npm install` for dev dependencies, then run
`npm run build`.

## Reference

[See API Reference for documentation](https://github.com/opsimathically/vlc_playlist_generator/tree/main/docs)
