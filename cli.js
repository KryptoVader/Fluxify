#!/usr/bin/env node
import PluginManager from './lib/converters/PluginManager.js';

const [,, inputPath, outputFormat, ...flags] = process.argv;

if (!inputPath || !outputFormat) {
  console.error('Usage: cli.js <inputPath> <outputFormat> [--highQuality] [--forceTranscode]');
  process.exit(1);
}

const opts = {
  highQuality: flags.includes('--highQuality'),
  forceTranscode: flags.includes('--forceTranscode'),
};

(async () => {
  try {
    const mgr = new PluginManager();
    const result = await mgr.convert(inputPath, outputFormat, opts);
    if (Array.isArray(result)) result.forEach(p => console.log(p));
    else console.log(result);
    process.exit(0);
  } catch (err) {
    console.error('Conversion error:', err);
    process.exit(2);
  }
})();
