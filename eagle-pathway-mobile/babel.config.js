module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // 👈 this already includes router support
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@store': './src/store',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@types': './src/types',
          },
        },
      ],
      'react-native-reanimated/plugin', // must stay last
    ],
  };
};