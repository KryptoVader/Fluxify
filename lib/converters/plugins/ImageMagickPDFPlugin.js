import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

export default class ImageMagickPDFPlugin {
  supportsInput() {
    return ['pdf'];
  }

  supportsOutput() {
    return ['jpg', 'png', 'gif'];
  }

  async convert(inputPath, outputFormat) {
    const base      = path.basename(inputPath, '.pdf');
    const outputDir = path.dirname(inputPath);
    const prefix    = path.join(outputDir, base);

    // 1) Rasterize PDF pages to PNG or JPEG via pdftoppm
    //    pdftoppm -r 300 -png input.pdf prefix       -> prefix-1.png, prefix-2.png, ...
    //    pdftoppm -r 300 -jpeg input.pdf prefix      -> prefix-1.jpg, ...
    const ppmFormat = outputFormat === 'jpg' ? 'jpeg' : 'png';
    await this._runPpdftoppm(inputPath, prefix, ppmFormat);

    // collect all generated images
    const files = [];
    for (let i = 1;; i++) {
      const ext = outputFormat === 'jpg' ? 'jpg' : 'png';
      const fp  = `${prefix}-${i}.${ext}`;
      try {
        await fs.access(fp);
        files.push(fp);
      } catch {
        break;
      }
    }

    if (!files.length) {
      throw new Error('pdftoppm produced no images');
    }

    // 2) If target is GIF, assemble into an animated GIF
    if (outputFormat === 'gif') {
      const gifPath = path.join(outputDir, `${base}.gif`);
      await this._runConvert([...files, gifPath]);
      // optionally cleanup the PNGs
      // await Promise.all(files.map(fp => fs.unlink(fp)));
      return [gifPath];
    }

    // 3) Otherwise, if JPG was requested but we got PNGs, re-convert them
    if (outputFormat === 'jpg' && ppmFormat === 'png') {
      const jpgFiles = [];
      for (const png of files) {
        const jpg = png.replace(/\.png$/, '.jpg');
        await this._runConvert([png, jpg]);
        jpgFiles.push(jpg);
        await fs.unlink(png);
      }
      return jpgFiles;
    }

    // 4) PNG request: return the PNGs directly
    return files;
  }

  _runPpdftoppm(input, prefix, fmt) {
    return new Promise((res, rej) => {
      const args = ['-r', '300', `-${fmt}`, input, prefix];
      const p = spawn('pdftoppm', args, { shell: false });
      p.on('error', rej);
      p.on('exit', code => code === 0 ? res() : rej(new Error(`pdftoppm exit ${code}`)));
    });
  }

  _runConvert(args) {
    return new Promise((res, rej) => {
      // on Windows use 'magick'; on Unix 'convert'
      const cmd = process.platform === 'win32' ? 'magick' : 'convert';
      const p = spawn(cmd, args, { shell: process.platform === 'win32' });
      p.on('error', rej);
      p.on('exit', code => code === 0 ? res() : rej(new Error(`${cmd} exit ${code}`)));
    });
  }
}
