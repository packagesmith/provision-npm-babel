#!/usr/bin/env node
import defaultsDeep from 'lodash.defaultsdeep';
import jsonFile from 'packagesmith.formats.json';
import { runProvisionerSet } from 'packagesmith';
import sortPackageJson from 'sort-package-json';
import unique from 'lodash.uniq';
import versions from '../versions';
const babelVersionFive = 5;
function configureBabelFive(packageJson, babelStage, babelRuntime) {
  packageJson.devDependencies.babel = versions.five.babel;
  if (typeof babelStage === 'number') {
    packageJson.babel.stage = babelStage;
  }
  if (babelRuntime) {
    packageJson.babel.optional = unique([ ...(packageJson.babel.optional || []), 'runtime' ]);
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies['babel-runtime'] = versions.five['babel-runtime'];
  }
}
function defaultBabelPresets(stage) {
  const presets = { 'es2015': versions.six['babel-preset-es2015'] };
  if (typeof stage === 'number') {
    presets[`stage-${ stage }`] = versions.six[`babel-preset-stage-${ stage }`];
  }
  return presets;
}

function determineExistingBabelConfig(existingPackageJson) {
  const config = {};
  if ('babel' in (existingPackageJson.devDependencies || {})) {
    delete existingPackageJson.devDependencies.babel;
    if ('stage' in (existingPackageJson.babel || {})) {
      config.babelStage = (existingPackageJson.babel || {}).stage;
      delete existingPackageJson.babel.stage;
    }
  }
  return config;
}

function configurePlugins(packageJson, babelPlugins) {
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
          // Detect and remove old babel 5 config
          const existingConfig = determineExistingBabelConfig(contents);
          babelStage = existingConfig.babelStage || babelStage;
          if (!babelPresets) {
            babelPresets = defaultBabelPresets(babelStage);
          }
          if (babelRuntime) {
            packageJson.dependencies = packageJson.dependencies || {};
            if (!packageJson.dependencies['babel-runtime']) {
              packageJson.dependencies['babel-runtime'] = versions.six['babel-runtime'];
            }
            if (!babelPlugins['transform-runtime']) {
              babelPlugins['transform-runtime'] = versions.six['babel-plugin-transform-runtime'];
            }
          }
          packageJson.devDependencies['babel-cli'] = versions.six['babel-cli'];
          packageJson.devDependencies['babel-core'] = versions.six['babel-core'];
          packageJson.babel.presets = [];
          Object.keys(babelPresets).forEach((preset) => {
            const shorthand = preset.replace(/^babel-preset-/, '');
            const longhand = `babel-preset-${ shorthand }`;
            packageJson.devDependencies[longhand] = babelPresets[preset];
            packageJson.babel.presets.push(shorthand);
          });
          configurePlugins(packageJson, babelPlugins);
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
