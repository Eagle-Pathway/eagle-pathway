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

// 3. Allow Metro to walk up to find node_modules for package deps
config.resolver.disableHierarchicalLookup = false;

// Force Metro to ignore package.json "exports" (which selects ESM `.mjs` on web)
config.resolver.unstable_enablePackageExports = false;

// Prefer RN/CJS entrypoints (works for zustand + most RN libs)
config.resolver.resolverMainFields = ['react-native', 'main', 'browser'];

module.exports = config;