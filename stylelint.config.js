module.exports = {
  extends: [
    'stylelint-config-standard'
  ],
  rules: {
    'indentation': [2, { baseIndentLevel: 1 }],
    'at-rule-empty-line-before': ['always', {
      ignore: ['after-comment']
    }],
    'comment-whitespace-inside': 'always'
  }
};
