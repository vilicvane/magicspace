export const overrideDevConfig = {
  rules: {
    'import/no-extraneous-dependencies': [
      'warn',
      {
        devDependencies: true,
      },
    ],
  },
};
