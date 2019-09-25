# @magicspace/eslint-plugin

## 安装
使用下面的命令来进行安装
```
yarn add @magicspace/eslint-plugin --dev
```

## 使用

使用的时候需要将parserOptions.project赋值成tsconfig.json的路径，就像下面这样。

```json
{
  "extends": [
    "plugin:@magicspace/recommended"
  ],
  "parserOptions": {
    "project": "src/tsconfig.json"
  }
};
```

## 关于规则

要查看我们写的规则的说明，请点[这里](../tslint-rules/README.md)


## eslint vscode插件的配置示例

```json
{
  "eslint.options": {
    "configFile": "./src/.eslintrc.js"
  },
  "eslint.validate": [
     "javascript",
     {
        "language": "typescript",
        "autoFix": false
     },
  ],
  "typescript.tsdk": "node_modules\\typescript\\lib"
}
```
