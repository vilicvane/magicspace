import * as Fs from 'fs';
import * as Path from 'path';

import {AbstractWalker, IRuleMetadata, RuleFailure, Rules} from 'tslint';
import {isExportDeclaration, isImportDeclaration} from 'tsutils';
import * as Typescript from 'typescript';
import {Dict} from '../@lang';

const ERROR_MESSAGE_CAN_NOT_IMPORT =
  "this module can not import, because this module name start with the '@'";
const ERROR_MESSAGE_CAN_NOT_EXPORT =
  "this module can not exports, because this module name start with the '@'";
const ERROR_MESSAGE_HAVE_SOME_MODULE_NOT_EXPORT =
  'Some of the modules are not imported';

const Tester: Dict<RegExp> = {
  canNotImportOrExport: /^@.+\//,
  indexFile: /index\.(js|ts)$/,
};

/** rule 配置项 */
interface ParsedOptions {
  modulePath: string;
}

/** 节点信息 */
interface NodeInfo {
  node: Typescript.Node;
  type: 'import' | 'exports';
}

/** 需要添加错误的项目 */
interface FailureItem {
  message: string;
  node: Typescript.Node | undefined;
}

export class Rule extends Rules.AbstractRule {
  apply(sourceFile: Typescript.SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ScopesModulesWalker(
        sourceFile,
        Rule.metadata.ruleName,
        this.ruleArguments[0],
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'scoped-modules',
    description: 'No additional parameters are required',
    optionsDescription: '',
    options: undefined,
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

class ScopesModulesWalker extends AbstractWalker<ParsedOptions> {
  private nodeInfos: NodeInfo[] = [];
  private failureManager = new FailureManager(this.sourceFile, this);

  walk(sourceFile: Typescript.SourceFile): void {
    for (let statement of sourceFile.statements) {
      if (isImportDeclaration(statement)) {
        this.nodeInfos.push({
          node: statement.moduleSpecifier,
          type: 'import',
        });
      }
      if (isExportDeclaration(statement)) {
        this.nodeInfos.push({
          node: statement.moduleSpecifier!,
          type: 'exports',
        });
      }
    }
    this.validate();
  }

  // 验证 export 节点
  private validateExports(text: string, node: Typescript.Node) {
    if (Tester.canNotImportOrExport.test(text)) {
      this.failureManager.appendFailure({
        message: ERROR_MESSAGE_CAN_NOT_EXPORT,
        node,
      });
    }
  }

  // 验证 import 节点
  private validateImport(text: string, node: Typescript.Node) {
    if (Tester.canNotImportOrExport.test(text)) {
      this.failureManager.appendFailure({
        message: ERROR_MESSAGE_CAN_NOT_IMPORT,
        node,
      });
    }
  }

  // 验证index文件
  private validateIndexFile(exportsNodes: string[]) {
    /** 文件名称 */
    let fileName = this.sourceFile.fileName;
    /** 当前路径 */
    let dirname = getDirnameFromPath(fileName);
    if (Tester.indexFile.test(fileName)) {
      /** 需要导出的文件 */
      let mustExportFiles: string[] = [];
      // 获取当前目录下的文件
      let files = Fs.readdirSync(dirname);

      for (let file of files) {
        let currentPath = Path.join(dirname, file);
        let info = Fs.statSync(currentPath);

        if (info.isFile() && !Tester.indexFile.test(file)) {
          mustExportFiles.push(file);
        } else if (info.isDirectory()) {
          let folderFiles = Fs.readdirSync(currentPath);
          // 有目录可以导入
          if (
            folderFiles.indexOf('index.js') !== -1 ||
            folderFiles.indexOf('index.ts') !== -1
          ) {
            mustExportFiles.push(file);
          }
        }
      }

      let waitExportFiles = findDiffEleInArrays(exportsNodes, mustExportFiles);
      if (waitExportFiles.length !== 0) {
        this.failureManager.appendFailure({
          node: undefined,
          message: ERROR_MESSAGE_HAVE_SOME_MODULE_NOT_EXPORT,
        });
      }
    }
  }

  private validate() {
    let infos = this.nodeInfos;

    // TODO some logic
    for (let info of infos) {
      if (info.type === 'exports') {
        this.validateExports(removeQuotes(info.node.getText()), info.node);
      } else if (info.type === 'import') {
        this.validateImport(removeQuotes(info.node.getText()), info.node);
      }
    }

    let exportsNodes = infos.map(value => {
      if (value.type === 'exports') {
        return removeQuotes(value.node.getText());
      } else {
        return '';
      }
    });

    this.validateIndexFile(exportsNodes);

    this.failureManager.throwFailures();
  }
}

class FailureManager {
  private failureItems: FailureItem[] = [];

  constructor(
    private sourceFile: Typescript.SourceFile,
    private ctx: ScopesModulesWalker,
  ) {}

  appendFailure(item: FailureItem) {
    this.failureItems.push(item);
  }

  throwFailures() {
    if (this.failureItems.length) {
      for (let item of this.failureItems) {
        if (!item.node) {
          this.ctx.addFailure(
            this.sourceFile.getStart(),
            this.sourceFile.getEnd(),
            item.message,
          );
        } else {
          let {node, message} = item;
          this.ctx.addFailureAtNode(node, message);
        }
      }
    }
  }
}

function removeQuotes(value: string): string {
  let groups = /^(['"])(.*)\1$/.exec(value);
  return groups ? groups[2] : '';
}

function getDirnameFromPath(path: string) {
  let strings = path.split('/');
  return strings.slice(0, strings.length - 1).join('/');
}

// 找出两个数组的不相同的元素
function findDiffEleInArrays(arr1: string[], arr2: string[]) {
  return arr2.filter(mustincludePath => {
    let result = true;
    for (let includePath of arr1) {
      if (includePath.includes(removeSuffix(mustincludePath))) {
        result = false;
      }
    }
    return result;
  });
}

// 去掉文件后缀
function removeSuffix(fileName: string) {
  return fileName.split('.')[0];
}
