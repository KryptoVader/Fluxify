import path from 'path';
import fs from 'fs-extra';
import { spawnSync } from 'child_process';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class UnifiedTablePlugin {
  // Supported formats for input and output
  supportsInput()  { return ['csv','xlsx','xls','json','xml','xlsb','ods']; }
  supportsOutput() { 
    // Do not support PDF as an output format
    return ['csv','xlsx','xls','json','xml','xlsb','ods']; 
  }

  async convert(inputPath, format) {
    const dir  = path.dirname(inputPath);
    const ext  = path.extname(inputPath).slice(1).toLowerCase();
    const base = path.basename(inputPath, `.${ext}`);
    const out  = path.join(dir, `${base}.${format}`);

    // 1) Try Python wrapper with multiple command aliases
    const wrapper = path.join(__dirname, 'table_convert_wrapper.py');
    const pyCommands = ['python3', 'python', 'py'];
    for (const cmd of pyCommands) {
      try {
        const result = spawnSync(cmd, [wrapper, inputPath, out], { encoding: 'utf8' });
        if (result.status === 0 && await this._exists(out)) {
          console.log(`→ table_convert_wrapper succeeded (${cmd})`);
          return out;
        }
      } catch {}
    }
    console.warn('→ Python wrapper failed for all commands');

    // 2) Node.js fallback only for basic table formats
    const nodeFallbackExts = ['csv','xls','xlsx','json'];
    if (!nodeFallbackExts.includes(ext) || !nodeFallbackExts.includes(format)) {
      throw new Error(`Conversion unsupported without Python: ${ext} → ${format}`);
    }
    console.log('→ Falling back to Node.js conversion');

    // Read data
    let data;
    if (ext === 'json') {
      data = JSON.parse(await fs.readFile(inputPath, 'utf8'));
    } else {
      const workbook = XLSX.readFile(inputPath);
      const sheetName = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    }

    // Write output
    if (format === 'json') {
      await fs.writeFile(out, JSON.stringify(data, null, 2), 'utf8');
    } else {
      const newWB = XLSX.utils.book_new();
      const newSheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(newWB, newSheet, 'Sheet1');
      if (format === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(newSheet);
        await fs.writeFile(out, csv, 'utf8');
      } else {
        XLSX.writeFile(newWB, out);
      }
    }

    if (await this._exists(out)) {
      return out;
    }
    throw new Error(`Node.js conversion failed: ${ext} → ${format}`);
  }

  async _exists(fp) {
    try {
      const stats = await fs.stat(fp);
      return stats.size > 0;
    } catch {
      return false;
    }
  }
}