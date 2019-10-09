# @magicspace/eslint-plugin

- `plugin:@magicspace/recommended`
- `plugin:@magicspace/override-dev`

## 安装

使用下面的命令来进行安装

```
yarn add @magicspace/eslint-plugin --dev
```

## 使用

使用的时候需要将 parserOptions.project 赋值成 tsconfig.json 相对于 eslintrc 的路径，就像下面这样。

```js
module.exports = {
  extends: [
    'plugin:@magicspace/recommended',
    'plugin:@magicspace/override-dev',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
```

## 关于规则

要查看我们写的规则的说明，请点[这里](https://github.com/makeflow/magicspace/tree/master/packages/tslint-rules/README.md)

## eslint vscode 插件的配置示例

```json
{
  "eslint.validate": [
    "javascript",
    {
      "language": "typescript",
      "autoFix": false
    }
  ],
  "typescript.tsdk": "node_modules\\typescript\\lib"
}
```
