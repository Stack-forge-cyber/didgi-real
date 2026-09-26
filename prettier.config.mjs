export default {
  printWidth: 100,
  trailingComma: 'es5',
  semi: true,
  useTabs: false,
  tabWidth: 4,
  singleQuote: true,
  endOfLine: 'lf',

  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: ['^reflect-metadata$', '<BUILTIN_MODULES>', '<THIRD_PARTY_MODULES>', '^../(.*)$', '^./(.*)$'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderSideEffects: false,
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
};
