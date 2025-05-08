import { spawn } from 'child_process';
import path from 'path';


export default class LibreOfficePlugin {
  supportsInput() {
    return ['docx', 'odt', 'pptx', 'xls', 'xlsx'];
  }

  supportsOutput() {
    return ['pdf', 'html', 'txt'];
  }

  convert(inputPath, outputFormat) {
    return new Promise((resolve, reject) => {
      const args = [
        '--headless',
        '--convert-to', outputFormat,
        inputPath,
        '--outdir', path.dirname(inputPath)
      ];
      
      const child = spawn('soffice', args);
      
      child.on('error', reject);
      child.on('exit', code => {
        if (code === 0) {
          const base = path.basename(inputPath, path.extname(inputPath));
          resolve(path.join(path.dirname(inputPath), `${base}.${outputFormat}`));
        } else {
          reject(new Error(`LibreOffice exited with code ${code}`));
        }
      });
    });
  }
}