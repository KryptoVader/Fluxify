import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export default class MiKTeXPDFPlugin {
  supportsInput() {
    return ['tex', 'latex'];
  }

  supportsOutput() {
    return ['pdf', 'docx', 'html', 'txt'];
  }

  convert(inputPath, outputFormat) {
    return new Promise((resolve, reject) => {
      const base = path.basename(inputPath, path.extname(inputPath));
      const outputDir = path.dirname(inputPath);
      
      // Compile LaTeX to PDF
      const pdflatexArgs = [
        '-interaction=nonstopmode',
        `-output-directory=${outputDir}`,
        inputPath
      ];
      
      const pdflatex = spawn('pdflatex', pdflatexArgs);
      
      pdflatex.on('exit', async code => {
        if (code !== 0) {
          return reject(new Error(`LaTeX compilation failed with code ${code}`));
        }
        
        // If final format is not PDF, convert with Pandoc
        if (outputFormat !== 'pdf') {
          const pandocArgs = [
            `${outputDir}/${base}.pdf`,
            '-o', `${outputDir}/${base}.${outputFormat}`,
            `--to=${outputFormat}`
          ];
          
          const pandoc = spawn('pandoc', pandocArgs);
          
          pandoc.on('exit', code => {
            code === 0 ? resolve(`${outputDir}/${base}.${outputFormat}`) : reject(new Error(`Pandoc conversion failed with code ${code}`));
          });
        } else {
          resolve(`${outputDir}/${base}.pdf`);
        }
      });
    });
  }
}