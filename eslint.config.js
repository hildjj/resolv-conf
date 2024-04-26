import base from '@cto.af/eslint-config';
import mod from '@cto.af/eslint-config/module.js';

export default [
  {
    ignores: [
      'docs/**',
      'coverage/**',
      '**/*.peg.js',
      '**/*.d.ts',
    ],
  },
  ...base,
  ...mod,
];
