// app/api/convert/route.ts

export const dynamic = 'force-dynamic';
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

  // 1️⃣ Extract parameters
  const file = maybeFile as File;
  const outputFormat = String(formData.get('outputFormat'));
  const highQuality = formData.get('highQuality') === 'true';
  const forceTranscode = formData.get('forceTranscode') === 'true';

  // 2️⃣ Write the upload into /tmp (or public/tmp)
  const inputExt = file.name.split('.').pop()!.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const tmpDir = path.join(process.cwd(), 'public', 'tmp');
  await fs.mkdir(tmpDir, { recursive: true });
  const ts = Date.now();
  const inputPath = path.join(tmpDir, `${ts}-in.${inputExt}`);
  await fs.writeFile(inputPath, buffer);

  // 3️⃣ Determine which Python wrapper to call
  //    (Assumes you’ve placed these under app/lib/converters/)
  let scriptName: string;
  switch (outputFormat) {
    case 'docx':
      scriptName = 'pdf2docx_wrapper.py';
      break;
    case 'csv':
      scriptName = 'table_convert_wrapper.py';
      break;
    default:
      return NextResponse.json({ error: 'Unsupported outputFormat' }, { status: 400 });
  }
  const scriptPath = path.join(process.cwd(), 'app', 'lib', 'converters', scriptName);

  // 4️⃣ Build the CLI args for Python
  //    We’ll pass inputPath, outputPath, and flags
  const outputName = `${ts}-out.${outputFormat}`;
  const outputPath = path.join(tmpDir, outputName);
  const args = [scriptPath, inputPath, outputPath];
  if (highQuality) args.push('--highQuality');
  if (forceTranscode) args.push('--forceTranscode');

  // 5️⃣ Invoke Python inside your .venv
  //    Make sure your vercel-build created .venv in project root
  const pythonBin = path.join(process.cwd(), '.venv', 'bin', 'python3');
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(pythonBin, args, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    proc.on('exit', code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
    proc.on('error', reject);
  });

  // 6️⃣ Read the output file and stream it back
  const resultBuffer = await fs.readFile(outputPath);
  return new NextResponse(resultBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${outputName}"`
    }
  });
}
