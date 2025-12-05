const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);

  return mergeConfig(defaultConfig, {
    transformer: {
      babelTransformerPath: require.resolve("react-native-svg-transformer"),
    },
    resolver: {
      // Keep all default asset extensions except svg
      assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== "svg"),
      // Add svg to source extensions
      sourceExts: [...defaultConfig.resolver.sourceExts, "svg"],
    },
  });
})();
