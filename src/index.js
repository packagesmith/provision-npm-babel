#!/usr/bin/env node
import defaultsDeep from 'lodash.defaultsdeep';
import jsonFile from 'packagesmith.formats.json';
import { runProvisionerSet } from 'packagesmith';
import sortPackageJson from 'sort-package-json';
import unique from 'lodash.uniq';
const babelVersionFive = 5;
function configureBabelFive(packageJson, babelStage, babelRuntime) {
  packageJson.devDependencies.babel = '^5.8.34';
  if (typeof babelStage === 'number') {
    packageJson.babel.stage = babelStage;
  }
  if (babelRuntime) {
    packageJson.babel.optional = unique([ ...(packageJson.babel.optional || []), 'runtime' ]);
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies['babel-runtime'] = '^6.3.19';
  }
}
function defaultBabelPresets(stage) {
  const presets = { 'es2015': '^6.5.0' };
  if (typeof stage === 'number') {
    presets[`stage-${ stage }`] = '^6.5.0';
  }
  return presets;
}

export function provisionNpmBabel({
  babelConfig,
  scriptName = 'prepublish',
  babelVersion,
  babelStage,
  babelRuntime = false,
  babelPlugins = {},
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
          configureBabelFive(packageJson, babelStage, babelRuntime);
        } else {
          if ('babel' in packageJson.devDependencies) {
            Reflect.deleteProperty(packageJson.devDependencies, 'babel');
            Reflect.deleteProperty(packageJson.babel, 'loose');
            babelStage = packageJson.babel.stage;
            Reflect.deleteProperty(packageJson.babel, 'stage');
          }
          if (!babelPresets) {
            babelPresets = defaultBabelPresets(babelStage);
          }
          if (babelRuntime) {
            packageJson.dependencies = packageJson.dependencies || {};
            packageJson.dependencies['babel-runtime'] = packageJson.dependencies['babel-runtime'] || '^6.3.19';
            babelPlugins['transform-runtime'] = babelPlugins['transform-runtime'] || '^6.5.2';
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
          const plugins = Object.keys(babelPlugins).map((plugin) => {
            const shorthand = plugin.replace(/^babel-plugin-/, '');
            const longhand = `babel-plugin-${ shorthand }`;
            packageJson.devDependencies[longhand] = babelPlugins[plugin];
            return shorthand;
          });
          if (plugins.length) {
            packageJson.babel.plugins = plugins;
          }
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
