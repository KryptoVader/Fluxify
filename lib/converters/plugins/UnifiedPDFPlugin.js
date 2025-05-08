import os from 'node:os';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { spawnSync } from 'child_process';

export default class UnifiedPDFPlugin {
  supportsInput()  { return ['pdf']; }
  supportsOutput() { return ['docx','txt','html','md']; }

  async convert(inputPath, format) {
    const dir  = path.dirname(inputPath);
    const base = path.basename(inputPath, '.pdf');
    const out  = path.join(dir, `${base}.${format}`);
    const txt  = path.join(dir, `${base}.txt`);
    const html = path.join(dir, `${base}.html`);

    if (format === 'docx') {
      // 1) Try the Python wrapper (pdf2docx)
      const wrapper = path.join(__dirname, 'pdf2docx_wrapper.py');
      const result  = spawnSync('python', [wrapper, inputPath, out], { encoding: 'utf8' });
    
      if (result.status === 0 && await this._exists(out)) {
        console.log('→ pdf2docx wrapper succeeded');
        return out;
      }
      console.warn('→ pdf2docx wrapper failed, exit code', result.status);
    
      // 2) LibreOffice PDF→DOCX import
      try {
        console.log('→ Attempting LibreOffice PDF→DOCX import');
        await this._run('soffice', [
          '--headless',
          '--convert-to', 'docx:"MS Word 2007 XML":writer_pdf_import',
          '--outdir', dir,
          inputPath
        ]);
        if (await this._exists(out)) {
          console.log('→ LibreOffice import succeeded');
          return out;
        }
        console.warn('→ LibreOffice import produced no file');
      } catch (e) {
        console.warn('→ LibreOffice import failed:', e.message);
      }
    
      // 3) pdftohtml → Pandoc fallback
      try {
        console.log('→ Attempting pdftohtml + pandoc fallback');
        await this._run('pdftohtml', ['-c','-s', inputPath, html]);
        await this._run('pandoc',   [html, '-o', out, '-t', 'docx']);
        if (await this._exists(out)) {
          console.log('→ HTML→Pandoc fallback succeeded');
          await fs.remove(html);
          await fs.remove(path.join(dir, `${base}_files`)).catch(()=>{});
          return out;
        }
        console.warn('→ HTML→Pandoc produced no file');
      } catch (e) {
        console.warn('→ HTML→Pandoc failed:', e.message);
      }
    
      throw new Error('No conversion path succeeded for PDF → DOCX');
    }
    
    // ── TXT/HTML/MD ─────────────────────────────────────────────
    // Extract text with Poppler
    const extractedText = await this._extractText(inputPath);

    // write plain .txt for Pandoc
    const txtPath = path.join(dir, `${base}.txt`);
    await fs.writeFile(txtPath, extractedText, 'utf8');

    if (format === 'txt') {
      await fs.rename(txtPath, out);
      return out;
    }

    // 3) HTML or MD via Pandoc
    const pandocFormat = format === 'md' ? 'markdown' : 'html';
    await this._run('pandoc', [txtPath, '-t', pandocFormat, '-o', out]);
    await fs.remove(txtPath);
    return out;
  }

  /** Extract text from PDF via Poppler or OCR fallback. */
  async _extractText(inputPath) {
    let text = '';

    // Helper: run a command and return stdout, or throw
    const capture = (cmd, args) => {
      const res = spawnSync(cmd, args, { encoding: 'utf8' });
      if (res.error) throw res.error;
      if (res.status !== 0) {
        const errMsg = res.stderr?.trim() || `exit code ${res.status}`;
        throw new Error(errMsg);
      }
      return res.stdout;
    };

    // A) pdftotext → stdout
    try {
      text = capture('pdftotext', ['-layout', inputPath, '-']);
      console.log('→ pdftotext succeeded');
    } catch (e) {
      console.warn('→ pdftotext failed:', e.message);
    }

    // B) pdftohtml → stdout (single‐file HTML)
    if (!text.trim()) {
      try {
        text = capture('pdftohtml', ['-c', '-s', '-stdout', inputPath]);
        console.log('→ pdftohtml succeeded');
      } catch (e) {
        console.warn('→ pdftohtml failed:', e.message);
      }
    }

    // C) tesseract → stdout (OCR)
    if (!text.trim()) {
      try {
        // tesseract <input> stdout  → plain text
        text = capture('tesseract', [inputPath, 'stdout']);
        console.log('→ tesseract OCR succeeded');
      } catch (e) {
        console.warn('→ OCR (tesseract) failed:', e.message);
      }
    }

    if (!text.trim()) {
      throw new Error('No text could be extracted from PDF');
    }

    return text;
  }

  /** Run a command with inherited stdio (for Pandoc). */
  _run(cmd, args) {
    return new Promise((resolve, reject) => {
      const p = spawn(cmd, args, { stdio: 'inherit' });
      p.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)));
      p.on('error', reject);
    });
  }

  async _exists(fp) {
    try { return (await fs.stat(fp)).size > 0; }
    catch { return false; }
  }

  async _ocr(input) {
    const dir  = path.dirname(input);
    const base = path.basename(input, '.pdf');
    const tmpd = path.join(dir, `${base}_ocr`);
    await fs.ensureDir(tmpd);
    await this._run('pdftoppm', ['-r','300','-png', input, path.join(tmpd,'page')]);
    const { createWorker } = await import('tesseract.js');
    const worker = createWorker();
    await worker.load(); await worker.loadLanguage('eng'); await worker.initialize('eng');
    let out = '';
    for (const f of await fs.readdir(tmpd)) {
      if (f.endsWith('.png')) {
        const { data: { text } } = await worker.recognize(path.join(tmpd, f));
        out += text + '\n\n';
      }
    }
    await worker.terminate();
    await fs.remove(tmpd);
    return out;
  }

  _pdf2docx(input, out) {
    return new Promise((res, rej) => {
      // Inline Python command using pdf2docx
      const py = spawn('python', ['-c', 
        `from pdf2docx import Converter
` +
        `cv = Converter(r"${input}")
` +
        `cv.convert(r"${out}", start=0, end=None)
` +
        `cv.close()`
      ], { shell: true });
      py.on('exit', code => code === 0 ? res() : rej(new Error(`pdf2docx exit ${code}`)));
      py.on('error', rej);
    });
  }
}
