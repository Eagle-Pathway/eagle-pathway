const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the workspace root for shared files
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to find node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve the shared package correctly
// config.resolver.disableHierarchicalLookup = true; // Optional, use if still failing

// Force Metro to ignore package.json "exports" (which selects ESM `.mjs` on web)
config.resolver.unstable_enablePackageExports = false;

// Prefer RN/CJS entrypoints (works for zustand + most RN libs)
config.resolver.resolverMainFields = ['react-native', 'main', 'browser'];

module.exports = config;