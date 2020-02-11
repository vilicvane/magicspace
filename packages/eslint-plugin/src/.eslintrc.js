module.exports = {
  extends: ['plugin:@magicspace/default', 'prettier'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
