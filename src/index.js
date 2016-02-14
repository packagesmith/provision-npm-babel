#!/usr/bin/env node
import defaultsDeep from 'lodash.defaultsdeep';
import jsonFile from 'packagesmith.formats.json';
import { runProvisionerSet } from 'packagesmith';
import sortPackageJson from 'sort-package-json';
const babelVersionFive = 5;
export function provisionNpmBabel({
  babelConfig,
  scriptName = 'prepublish',
  babelVersion,
  babelStage,
  babelPresets = null,
} = {}) {
  return {
    'package.json': {
      after: 'npm install',
      contents: jsonFile((contents) => {
        const packageJson = {
          babel: babelConfig || {
            compact: false,
            ignore: 'node_modules',
            sourceMaps: 'inline',
          },
          devDependencies: {},
          scripts: {
            [scriptName]: 'babel $npm_package_directories_src -d $npm_package_directories_lib',
          },
        };
        if (babelVersion === babelVersionFive) {
          packageJson.devDependencies.babel = '^5.8.34';
          if (typeof babelStage === 'number') {
            packageJson.babel.stage = babelStage;
          }
        } else {
          if ('babel' in packageJson.devDependencies) {
            Reflect.deleteProperty(packageJson.devDependencies, 'babel');
            Reflect.deleteProperty(packageJson.babel, 'loose');
            babelStage = packageJson.babel.stage;
            Reflect.deleteProperty(packageJson.babel, 'stage');
          }
          if (!babelPresets) {
            babelPresets = { 'es2015': '^6.5.0' };
            if (typeof babelStage === 'number') {
              babelPresets[`stage-${ babelStage }`] = '^6.5.0';
            }
          }
          packageJson.devDependencies['babel-cli'] = '^6.5.1';
          packageJson.devDependencies['babel-core'] = '^6.5.2';
          packageJson.babel.presets = [];
          Object.keys(babelPresets).forEach((preset) => {
            const shorthand = preset.replace(/^babel-preset-/, '');
            const longhand = `babel-preset-${ shorthand }`;
            packageJson.devDependencies[longhand] = babelPresets[preset];
            packageJson.babel.presets.push(shorthand);
          });
        }
        return sortPackageJson(defaultsDeep(packageJson, contents, {
          directories: {
            lib: 'lib',
            src: 'src',
          },
        }));
      }),
    },
  };
}
export default provisionNpmBabel;

if (require.main === module) {
  const directoryArgPosition = 2;
  runProvisionerSet(process.argv[directoryArgPosition] || '.', provisionNpmBabel());
}
