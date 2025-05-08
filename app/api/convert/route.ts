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

export async function POST(request: Request) {
  const formData = await request.formData();
  const maybeFile = formData.get('file');
  if (!(maybeFile instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  const file = maybeFile as File;
  const outputFormat = String(formData.get('outputFormat'));
  if (!outputFormat) {
    return NextResponse.json({ error: 'Missing outputFormat' }, { status: 400 });
  }
  const highQuality = formData.get('highQuality') === 'true';
  const forceTranscode = formData.get('forceTranscode') === 'true';

  // Write upload to /tmp
  const inputExt = file.name.split('.').pop()!.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const tmpDir = path.join(process.cwd(), 'public', 'tmp');
  await fs.mkdir(tmpDir, { recursive: true });
  const ts = Date.now();
  const inputPath = path.join(tmpDir, `${ts}-in.${inputExt}`);
  await fs.writeFile(inputPath, buffer);

  // Prepare CLI args
  const outputName = `${ts}-out.${outputFormat}`;
  const outputPath = path.join(tmpDir, outputName);
  const cliArgs = [
    inputPath,
    outputFormat,
    ...(highQuality ? ['--highQuality'] : []),
    ...(forceTranscode ? ['--forceTranscode'] : [])
  ];

  // Spawn your CLI (which runs PluginManager under the hood)
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      'node',
      ['--enable-source-maps', 'cli.js', ...cliArgs],
      { cwd: process.cwd(), stdio: 'inherit' }
    );
    proc.on('exit', code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
    proc.on('error', reject);
  });

  // Read back and stream
  const resultBuffer = await fs.readFile(outputPath);
  return new NextResponse(resultBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${outputName}"`
    }
  });
}
