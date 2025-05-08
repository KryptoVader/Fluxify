// app/api/convert/route.ts

// 1️⃣ Force Next.js to treat this as a purely dynamic API route
export const dynamic = 'force-dynamic';

// 2️⃣ Run in the Node.js runtime so request.formData() and fs work
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Buffer } from 'buffer';
import { spawn } from 'child_process';
import PluginManager from '../../../lib/converters/PluginManager';

const pluginManager = new PluginManager();

// List of FFmpeg‐handled extensions
const ffmpegFormats = [
  'mp4','avi','mov','mkv','webm','flv','wmv','3gp',
  'mp3','wav','aac','ogg','flac','m4a'
];
// Separate audio/video lists
const audioFormats = ['mp3','wav','aac','ogg','flac','m4a'];
const videoFormats = ['mp4','avi','mov','mkv','webm','flv','wmv','3gp'];

export async function POST(request: Request) {
  const formData = await request.formData();

  // 1️⃣ File
  const maybeFile = formData.get('file');
  if (!(maybeFile instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  const file = maybeFile as File;

  // 2️⃣ Output format
  const outputFormat = formData.get('outputFormat') as string;
  if (!outputFormat) {
    return NextResponse.json({ error: 'Missing outputFormat' }, { status: 400 });
  }

  // 3️⃣ High‐quality flag (only honored for FFmpeg)
  const highQuality = formData.get('highQuality') === 'true';

  // Write upload to disk
  const inputExt = file.name.split('.').pop()?.toLowerCase() || '';
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const tmpDir = path.join(process.cwd(), 'public', 'tmp');
  await fs.mkdir(tmpDir, { recursive: true });

  const timestamp = Date.now();
  const inputPath = path.join(tmpDir, `${timestamp}-input.${inputExt}`);
  await fs.writeFile(inputPath, buffer);

  try {
    const inputIsAudio = audioFormats.includes(inputExt);
    const outputIsVideo = videoFormats.includes(outputFormat.toLowerCase());
    const useFfmpeg = ffmpegFormats.includes(inputExt);

    // If converting audio -> video, generate a simple video with a black frame
    if (inputIsAudio && outputIsVideo) {
      const outputPath = path.join(tmpDir, `${timestamp}-output.${outputFormat}`);
      // Build ffmpeg args: black background video + input audio
      const args = [
        '-f', 'lavfi', '-i', 'color=c=black:s=1280x720:r=25',
        '-i', inputPath,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-shortest',
        outputPath
      ];
      await new Promise<void>((resolve, reject) => {
        const ff = spawn('ffmpeg', args, { stdio: 'ignore' });
        ff.on('error', reject);
        ff.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)));
      });
      // Clean up input
      await fs.unlink(inputPath).catch(() => {});
      return NextResponse.json({ converted: [{ outputFormat, url: `/tmp/${path.basename(outputPath)}` }] });
    }

    // Build the opts object: only include highQuality when both true and FFmpeg
    const opts = useFfmpeg && highQuality
      ? { highQuality: true }
      : {};

    // Run the conversion (all plugins accept 3 args, but non-FFmpeg ignore opts)
    const result = await pluginManager.convert(
      inputPath,
      outputFormat,
      opts
    );

    // Clean up the uploaded file
    await fs.unlink(inputPath).catch(() => {});

    // Normalize to an array of public URLs
    const paths = Array.isArray(result) ? result : [result];
    const converted = paths.map(p => ({
      outputFormat,
      url: `/tmp/${path.basename(p)}`,
    }));

    return NextResponse.json({ converted });
  } catch (err: any) {
    console.error('Convert error:', err);

    // Cleanup on error
    await fs.unlink(inputPath).catch(() => {});

    return NextResponse.json(
      { error: err.message || 'Conversion failed' },
      { status: 500 }
    );
  }
}
