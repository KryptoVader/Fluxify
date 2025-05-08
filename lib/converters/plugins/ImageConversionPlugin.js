import path from 'path';
import { spawn } from 'child_process';
import os from 'os';

export default class ImageConversionPlugin {
  supportsInput() {
    return ['jpg','jpeg','png','gif','bmp','tiff','webp','svg'];
  }

  supportsOutput() {
    return ['jpg','png','gif','bmp','tiff','webp','svg','pdf'];
  }

  convert(inputPath, outputFormat) {
    return new Promise((resolve, reject) => {
      const base       = path.basename(inputPath, path.extname(inputPath));
      const outputPath = path.join(path.dirname(inputPath), `${base}.${outputFormat}`);

      // Choose the right CLI on Windows vs *nix
      const isWin    = os.platform() === 'win32';
      const cmd      = isWin ? 'magick' : 'convert';
      // If on Windows, we need the 'convert' subcommand
      const args     = isWin
        ? ['convert', inputPath, '-quality', '85', '-resize', '100%', '-colorspace', 'RGB', outputPath]
        : [inputPath, '-quality', '85', '-resize', '100%', '-colorspace', 'RGB', outputPath];

      const child = spawn(cmd, args, { shell: false });

      let stderr = '';
      let stdout = '';

      child.stdout.on('data', data => { stdout += data.toString(); });
      child.stderr.on('data', data => { stderr += data.toString(); });

      child.on('error', err => {
        reject(new Error(`Failed to start ${cmd}: ${err.message}`));
      });

      child.on('exit', code => {
        if (code === 0) {
          return resolve(outputPath);
        }
        // include the captured stderr in the error message
        const msg = stderr.trim() || stdout.trim() || `Exit code ${code}`;
        reject(new Error(`ImageMagick ${cmd} failed (${code}): ${msg}`));
      });
    });
  }
}
