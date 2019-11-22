const path = require('path');

/**
 * 把window下的反斜杠路径转换成斜杆
 * 因为glob模块指定只能用斜杆
 */
function convertBackwardSlashes(text) {
  return text.replace(/\\/g, '/');
}

const esDir = convertBackwardSlashes(path.join(__dirname, '../es'));
const libDir = convertBackwardSlashes(path.join(__dirname, '../lib'));
const srcDir = convertBackwardSlashes(path.join(__dirname, '../src'));

module.exports = { esDir, libDir, srcDir };
