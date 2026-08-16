const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.watchFolders = [];
config.resolver = {
  ...config.resolver,
  blockList: [
    /node_modules\/.*\/node_modules\/.*/,
    /\/.git\/.*/,
  ],
};

module.exports = config;
