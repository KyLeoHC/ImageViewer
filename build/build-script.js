/*
 * Compile components
 */
const path = require('path');
const del = require('del');
const merge = require('merge2');
const babel = require('@babel/core');
const through2 = require('through2');
const {
  src,
  dest,
  series
} = require('gulp');
const rename = require('gulp-rename');
const ts = require('gulp-typescript');
const { esDir, libDir, srcDir } = require('./config');
const babelConfig = {
  configFile: path.join(__dirname, '../babel.config.js')
};
const tsCompilerOptions = Object.assign(
  require('../tsconfig.json').compilerOptions,
  {
    declaration: true
  }
);

/**
 * callback for 'through2.obj'
 */
function compileTSX(file, _, cb) {
  const { code } = babel.transformSync(file.contents.toString(), babelConfig);
  file.contents = Buffer.from(code);
  cb(null, file);
}

function copyToDir() {
  del.sync([esDir, libDir], {
    force: true
  });
  return src([`${srcDir}/**/*`])
    .pipe(dest(esDir))
    .pipe(dest(libDir));
}

function compileTSXToES() {
  process.env.BABEL_MODULE = 'es';
  return src([`${esDir}/**/*.ts`, `!${esDir}/**/*.d.ts`])
    .pipe(through2.obj(compileTSX))
    .pipe(rename({
      extname: '.js'
    }))
    .pipe(dest(esDir));
}

function compileTSXToLib() {
  process.env.BABEL_MODULE = 'commonjs';
  return src([`${libDir}/**/*.ts`, `!${libDir}/**/*.d.ts`])
    .pipe(through2.obj(compileTSX))
    .pipe(rename({
      extname: '.js'
    }))
    .pipe(dest(libDir));
}

function generateDefinitionFiles() {
  const typesFiles = path.join(__dirname, '../types/**/*.d.ts');
  const esResult = src([
    typesFiles,
    `${esDir}/**/*.ts`
  ]).pipe(ts(tsCompilerOptions));
  const libResult = src([
    typesFiles,
    `${libDir}/**/*.ts`
  ]).pipe(ts(tsCompilerOptions));
  return merge([
    esResult.dts.pipe(dest(esDir)),
    libResult.dts.pipe(dest(libDir))
  ]);
}

async function cleanUselessFile() {
  await del([
    `${esDir}/**/*.ts`,
    `${libDir}/**/*.ts`,
    `!${esDir}/**/*.d.ts`,
    `!${libDir}/**/*.d.ts`
  ], {
    force: true
  });
}

exports.default = series(
  copyToDir,
  compileTSXToES,
  compileTSXToLib,
  generateDefinitionFiles,
  cleanUselessFile
);
