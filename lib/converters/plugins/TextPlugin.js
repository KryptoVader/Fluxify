import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

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

    // Use Pandoc for all conversions, including DOCX
    const args = [inputPath, '-o', out];

    // For Markdown, explicitly set format
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