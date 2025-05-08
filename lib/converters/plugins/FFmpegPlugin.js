import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

/**
 * @typedef {Object} FFmpegOptions
 * @property {boolean} [highQuality]       Use HQ settings (slower, better)
 * @property {boolean} [forceTranscode]    Even if same format, re-encode
 * @property {string}  [videoCodec]        e.g. 'libx264'
 * @property {string}  [audioCodec]        e.g. 'aac'
 * @property {string}  [audioBitrate]      e.g. '192k'
 * @property {string}  [preset]            e.g. 'slow', 'medium'
 * @property {number}  [crf]               e.g. 18 (lower is better quality)
 * @property {string}  [filters]           e.g. 'fps=15,scale=320:-1'
 */
export default class FFmpegPlugin {
  supportsInput() {
    return [
      'mp4','avi','mov','mkv','webm','flv','wmv','3gp',  // video
      'mp3','wav','aac','ogg','flac','m4a'               // audio
    ];
  }

  supportsOutput() {
    return [
      'mp4','avi','mov','mkv','webm','flv','wmv','3gp','gif', // video
      'mp3','wav','aac','ogg','flac','m4a'                    // audio
    ];
  }

  /**
   * Convert a file using ffmpeg.
   * @param {string} inputPath
   * @param {string} outputFormat
   * @param {FFmpegOptions} [opts]
   * @returns {Promise<string>} Resolves with the output file path
   */
  convert(inputPath, outputFormat, opts = {}) {
    const {
      highQuality = false,
      forceTranscode = false,
      videoCodec = 'libx264',
      audioCodec,
      audioBitrate,
      preset,
      crf,
      filters,
    } = opts;

    const useHQ = highQuality;

    return new Promise(async (resolve, reject) => {
      const extIn = path.extname(inputPath).slice(1).toLowerCase();
      const base  = path.basename(inputPath, `.${extIn}`);
      const dir   = path.dirname(inputPath);
      const out   = path.join(dir, `${base}.${outputFormat}`);

      const isVideoIn  = this._isVideo(extIn);
      const isAudioIn  = this._isAudio(extIn);
      const isVideoOut = this._isVideo(outputFormat);
      const isAudioOut = this._isAudio(outputFormat);

      // Basic validations
      if (!this.supportsInput().includes(extIn)) {
        return reject(new Error(`Unsupported input format: .${extIn}`));
      }
      if (!this.supportsOutput().includes(outputFormat)) {
        return reject(new Error(`Unsupported output format: .${outputFormat}`));
      }
      if (isAudioIn && isVideoOut) {
        return reject(new Error(`Cannot convert audio (.${extIn}) to video (.${outputFormat})`));
      }

      // Build ffmpeg args
      const args = ['-y', '-i', inputPath];

      // Video output settings
      if (isVideoOut) {
        if (isVideoIn && extIn === outputFormat && !forceTranscode) {
          args.push('-c', 'copy');
        } else {
          args.push(
            '-c:v', videoCodec,
            '-preset', preset || (useHQ ? 'slow' : 'medium'),
            '-crf',   String(crf ?? (useHQ ? 18 : 23)),
            '-c:a',   audioCodec || 'aac',
          );
          if (audioBitrate || useHQ) {
            args.push('-b:a', audioBitrate || '192k');
          }
        }

      // Audio only output
      } else if (isAudioOut) {
        args.push('-vn');
        if (isAudioIn && extIn === outputFormat && !forceTranscode) {
          args.push('-c:a', 'copy');
        } else {
          const aCodec = audioCodec || this._audioCodecFor(outputFormat);
          args.push('-c:a', aCodec);
          if (audioBitrate || useHQ) {
            args.push('-b:a', audioBitrate || '192k');
          }
        }
      }

      // GIF special filters
      if (outputFormat === 'gif') {
        args.push('-vf', filters || 'fps=15,scale=320:-1', '-an');
      }

      args.push(out);

      // Ensure output directory exists
      await fs.ensureDir(dir);

      // Spawn ffmpeg
      const ff = spawn('ffmpeg', args, { stdio: 'inherit' });
      ff.on('error', reject);
      ff.on('exit', code =>
        code === 0
          ? resolve(out)
          : reject(new Error(`FFmpeg exited with code ${code}`))
      );
    });
  }

  _isVideo(ext) {
    return ['mp4','avi','mov','mkv','webm','flv','wmv','3gp'].includes(ext);
  }

  _isAudio(ext) {
    return ['mp3','wav','aac','ogg','flac','m4a'].includes(ext);
  }

  _audioCodecFor(ext) {
    switch (ext) {
      case 'mp3': return 'libmp3lame';
      case 'aac': return 'aac';
      case 'ogg': return 'libvorbis';
      case 'flac': return 'flac';
      case 'wav': return 'pcm_s16le';
      case 'm4a': return 'aac';
      default:    return 'copy';
    }
  }
}
