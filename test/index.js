import chai from 'chai';
chai.should();
import provisionNpmBabel from '../src/';
import versions from '../versions';
describe('provisionNpmBabel', () => {

  it('returns an object with `package.json`.`contents` function', () => {
    provisionNpmBabel()
      .should.be.an('object')
      .with.keys([ 'package.json' ])
      .with.property('package.json')
        .with.keys([ 'contents', 'after' ])
        .with.property('contents')
          .that.is.a('function');
  });

  describe('contents function', () => {
    let subFunction = null;
    beforeEach(() => {
      subFunction = provisionNpmBabel()['package.json'].contents;
    });

    describe('with babelVersion 5', () => {
      beforeEach(() => {
        subFunction = provisionNpmBabel({
          babelVersion: 5,
        })['package.json'].contents;
      });

      it('adds babel directives to json', () => {
        JSON.parse(subFunction('{}'))
          .should.deep.equal({
            directories: {
              lib: 'lib',
              src: 'src',
            },
            devDependencies: {
              babel: versions.five.babel || 'NO VERSION',
            },
            babel: {
              compact: false,
              ignore: 'node_modules',
              sourceMaps: 'inline',
            },
            scripts: {
              'prepublish': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

      it('does not override already present directories values', () => {
        JSON.parse(subFunction('{"directories":{"lib":"foo","src":"bar"}}'))
          .should.deep.equal({
            directories: {
              lib: 'foo',
              src: 'bar',
            },
            devDependencies: {
              babel: versions.five.babel || 'NO VERSION',
            },
            babel: {
              compact: false,
              ignore: 'node_modules',
              sourceMaps: 'inline',
            },
            scripts: {
              'prepublish': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

      it('overrides `babel` with `babelConfig` option', () => {
        subFunction = provisionNpmBabel({
          babelVersion: 5,
          babelConfig: {
            compact: true,
            stage: 2,
          },
        })['package.json'].contents;

        JSON.parse(subFunction('{}'))
          .should.deep.equal({
            directories: {
              lib: 'lib',
              src: 'src',
            },
            devDependencies: {
              babel: versions.five.babel || 'NO VERSION',
            },
            babel: {
              compact: true,
              stage: 2,
            },
            scripts: {
              'prepublish': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

      it('changes scripts name with `scriptName` option', () => {
        subFunction = provisionNpmBabel({
          babelVersion: 5,
          scriptName: 'build:js',
        })['package.json'].contents;

        JSON.parse(subFunction('{}'))
          .should.deep.equal({
            directories: {
              lib: 'lib',
              src: 'src',
            },
            devDependencies: {
              babel: versions.five.babel || 'NO VERSION',
            },
            babel: {
              compact: false,
              ignore: 'node_modules',
              sourceMaps: 'inline',
            },
            scripts: {
              'build:js': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

      it('adds stage option when given `babelStage` number', () => {
        subFunction = provisionNpmBabel({
          babelVersion: 5,
          babelStage: 2,
        })['package.json'].contents;

        JSON.parse(subFunction('{}'))
          .should.deep.equal({
            directories: {
              lib: 'lib',
              src: 'src',
            },
            devDependencies: {
              babel: versions.five.babel || 'NO VERSION',
            },
            babel: {
              compact: false,
              ignore: 'node_modules',
              sourceMaps: 'inline',
              stage: 2,
            },
            scripts: {
              'prepublish': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

      it('adds runtime option when `babelRuntime` is truthy', () => {
        subFunction = provisionNpmBabel({
          babelVersion: 5,
          babelRuntime: true,
        })['package.json'].contents;

        JSON.parse(subFunction('{}'))
          .should.deep.equal({
            directories: {
              lib: 'lib',
              src: 'src',
            },
            devDependencies: {
              babel: versions.five.babel || 'NO VERSION',
            },
            dependencies: {
              'babel-runtime': versions.five['babel-runtime'] || 'NO VERSION',
            },
            babel: {
              compact: false,
              ignore: 'node_modules',
              sourceMaps: 'inline',
              optional: [ 'runtime' ],
            },
            scripts: {
              'prepublish': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

    });

    describe('with babelVersion 6', () => {
      beforeEach(() => {
        subFunction = provisionNpmBabel({
          babelVersion: 6,
        })['package.json'].contents;
      });

      it('adds babel directives to json', () => {
        JSON.parse(subFunction('{}'))
          .should.deep.equal({
            directories: {
              lib: 'lib',
              src: 'src',
            },
            devDependencies: {
              'babel-cli': versions.six['babel-cli'] || 'NO VERSION',
              'babel-core': versions.six['babel-core'] || 'NO VERSION',
              'babel-preset-es2015': versions.six['babel-preset-es2015'] || 'NO VERSION',
            },
            babel: {
              presets: [ 'es2015' ],
              compact: false,
              ignore: 'node_modules',
              sourceMaps: 'inline',
            },
            scripts: {
              'prepublish': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

      it('overrides `babel` with `babelConfig` option, but retains presets', () => {
        subFunction = provisionNpmBabel({
          babelVersion: 6,
          babelConfig: {
            compact: true,
          },
        })['package.json'].contents;

        JSON.parse(subFunction('{}'))
          .should.deep.equal({
            directories: {
              lib: 'lib',
              src: 'src',
            },
            devDependencies: {
              'babel-cli': versions.six['babel-cli'] || 'NO VERSION',
              'babel-core': versions.six['babel-core'] || 'NO VERSION',
              'babel-preset-es2015': versions.six['babel-preset-es2015'] || 'NO VERSION',
            },
            babel: {
              presets: [ 'es2015' ],
              compact: true,
            },
            scripts: {
              'prepublish': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

      it('overrides `presets` with `babelPresets` option', () => {
        subFunction = provisionNpmBabel({
          babelVersion: 6,
          babelPresets: {
            'es2015': '^1.2.3',
            'stage-0': '^4.5.6',
            'react': '^7.8.9',
          },
          babelConfig: {
            compact: true,
          },
        })['package.json'].contents;

        JSON.parse(subFunction('{}'))
          .should.deep.equal({
            directories: {
              lib: 'lib',
              src: 'src',
            },
            devDependencies: {
              'babel-cli': versions.six['babel-cli'] || 'NO VERSION',
              'babel-core': versions.six['babel-core'] || 'NO VERSION',
              'babel-preset-es2015': '^1.2.3',
              'babel-preset-stage-0': '^4.5.6',
              'babel-preset-react': '^7.8.9',
            },
            babel: {
              presets: [ 'es2015', 'stage-0', 'react' ],
              compact: true,
            },
            scripts: {
              'prepublish': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

      it('overrides `plugins` with `babelPlugins` option', () => {
        subFunction = provisionNpmBabel({
          babelVersion: 6,
          babelPlugins: {
            'transform-regenerator': '^1.2.3',
          },
        })['package.json'].contents;

        JSON.parse(subFunction('{}'))
          .should.deep.equal({
            directories: {
              lib: 'lib',
              src: 'src',
            },
            devDependencies: {
              'babel-cli': versions.six['babel-cli'] || 'NO VERSION',
              'babel-core': versions.six['babel-core'] || 'NO VERSION',
              'babel-preset-es2015': versions.six['babel-preset-es2015'] || 'NO VERSION',
              'babel-plugin-transform-regenerator': '^1.2.3',
            },
            babel: {
              compact: false,
              ignore: 'node_modules',
              presets: [ 'es2015' ],
              plugins: [ 'transform-regenerator' ],
              sourceMaps: 'inline',
            },
            scripts: {
              'prepublish': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

      it('changes scripts name with `scriptName` option', () => {
        subFunction = provisionNpmBabel({
          babelVersion: 6,
          scriptName: 'build:js',
        })['package.json'].contents;

        JSON.parse(subFunction('{}'))
          .should.deep.equal({
            directories: {
              lib: 'lib',
              src: 'src',
            },
            devDependencies: {
              'babel-cli': versions.six['babel-cli'] || 'NO VERSION',
              'babel-core': versions.six['babel-core'] || 'NO VERSION',
              'babel-preset-es2015': versions.six['babel-preset-es2015'] || 'NO VERSION',
            },
            babel: {
              presets: [ 'es2015' ],
              compact: false,
              ignore: 'node_modules',
              sourceMaps: 'inline',
            },
            scripts: {
              'build:js': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

      it('adds stage preset when given `babelStage` number without presets', () => {
        subFunction = provisionNpmBabel({
          babelStage: 2,
        })['package.json'].contents;

        JSON.parse(subFunction('{}'))
          .should.deep.equal({
            directories: {
              lib: 'lib',
              src: 'src',
            },
            devDependencies: {
              'babel-cli': versions.six['babel-cli'] || 'NO VERSION',
              'babel-core': versions.six['babel-core'] || 'NO VERSION',
              'babel-preset-es2015': versions.six['babel-preset-es2015'] || 'NO VERSION',
              'babel-preset-stage-2': versions.six['babel-preset-stage-2'] || 'NO VERSION',
            },
            babel: {
              presets: [ 'es2015', 'stage-2' ],
              compact: false,
              ignore: 'node_modules',
              sourceMaps: 'inline',
            },
            scripts: {
              'prepublish': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

      it('adds runtime plugin when `babelRuntime` is truthy', () => {
        subFunction = provisionNpmBabel({
          babelRuntime: true,
        })['package.json'].contents;

        JSON.parse(subFunction('{}'))
          .should.deep.equal({
            directories: {
              lib: 'lib',
              src: 'src',
            },
            dependencies: {
              'babel-runtime': versions.six['babel-runtime'] || 'NO VERSION',
            },
            devDependencies: {
              'babel-cli': versions.six['babel-cli'] || 'NO VERSION',
              'babel-core': versions.six['babel-core'] || 'NO VERSION',
              'babel-preset-es2015': versions.six['babel-preset-es2015'] || 'NO VERSION',
              'babel-plugin-transform-runtime': versions.six['babel-plugin-transform-runtime'] || 'NO VERSION',
            },
            babel: {
              presets: [ 'es2015' ],
              plugins: [ 'transform-runtime' ],
              compact: false,
              ignore: 'node_modules',
              sourceMaps: 'inline',
            },
            scripts: {
              'prepublish': 'babel $npm_package_directories_src -d $npm_package_directories_lib',
            },
          });
      });

    });

  });

});
