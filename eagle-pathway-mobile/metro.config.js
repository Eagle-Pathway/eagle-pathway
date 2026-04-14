const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to ignore package.json "exports" (which selects ESM `.mjs` on web)
config.resolver.unstable_enablePackageExports = false;

// Prefer RN/CJS entrypoints (works for zustand + most RN libs)
config.resolver.resolverMainFields = ['react-native', 'main', 'browser'];

module.exports = config;