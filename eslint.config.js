import base from '@cto.af/eslint-config';
import mod from '@cto.af/eslint-config/module.js';

export default [
  {
    ignores: [
      'lib/**',
      'docs/**',
      'coverage/**',
      '**/*.peg.js',
    ],
  },
  ...base,
  ...mod,
];
