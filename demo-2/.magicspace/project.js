/** @type {import('@magicspace/core').ProjectConfig} */
module.exports = {
  name: 'demo',
  path: '.',
  extends: [
    '@magicspace/templates/typescript',
    {
      name: '@magicspace/templates/licenses/mit',
      options: {
        copyrightHolder: 'Chengdu Mufan Technology Co., Ltd.',
      },
    },
  ],
};
