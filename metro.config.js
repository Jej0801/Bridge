const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.watchFolders = [];

// Store the original resolver
const defaultResolver = config.resolver.resolveRequest;

config.resolver = {
  ...config.resolver,
  blockList: [
    /node_modules\/.*\/node_modules\/.*/,
    /\/.git\/.*/,
  ],
  // Custom resolver to handle react-native-maps on web
  resolveRequest: (context, moduleName, platform) => {
    // Mock react-native-maps on web to prevent bundling errors
    if (platform === 'web' && moduleName === 'react-native-maps') {
      return {
        type: 'empty',
      };
    }

    // Use default resolver for everything else
    if (defaultResolver) {
      return defaultResolver(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
