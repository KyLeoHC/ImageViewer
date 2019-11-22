const {
  src,
  dest,
  series
} = require('gulp');
const less = require('gulp-less');
const postcss = require('gulp-postcss');
const postcssLoadConfig = require('postcss-load-config');
const postcssConfig = postcssLoadConfig.sync();
const { esDir, libDir } = require('./config');
postcssConfig.plugins.push(require('cssnano'));

function compileLess(files) {
  return src(files)
    .pipe(less())
    .pipe(postcss(postcssConfig.plugins));
}

function compileESLess() {
  return compileLess(`${esDir}/**/index.less`)
    .pipe(dest(esDir));
}

function compileLibLess() {
  return compileLess(`${libDir}/**/index.less`)
    .pipe(dest(libDir));
}

exports.default = series(compileESLess, compileLibLess);
