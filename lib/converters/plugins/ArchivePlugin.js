import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';

export default class ArchivePlugin {
  supportsInput() {
    return [
      'pdf',
      'docx',
      'xlsx',
      'xls',
      'csv',
      'json',
      'xml',
      'txt',
      'html',
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'svg',
      'tiff',
      'mp4',
      'avi',
      'mov',
      'wmv',
      'flv',
      'mkv',
      'mp3',
      'wav',
      'ogg',
      'flac'
    ];
  }  

  supportsOutput() {
    return [ 'zip' ];
  }

  async convert(inputPath, outputFormat) {
    if (outputFormat !== 'zip') {
      throw new Error(`Unsupported archive format: ${outputFormat}`);
    }

    const dir = path.dirname(inputPath);
    const base = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(dir, `${base}.zip`);

    // Ensure directory exists
    await fs.ensureDir(dir);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`→ ${outputPath} created (${archive.pointer()} total bytes)`);
        resolve(outputPath);
      });

      archive.on('error', err => reject(err));

      archive.pipe(output);
      archive.file(inputPath, { name: path.basename(inputPath) });
      archive.finalize();
    });
  }
}
