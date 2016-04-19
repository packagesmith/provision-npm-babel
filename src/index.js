#!/usr/bin/env node
import defaultsDeep from 'lodash.defaultsdeep';
import jsonFile from 'packagesmith.formats.json';
import { runProvisionerSet } from 'packagesmith';
import sortPackageJson from 'sort-package-json';
import { sortRange as sortSemverRanges } from 'semver-addons';
import unique from 'lodash.uniq';
import versions from '../versions';
const babelVersionFive = 5;
function configureBabelFive(packageJson, babelStage, babelRuntime) {
  packageJson.devDependencies.babel = sortSemverRanges(
    versions.five.babel,
    packageJson.devDependencies.babel || '0.0.0'
  ).pop();
  if (typeof babelStage === 'number') {
    packageJson.babel.stage = babelStage;
  }
  if (babelRuntime) {
    packageJson.babel.optional = unique([ ...(packageJson.babel.optional || []), 'runtime' ]);
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies['babel-runtime'] = sortSemverRanges(
      versions.five['babel-runtime'],
      packageJson.dependencies['babel-runtime'] || '0.0.0'
    ).pop();
  }
}

function defaultBabelPresets(stage) {
  const presets = { 'es2015': versions.six['babel-preset-es2015'] };
  if (typeof stage === 'number') {
    presets[`stage-${ stage }`] = versions.six[`babel-preset-stage-${ stage }`];
  }
  return presets;
}

function configurePlugins(packageJson, babelPlugins) {
  const plugins = Object.keys(babelPlugins).map((plugin) => {
    const shorthand = plugin.replace(/^babel-plugin-/, '');
    const longhand = `babel-plugin-${ shorthand }`;
    packageJson.devDependencies[longhand] = sortSemverRanges(
      babelPlugins[plugin],
      packageJson.devDependencies[longhand] || '0.0.0'
    ).pop();
    return shorthand;
  });
  if (plugins.length) {
    packageJson.babel.plugins = plugins;
  }
}

function configureBabelSix(packageJson, babelStage, babelPresets, babelPlugins, babelRuntime) {
  // Detect and remove old babel 5 config
  if ('babel' in packageJson.devDependencies) {
    delete packageJson.devDependencies.babel;
    if ('stage' in packageJson.babel) {
      babelStage = packageJson.babel.stage;
      delete packageJson.babel.stage;
    }
  }
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
  packageJson.devDependencies['babel-cli'] = sortSemverRanges(
    versions.six['babel-cli'],
    packageJson.devDependencies['babel-cli'] || '0.0.0'
  ).pop();
  packageJson.devDependencies['babel-core'] = sortSemverRanges(
    versions.six['babel-core'],
    packageJson.devDependencies['babel-core'] || '0.0.0'
  ).pop();
  packageJson.babel.presets = [];
  Object.keys(babelPresets).forEach((preset) => {
    const shorthand = preset.replace(/^babel-preset-/, '');
    const longhand = `babel-preset-${ shorthand }`;
    packageJson.devDependencies[longhand] = sortSemverRanges(
      babelPresets[preset],
      packageJson.devDependencies[longhand] || '0.0.0'
    ).pop();
    packageJson.babel.presets.push(shorthand);
  });
  configurePlugins(packageJson, babelPlugins);
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
        const packageJson = defaultsDeep({
          babel: babelConfig || {
            compact: false,
            ignore: 'node_modules',
            sourceMaps: 'inline',
          },
          devDependencies: {},
          scripts: {
            [scriptName]: 'babel $npm_package_directories_src -d $npm_package_directories_lib',
          },
        }, contents, {
          directories: {
            lib: 'lib',
            src: 'src',
          },
        });
        if (babelVersion === babelVersionFive) {
          configureBabelFive(packageJson, babelStage, babelRuntime);
        } else {
          configureBabelSix(packageJson, babelStage, babelPresets, babelPlugins, babelRuntime);
        }
        return sortPackageJson(packageJson);
      }),
    },
  };
}
export default provisionNpmBabel;

if (require.main === module) {
  const directoryArgPosition = 2;
  runProvisionerSet(process.argv[directoryArgPosition] || '.', provisionNpmBabel());
}
