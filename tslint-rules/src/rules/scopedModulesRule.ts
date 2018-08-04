import * as Fs from 'fs';
import * as Path from 'path';

import {
  AbstractWalker,
  IRuleMetadata,
  Replacement,
  RuleFailure,
  Rules,
} from 'tslint';
import {isExportDeclaration, isImportDeclaration} from 'tsutils';
import * as Typescript from 'typescript';

import {Dict} from '../@lang';

const ERROR_MESSAGE_CAN_NOT_IMPORT =
  "This module can not import, because this module name start with the '@'.";
const ERROR_MESSAGE_CAN_NOT_EXPORT =
  "This module can not exports, because this module name start with the '@'.";
const ERROR_MESSAGE_HAVE_SOME_MODULE_NOT_EXPORT =
  'Some of the modules are not imported.';

const indexFileRegex = /[\\/]index\.(js|tsx?(?:\.lint)?)$/;

const BannedPattern = {
  import: /^(?!(?:\.{1,2}[\\/])+@(?!.*[\\/]@)).*[\\/]@/,
  export: /[\\/]@/,
};

type BannedPatternName = keyof typeof BannedPattern;

/** 根据不同的 tag 返回不同的 fixer */
const fixerBuilder: Dict<(...args: any[]) => Replacement> = {
  removeNotExportFixer: node =>
    new Replacement(node.getStart(), node.getWidth(), ''),
  autoExportModuleFixer: (
    sourceFile: Typescript.SourceFile,
    exportNodesPath: string[],
  ) =>
    new Replacement(
      sourceFile.getStart(),
      sourceFile.getFullWidth(),
      [
        sourceFile.getText(),
        ...exportNodesPath.map(
          value => `export * from './${removeFileNameSuffix(value)}'`,
        ),
      ].join('\n'),
    ),
};

/** 节点信息 */
interface NodeInfo {
  node: Typescript.Node;
  type: 'import' | 'exports';
}

/** 需要添加错误的项目 */
interface FailureItem {
  message: string;
  node: Typescript.Node | undefined;
  fixer?: Replacement;
}

export class Rule extends Rules.AbstractRule {
  apply(sourceFile: Typescript.SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ScopesModulesWalker(sourceFile, Rule.metadata.ruleName, undefined),
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

class ScopesModulesWalker extends AbstractWalker<undefined> {
  private nodeInfos: NodeInfo[] = [];
  private failureManager = new FailureManager(this);

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

  private validateExportsAndImport(
    message: string,
    text: string,
    node: Typescript.Node,
    tag: BannedPatternName,
  ) {
    if (BannedPattern[tag].test(text)) {
      this.failureManager.appendFailure({
        message,
        node,
        fixer: fixerBuilder.removeNotExportFixer(node),
      });
    }
  }

  // 验证 export 节点
  private validateExports(text: string, node: Typescript.Node) {
    this.validateExportsAndImport(
      ERROR_MESSAGE_CAN_NOT_EXPORT,
      text,
      node,
      'export',
    );
  }

  // 验证 import 节点
  private validateImport(text: string, node: Typescript.Node) {
    this.validateExportsAndImport(
      ERROR_MESSAGE_CAN_NOT_IMPORT,
      text,
      node,
      'import',
    );
  }

  // 验证 index 文件
  private validateIndexFile(exportsNodes: string[]) {
    /** 文件名称 */
    let fileName = this.sourceFile.fileName;
    /** 当前路径 */
    let dirname = getDirnameFromPath(fileName);
    if (indexFileRegex.test(fileName)) {
      /** 需要导出的文件 */
      let mustExportFiles: string[] = [];
      // 获取当前目录下的文件
      let files = Fs.readdirSync(dirname);

      for (let file of files) {
        let currentPath = Path.join(dirname, file);
        let info = Fs.statSync(currentPath);

        if (
          info.isFile() &&
          !indexFileRegex.test(toRelativeCurrentPath(file)) &&
          !BannedPattern.export.test(toRelativeCurrentPath(file))
        ) {
          mustExportFiles.push(removeFileNameSuffix(file));
        } else if (info.isDirectory()) {
          let folderFiles = Fs.readdirSync(currentPath);

          // 有目录可以导入
          if (
            folderFiles.indexOf('index.js') !== -1 ||
            folderFiles.indexOf('index.ts') !== -1
          ) {
            mustExportFiles.push(removeFileNameSuffix(file));
          }
        }
      }

      let waitExportFiles = findDiffEleInArrays(exportsNodes, mustExportFiles);

      if (waitExportFiles.length !== 0) {
        this.failureManager.appendFailure({
          node: undefined,
          message: ERROR_MESSAGE_HAVE_SOME_MODULE_NOT_EXPORT,
          fixer: fixerBuilder.autoExportModuleFixer(
            this.sourceFile,
            waitExportFiles,
          ),
        });
      }
    }
  }

  private validate() {
    let infos = this.nodeInfos;

    for (let info of infos) {
      if (info.type === 'exports') {
        this.validateExports(
          removeQuotes(info.node.getText()),
          info.node.parent!,
        );
      } else if (info.type === 'import') {
        this.validateImport(
          removeQuotes(info.node.getText()),
          info.node.parent!,
        );
      }
    }

    let exportsNodes = infos.map(value => {
      return value.type === 'exports'
        ? removeFileNameSuffix(removeQuotes(value.node.getText()))
        : '';
    });

    this.validateIndexFile(exportsNodes);

    this.failureManager.throwFailures();
  }
}

class FailureManager {
  private failureItems: FailureItem[] = [];

  constructor(private ctx: ScopesModulesWalker) {}

  appendFailure(item: FailureItem) {
    this.failureItems.push(item);
  }

  throwFailures() {
    if (this.failureItems.length) {
      for (let item of this.failureItems) {
        if (item.node) {
          let {node, message} = item;
          this.ctx.addFailureAtNode(node, message, item.fixer);
        } else {
          let sourceFile = this.ctx.getSourceFile();
          this.ctx.addFailure(
            sourceFile.getStart(),
            sourceFile.getEnd(),
            ERROR_MESSAGE_HAVE_SOME_MODULE_NOT_EXPORT,
            item.fixer,
          );
        }
      }
    }
  }
}

function removeQuotes(value: string): string {
  let groups = /^(['"])(.*)\1$/.exec(value);
  return groups ? groups[2] : '';
}

function getDirnameFromPath(path: string): string {
  return Path.dirname(path);
}

// 找出两个数组的不相同的元素
function findDiffEleInArrays(arrA: string[], arrB: string[]): string[] {
  return arrA
    .concat(arrB)
    .filter(item => !arrA.includes(item) || !arrB.includes(item));
}

function removeFileNameSuffix(fileName: string) {
  return Path.basename(fileName, Path.extname(fileName));
}

function toRelativeCurrentPath(fileName: string) {
  return `./${fileName}`;
