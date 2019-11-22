module.exports = {
  root: true,
  env: {
    browser: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true
    }
  },
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    // add more generic rulesets here, such as:
    'standard',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    // typescript-eslint rules
    '@typescript-eslint/indent': ['error', 2],
    // once typescript-eslint support these rules, we will remove it
    'space-before-function-paren': ['error', {
      'anonymous': 'always',
      'named': 'never',
      'asyncArrow': 'ignore'
    }],
    'semi': ['error', 'always'],
    'lines-between-class-members': 0
  }
};
