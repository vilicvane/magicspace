let plugins = [];

if (process.argv[1] && process.argv[1].includes('dbaeumer.vscode-eslint')) {
  plugins.push('only-warn');
}

export const overrideDevConfig = {
  plugins,
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
      },
    ],
  },
};
