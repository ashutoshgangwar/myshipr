module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      },
    ],
    // Reanimated 4 (pulled in by react-native-reanimated-skeleton) compiles its
    // animations through react-native-worklets. The plugin rewrites the worklet
    // functions so they can run on the UI thread — without it every skeleton
    // throws "Reanimated is not configured correctly" at runtime.
    // MUST stay last: it has to see the code after every other transform.
    'react-native-worklets/plugin',
  ],
};
