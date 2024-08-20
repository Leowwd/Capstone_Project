<<<<<<< HEAD
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
=======
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: ['react-native-reanimated/plugin'],
};
>>>>>>> 857b88a35aa5ceea6a42940a354ddc829644121b
