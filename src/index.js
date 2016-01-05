#!/usr/bin/env node
import jsonFile from 'packagesmith.formats.json';
import defaultsDeep from 'lodash.defaultsdeep';
import { runProvisionerSet } from 'packagesmith';
import sortPackageJson from 'sort-package-json';
const babelVersionFive = 5;
export function provisionNpmBabel(config) {
  return {
    'package.json': {
      after: 'npm install',
      contents: jsonFile((contents) => {
        const packageJson = {
          babel: config.babelConfig || {
            compact: false,
            ignore: 'node_modules',
            sourceMaps: 'inline',
          },
          devDependencies: {},
          scripts: {
            [config.scriptName || 'prepublish']: 'babel $npm_package_directories_src -d $npm_package_directories_lib',
          },
        };
        if (config.babelVersion === babelVersionFive) {
          packageJson.devDependencies.babel = '^5.8.34';
        } else {
          packageJson.devDependencies['babel-cli'] = '^6.3.17';
          packageJson.devDependencies['babel-core'] = '^6.3.26';
          packageJson.babel.presets = [];
          const presets = config.babelPresets || { 'es2015': '^6.3.13' };
          Object.keys(presets).forEach((preset) => {
            const shorthand = preset.replace(/^babel-preset-/, '');
            const longhand = `babel-preset-${shorthand}`;
            packageJson.devDependencies[longhand] = presets[preset];
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
  runProvisionerSet(process.argv[2] || '.', provisionNpmBabel());
}
