/**
 * Metro's Babel transformer for this project.
 *
 * It is `react-native-svg-transformer` with one thing added: a cache key.
 *
 * The SVG transformer exports no `getCacheKey`, so nothing about our Babel
 * setup reaches Metro's transform cache — edit babel.config.js and Metro
 * happily keeps serving modules it compiled under the *old* config. That is
 * how adding `react-native-worklets/plugin` produced a red screen reading
 * "Cannot read property 'bytecode' of undefined": the app's own files were
 * recompiled (they had changed), but the worklets library's untouched files
 * came back from cache still un-workletised, so their `__initData` was never
 * generated.
 *
 * Hashing babel.config.js into the key makes a Babel change invalidate the
 * cache on its own, instead of leaving everyone to remember --reset-cache.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const svgTransformer = require('react-native-svg-transformer');

module.exports = {
  ...svgTransformer,

  getCacheKey() {
    return crypto
      .createHash('sha1')
      .update(fs.readFileSync(path.join(__dirname, 'babel.config.js')))
      .digest('hex');
  },
};
