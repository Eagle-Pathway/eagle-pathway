const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withCmakeArgs(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') return config;
    const contents = config.modResults.contents;
    const marker = 'targetSdkVersion rootProject.ext.targetSdkVersion';
    const block = `
        externalNativeBuild {
            cmake {
                arguments "-DCMAKE_OBJECT_PATH_MAX=120"
            }
        }`;
    if (contents.includes('CMAKE_OBJECT_PATH_MAX')) return config;
    config.modResults.contents = contents.replace(marker, marker + block);
    return config;
  });
};
