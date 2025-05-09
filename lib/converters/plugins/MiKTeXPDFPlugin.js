import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { readFile, writeFile } from 'fs/promises';
import iconv from 'iconv-lite';

export default class MiKTeXPDFPlugin {
  supportsInput() {
    return ['tex', 'latex'];
  }

  supportsOutput() {
    return ['pdf', 'docx', 'html', 'txt'];
  }

  async convert(inputPath, outputFormat) {
    const base = path.basename(inputPath, path.extname(inputPath));
    const outputDir = path.dirname(inputPath);

    // 🔧 Convert to UTF-8 and inject \usepackage[utf8]{inputenc} if missing
    try {
      const texData = await readFile(inputPath);
      const decodedTex = iconv.decode(texData, 'win1252'); // or 'cp437' if needed
      let utf8Tex = decodedTex;

      // Inject \usepackage[utf8]{inputenc} into preamble if missing
      if (!utf8Tex.includes('\\usepackage[utf8]{inputenc}')) {
        utf8Tex = utf8Tex.replace(/(\\documentclass[^]*?)(\\begin\{document\})/, '$1\\usepackage[utf8]{inputenc}\n$2');
      }

      await writeFile(inputPath, utf8Tex, 'utf8');
    } catch (e) {
      console.warn(`[WARNING] Failed to normalize LaTeX encoding: ${e.message}`);
    }

    return new Promise((resolve, reject) => {
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