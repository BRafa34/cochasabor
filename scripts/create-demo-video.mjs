import ffmpeg from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
if (!ffmpeg) throw new Error('No ffmpeg binary for this platform.');
const result = spawnSync(
  ffmpeg,
  [
    '-y',
    '-loop',
    '1',
    '-i',
    'public/media/coffee.webp',
    '-t',
    '6',
    '-vf',
    'scale=960:640:force_original_aspect_ratio=increase,crop=960:640,fade=t=in:st=0:d=1,fade=t=out:st=5:d=1',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '28',
    '-movflags',
    '+faststart',
    '-an',
    'public/media/cafe-demo.mp4',
  ],
  { stdio: 'inherit', windowsHide: true },
);
if (result.status !== 0) process.exit(1);
await writeFile(
  'public/media/cafe-demo.vtt',
  'WEBVTT\n\n00:00.000 --> 00:06.000\nVideo de demostración sin audio: una fotografía ilustrativa de café aparece y se desvanece.\n',
);
