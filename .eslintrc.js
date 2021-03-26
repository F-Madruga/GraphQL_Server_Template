module.exports = {
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    project: './tsconfig.json',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'max-len': ['warn', {
      code: 100,
      tabWidth: 2,
      ignoreComments: true,
      ignoreTrailingComments: true,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true,
    }],
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
    'radix': 'off',
    'no-underscore-dangle': 'off',
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
    'max-classes-per-file': ['error', 5],
  },
};
