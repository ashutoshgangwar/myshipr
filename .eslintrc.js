module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // Build-time scripts run in Node, not in the app: they use `require`,
      // `Buffer` and `console`, and the PNG codec in scripts/lib is bitwise
      // by nature. The React Native config assumes none of that exists.
      files: ['scripts/**/*.js'],
      env: {node: true},
      rules: {'no-bitwise': 'off'},
    },
  ],
};
