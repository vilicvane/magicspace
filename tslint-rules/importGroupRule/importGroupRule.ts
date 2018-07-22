import * as Lint from "tslint";
import * as ts from "typescript";

import * as path from "path";
import { findImports, ImportKind } from "tsutils";

import { AbstractRule } from "tslint/lib/rules";

const pJSON: PackageJSON = require("../package.json");
const tJSON: TsConfigJSON = require("../package.json");

interface ModulePath {
  node: ts.Node;
  line: number;
}
interface PackageJSON {
  devDependencies: { [index: string]: string };
  dependencies: { [index: string]: string };
}
interface TsConfigJSON {
  baseUrl: string;
}

export class Rule extends AbstractRule {
  apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithFunction(sourceFile, walk);
  }
}

//分组容器
let importNodes: { [index: string]: Array<ModulePath> };
function walk(ctx: Lint.WalkContext<void>) {
  importNodes = {
    baseUrlModules: [],
    relativePathModules: [],
    nodeModules: [],
    innerModules: []
  };

  //录入import语句到分组容器
  for (let name of findImports(ctx.sourceFile, ImportKind.AllStaticImports)) {
    let text = name.getText();
    checkGroup(
      name.parent!,
      discardQuatation(text),
      ts.getLineAndCharacterOfPosition(ctx.sourceFile, name.getStart()).line
    );
  }

  //检查规则
  traverseImportNodes((m1: ModulePath, prop1: string) =>
    traverseImportNodes((m2: ModulePath, prop2: string) => {
      if (prop1 == prop2) {
        if (m1 == m2 && !groupRule(m1, importNodes[prop1])) ctx.addFailureAtNode(m2.node, "同组之间不能有空行");
      } else if (m1.line == m2.line - 1 || m1.line == m2.line + 1) ctx.addFailureAtNode(m2.node, "异组之间必须有空行");
    })
  );
}

//同组规则
function groupRule(m1:ModulePath, arr:Array<ModulePath>){
  if(arr.length == 1 || arr.length == 0) return true
  let result:boolean = false

  for(let m of arr){
    if(m1 != m && (m1.line == m.line - 1 || m1.line == m.line + 1)) result = true
  }

  return result
}

//遍历分组容器
function traverseImportNodes(
  func: (path: ModulePath, property: string) => void
) {
  for (let prop of Object.keys(importNodes)) {
    for (let m of importNodes[prop]) {
      func(m, prop);
    }
  }
}

//去掉两边的引号
function discardQuatation(str): string {
  if (/'.*'/.test(str) || /".*"/.test(str)) return str.replace(/"|'/g, "");
  throw new Error("check your str must be similar to 'str' or \"str\"");
}

//创建path对象
function pathFactory(node: ts.Node, line: number): ModulePath {
  return { node: node, line: line };
}

//判断是否为第三方模块
function isDependenciesPath(modulePath: string): boolean {
  var obj = Object.assign({}, pJSON.dependencies, pJSON.devDependencies);
  return obj.hasOwnProperty(modulePath);
}

function checkGroup(node: ts.Node, modulePath: string, line: number) {
  //base url
  if (new RegExp("" + tJSON.baseUrl).test(path.resolve(modulePath))) {
    importNodes.baseUrlModules.push(pathFactory(node, line));
  }
  //相对路径
  else if (/\.\.\//.test(modulePath) || /\//.test(modulePath)) {
    importNodes.relativePathModules.push(pathFactory(node, line));
  }
  //node_modules
  else if (isDependenciesPath(modulePath)) {
    importNodes.nodeModules.push(pathFactory(node, line));
  }
  //内建模块
  else {
    importNodes.innerModules.push(pathFactory(node, line));
  }
}
