import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';
import iconv from 'iconv-lite';


const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export default class TextPlugin {
  supportsInput() { return ['txt']; }
  supportsOutput() { return ['docx', 'html', 'md', 'pdf']; }
  async convert(inputPath, format) {
  const ext = path.extname(inputPath).toLowerCase();
  if (ext !== '.txt') throw new Error(`Unsupported input: ${ext}`);
  if (!this.supportsOutput().includes(format)) throw new Error(`Unsupported output: ${format}`);

  const dir  = path.dirname(inputPath);
  const base = path.basename(inputPath, ext);
  const out  = path.join(dir, `${base}.${format}`);

  // Ensure input exists
  if (!await fs.pathExists(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  // 🔧 Convert file to UTF-8 in case it's encoded in legacy Windows encoding
  try {
    const rawBuffer = await readFile(inputPath);

    // Try decoding as Windows-1252 (you can switch to 'cp437' if needed)
    const decodedText = iconv.decode(rawBuffer, 'win1252');

    // Re-encode and overwrite the file as UTF-8
    await writeFile(inputPath, decodedText, 'utf8');
  } catch (e) {
    console.warn(`[WARNING] Failed to normalize text encoding: ${e.message}`);
    // Continue anyway — might still work if the file was already UTF-8
  }

  // Prepare Pandoc args
  const args = [inputPath, '-o', out];
  if (format === 'md') args.splice(1, 0, '-t', 'markdown');

  await this._run('pandoc', args);
  return out;
}

  _run(cmd, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, { cwd: process.cwd(), shell: true, stdio: 'inherit' });
      proc.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`)));
      proc.on('error', reject);
    });
  }
}