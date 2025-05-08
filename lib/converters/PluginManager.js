// lib/PluginManager.js
import LibreOfficePlugin from './plugins/LibreOfficePlugin.js';
import UnifiedPDFPlugin   from './plugins/UnifiedPDFPlugin.js';
import FFmpegPlugin       from './plugins/FFmpegPlugin.js';
import ImageMagickPDFPlugin from './plugins/ImageMagickPDFPlugin.js';
import ArchivePlugin      from './plugins/ArchivePlugin.js';
import ImageConversionPlugin from './plugins/ImageConversionPlugin.js';
import MiKTeXPDFPlugin    from './plugins/MiKTeXPDFPlugin.js';
import TextPlugin         from './plugins/TextPlugin.js';
import UnifiedTablePlugin from './plugins/UnifiedTablePlugin.js';

export default class PluginManager {
  constructor() {
    this.plugins = [];
    this.register(new LibreOfficePlugin());
    this.register(new UnifiedPDFPlugin());
    this.register(new FFmpegPlugin());
    this.register(new ImageMagickPDFPlugin());
    this.register(new ArchivePlugin());
    this.register(new ImageConversionPlugin());
    this.register(new MiKTeXPDFPlugin());
    this.register(new TextPlugin());
    this.register(new UnifiedTablePlugin());
  }

  register(plugin) {
    this.plugins.push(plugin);
  }

  getSupportedFormats() {
    const map = {};
    this.plugins.forEach(p => {
      p.supportsInput().forEach(inExt => {
        map[inExt] = map[inExt] || [];
        map[inExt].push(...p.supportsOutput());
        map[inExt] = [...new Set(map[inExt])];
      });
    });
    return map;
  }

  /**
   * Convert a file using the appropriate plugin.
   *
   * @param {string} inputPath        Absolute path to the input file.
   * @param {string} outputFormat     Desired extension (e.g. "pdf", "mp4").
   * @param {Object} [opts]           Optional settings.
   * @param {(bytes: number) => void} [opts.onProgress]  Called with processed-bytes updates.
   * @param {boolean} [opts.highQuality]                  FFmpeg‐only: use slower, higher-quality settings.
   * @param {boolean} [opts.forceTranscode]               FFmpeg‐only: re-encode even if same format.
   * @returns {Promise<string|string[]>}                  Path or array of paths to the converted file(s).
   */
  async convert(inputPath, outputFormat, opts = {}) {
    const ext = inputPath.split('.').pop().toLowerCase();
    const plugin = this.plugins.find(p =>
      p.supportsInput().includes(ext) &&
      p.supportsOutput().includes(outputFormat)
    );
    if (!plugin) {
      throw new Error(`No plugin for ${ext} → ${outputFormat}`);
    }

    // All plugins should accept (inputPath, outputFormat, opts).
    // Plugins that don't care about opts simply ignore unknown properties.
    return plugin.convert(inputPath, outputFormat, opts);
  }
}
