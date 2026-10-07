export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'declaration-no-important': true,
    'selector-max-id': 0,
    'max-nesting-depth': 3,
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'theme',
          'utility',
          'variant',
          'custom-variant',
          'apply',
          'source',
          'reference',
        ],
      },
    ],
    'import-notation': 'string',
    'at-rule-prelude-no-invalid': [
      true,
      { ignoreAtRules: ['apply', 'theme', 'custom-variant'] },
    ],
    // Match upstream shadcn tokens without rewriting the default theme.
    'lightness-notation': 'number',
    'hue-degree-notation': 'number',
  },
}
