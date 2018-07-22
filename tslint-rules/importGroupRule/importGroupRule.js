"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const path = require("path");
const tsutils_1 = require("tsutils");
const rules_1 = require("tslint/lib/rules");
const pJSON = require("../package.json");
const tJSON = require("../package.json");
class Rule extends rules_1.AbstractRule {
    apply(sourceFile) {
        return this.applyWithFunction(sourceFile, walk);
    }
}
exports.Rule = Rule;
//分组容器
let importNodes;
function walk(ctx) {
    importNodes = {
        baseUrlModules: [],
        relativePathModules: [],
        nodeModules: [],
        innerModules: []
    };
    for (let name of tsutils_1.findImports(ctx.sourceFile, 3 /* AllStaticImports */)) {
        let text = name.getText();
        checkGroup(name.parent, discardQuatation(text), ts.getLineAndCharacterOfPosition(ctx.sourceFile, name.getStart()).line);
    }
    traverseImportNodes((m1, prop1) => traverseImportNodes((m2, prop2) => {
        if (prop1 == prop2) {
            if (m1 == m2 && !groupRule(m1, importNodes[prop1]))
                ctx.addFailureAtNode(m2.node, "同组之间不能有空行");
        }
        else if (m1.line == m2.line - 1 || m1.line == m2.line + 1)
            ctx.addFailureAtNode(m2.node, "异组之间必须有空行");
    }));
}
//同组规则
function groupRule(m1, arr) {
    if (arr.length == 1 || arr.length == 0)
        return true;
    let result = false;
    for (let m of arr) {
        if (m1 != m && (m1.line == m.line - 1 || m1.line == m.line + 1))
            result = true;
    }
    return result;
}
//遍历分组容器
function traverseImportNodes(func) {
    for (let prop of Object.keys(importNodes)) {
        for (let m of importNodes[prop]) {
            func(m, prop);
        }
    }
}
//去掉两边的引号
function discardQuatation(str) {
    if (/'.*'/.test(str) || /".*"/.test(str))
        return str.replace(/"|'/g, "");
    throw new Error("check your str must be similar to 'str' or \"str\"");
}
//创建path对象
function pathFactory(node, line) {
    return { node: node, line: line };
}
//判断是否为第三方模块
function isDependenciesPath(modulePath) {
    var obj = Object.assign({}, pJSON.dependencies, pJSON.devDependencies);
    return obj.hasOwnProperty(modulePath);
}
function checkGroup(node, modulePath, line) {
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
