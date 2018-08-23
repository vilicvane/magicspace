# 魔法空格

[![Build Status](https://www.travis-ci.org/makeflow/magicspace.svg?branch=master)](https://www.travis-ci.org/makeflow/magicspace)

## 使用

添加依赖

```bash
yarn add @magicspace/configs -D
```

然后, 你需要在 tslint.json 里显式的继承

```json
{
  "extends": "@magicspace/configs/tslint"
  //...
}
```

你可以开始使用它了！！

## 规则

魔法空格里面集成了一些规则可以提供一些风格层面的检查工作。

### Import-Groups

它能够帮助你将 import 语句进行分组，比如:

```ts
// 内建模块
import * as FS from 'fs';
import * as Path from 'path';

// 第三方模块
import * as request from 'request';
```

Import-Groups 提供了两种分组规则:

1.  $node-core 对内建模块进行分组
2.  $node-modules 对第三方模块进行分组

配置形如：

```json
{
  "groups": [
    {"name": "node-core", "test": "$node-core"},
    {"name": "node-modules", "test": "$node-modules"}
  ],
  "ordered": true
}
```

name 字段可以指定 group 的名字，test 为 group 的匹配规则， 除此之外， 你还可以自己添加一些自定义 group，test 可以为正则表达式

你还可以指定 ordered 字段，来让你的分组变的有顺序， 任意一个分组的顺序变动都会导致 import-groups 抛出 failure ，如果你不想这样， 你可以将它设置为 false

### Scoped-Modules

使用此规则之前必须要达成一个约定，即以 @ 开头的模块，是默认不导出的。Scoped-Modules 帮你做了检查的工作，任何以 @ 开头的模块被导出都会抛出 failure

此外， 如果有 index.ts (.js)，那么，在此目录下任何不为 @ 的模块都必须被导出

配置 `tslint.json` 下的 `rules` 开启该规则:

```json
{
  "scoped-modules": true
}
```

### Explicit-Return-Type

此规则规定，必须要显示的声明函数的返回值， 但是又一些特殊情况可以不必添加返回值。比如

```ts
[1, 2, 3].map(item => item + 1);
```

配置 `tslint.json` 下的 `rules` 开启该规则:

```json
{
  "explicit-return-type": true
}
```

### Import-Path-Convention

当你需要导入在 baseUrl 目录下的模块时，这个规则会特别有用

它会帮你检查引入的路径。比如 baseUrl 为 core，有一个模块 foo 存在于 core 目录下

假如当前模块在 baseUrl 之外

```ts
import {foo} from '../core/foo'; // failure
```

```ts
import {foo} from 'foo'; //right
```

假如当前模块在 baseUrl 内

```ts
import {foo} from 'foo'; //failure
```

```ts
import {foo} from './foo'; //right
```

如果你希望 Import-Path-Convention 帮你做这些检查， 并提供修复， 那么你可以在配置项里开启它，并在它的配置里写上 baseUrl 的路径

```json
{
  "import-path-convention": [
    true,
    {
      "baseUrl": "src/core",
      "baseUrlDirSearchName": "tsconfig.json"
    }
  ]
}
```

baseUrlDirSearchName 字段是为了描述处于项目根目录的文件

比如，你可以指定 baseUrlDirSearchName 为 tsconfig.json，那么 import-path-convention 将会找到项目里的 tsconfig.json，以此来确定项目的根目录

这两个字段都是很必要的，请在使用之前将它们配置好

### No-Parent-Import

这个规则能够帮助你避免循环引用

配置 `tslint.json` 下的 `rules` 开启该规则:

```json
{
  "no-parent-import": true
}
```

### Empty-Line-Around-Blocks

该规则要求在多数含有代码块的语句周围存在适当的空行

配置 `tslint.json` 下的 `rules` 开启该规则:

```json
{
  "empty-line-around-blocks": true
}
```
