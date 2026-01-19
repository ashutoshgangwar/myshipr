// const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// module.exports = mergeConfig(getDefaultConfig(__dirname), {});

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// Get the default config
const defaultConfig = getDefaultConfig(__dirname);

// Modify assetExts and sourceExts to support SVG
const { assetExts, sourceExts } = defaultConfig.resolver;

const updatedConfig = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
  },
};

// Merge the default config with the custom SVG config
module.exports = mergeConfig(defaultConfig, updatedConfig);