'use strict';

const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const PATHS = require('./paths');

// Merge webpack configuration files
const config = (env, argv) =>
  merge(common, {
    entry: {
      contentScript: PATHS.src + '/contentScript.ts',
      background: PATHS.src + '/background.ts',
      main: PATHS.src + '/scripts/main.ts'
    },
    devtool: argv.mode === 'production' ? false : 'source-map',
  });

module.exports = config;
