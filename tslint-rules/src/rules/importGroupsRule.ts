import * as Path from 'path';

import resolve = require('resolve');
import {
  AbstractWalker,
  IOptions,
  IRuleMetadata,
  Replacement,
  RuleFailure,
  Rules,
} from 'tslint';
import {
  ImportKind,
  isExportDeclaration,
  isImportDeclaration,
  isImportEqualsDeclaration,
  isTextualLiteral,
} from 'tsutils';
import * as TypeScript from 'typescript';

import {Dict} from '../@lang';
import {removeQuotes} from '../utils/path';

const ERROR_MESSAGE_UNEXPECTED_EMPTY_LINE =
  'Unexpected empty line within the same import group.';
const ERROR_MESSAGE_EXPECTING_EMPTY_LINE =
  'Expecting an empty line between different import groups.';
const ERROR_MESSAGE_WRONG_MODULE_GROUP_ORDER =
  'Import groups must be sorted according to given order.';
const ERROR_MESSAGE_NOT_GROUPED = 'Imports must be grouped.';

const resolveWithCache = (() => {
  let cache = new Map<string, string | undefined>();

  return (id: string, basedir: string): string | undefined => {
    let key = `${id}\n${basedir}`;

    if (cache.has(key)) {
      return cache.get(key);
    }

    let value: string | undefined;

    try {
      value = resolve.sync(id, {basedir});
    } catch (error) {}

    cache.set(key, value);

    return value;
  };
})();

const BUILT_IN_MODULE_GROUP_TESTER_DICT: Dict<ModuleGroupTester> = {
  '$node-core'(path) {
    try {
      return require.resolve(path) === path;
    } catch (error) {
      return false;
    }
  },
  '$node-modules'(modulePath, sourceFilePath) {
    let basedir = Path.dirname(sourceFilePath);

    let resolvedPath = resolveWithCache(modulePath, basedir);

    if (!resolvedPath) {
      return false;
    }

    let relativePath = Path.relative(basedir, resolvedPath);

    return /[\\/]node_modules[\\/]/.test(relativePath);
  },
};

interface ModuleGroupConfigItem {
  name: string;
  test: string;
}

interface RawOptions {
  groups: ModuleGroupConfigItem[];
  ordered?: boolean;
}

interface ParsedOptions {
  groups: ModuleGroup[];
  ordered: boolean;
}

type ModuleGroupTester = (
  modulePath: string,
  sourceFilePath: string,
) => boolean;

class ModuleGroup {
  readonly name: string;
  private tester: ModuleGroupTester;

  constructor({name, test: testConfig}: ModuleGroupConfigItem) {
    this.name = name;
    this.tester = this.buildTester(testConfig);
  }

  test(modulePath: string, sourceFilePath: string): boolean {
    return this.tester(modulePath, sourceFilePath);
  }

  private buildTester(config: string): ModuleGroupTester {
    if (config.startsWith('$')) {
      return BUILT_IN_MODULE_GROUP_TESTER_DICT[config] || (() => false);
    } else {
      let regex = new RegExp(config);
      return path => regex.test(path);
    }
  }
}

export class Rule extends Rules.AbstractRule {
  private parsedOptions: ParsedOptions;

  constructor(options: IOptions) {
    super(options);

    let {groups: groupConfigItems, ordered} = options
      .ruleArguments[0] as RawOptions;

    this.parsedOptions = {
      groups: groupConfigItems.map(item => new ModuleGroup(item)),
      ordered: !!ordered,
    };
  }

  apply(sourceFile: TypeScript.SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ImportGroupWalker(
        sourceFile,
        Rule.metadata.ruleName,
        this.parsedOptions,
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'import-groups',
    description: 'Validate that module imports are grouped as expected.',
    optionsDescription: '',
    options: {
      properties: {
        groups: {
          items: {
            properties: {
              name: {
                type: 'string',
              },
              test: {
                type: 'string',
              },
            },
            type: 'object',
          },
          type: 'array',
        },
        ordered: {
          type: 'boolean',
        },
      },
      type: 'object',
    },
    optionExamples: [
      [
        true,
        {
          groups: [
            {name: 'node-core', test: '$node-core'},
            {name: 'node-modules', test: '$node-modules'},
          ],
          ordered: true,
        },
      ],
    ],
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

interface ModuleImportInfo {
  node: TypeScript.Node;
  groupIndex: number;
  /** 节点开始行. */
  startLine: number;
  /** 节点结束行. */
  endLine: number;
}

class ImportGroupWalker extends AbstractWalker<ParsedOptions> {
  private moduleImportInfos: ModuleImportInfo[] = [];
  private pendingStatements: TypeScript.Statement[] = [];

  walk(sourceFile: TypeScript.SourceFile): void {
    let pendingCache: TypeScript.Statement[] = [];

    let checkWithAppendModuleImport = (expression: TypeScript.Expression) => {
      this.pendingStatements.push(...pendingCache);
      pendingCache = [];

      if (isTextualLiteral(expression)) {
        this.appendModuleImport(expression, sourceFile);
      }
    };

    for (let statement of sourceFile.statements) {
      if (isImportDeclaration(statement)) {
        if (ImportKind.ImportDeclaration) {
          checkWithAppendModuleImport(statement.moduleSpecifier);
        }
      } else if (isImportEqualsDeclaration(statement)) {
        if (
          ImportKind.ImportEquals &&
          statement.moduleReference.kind ===
            TypeScript.SyntaxKind.ExternalModuleReference &&
          statement.moduleReference.expression !== undefined
        ) {
          checkWithAppendModuleImport(statement.moduleReference.expression);
        }
      } else if (isExportDeclaration(statement)) {
        if (statement.moduleSpecifier !== undefined && ImportKind.ExportFrom) {
          checkWithAppendModuleImport(statement.moduleSpecifier);
        }
      } else {
        pendingCache.push(statement);
      }
    }

    this.validate();
  }

  private appendModuleImport(
    expression: TypeScript.LiteralExpression,
    sourceFile: TypeScript.SourceFile,
  ): void {
    let node: TypeScript.Node = expression;

    while (node.parent!.kind !== TypeScript.SyntaxKind.SourceFile) {
      node = node.parent!;
    }

    let modulePath = removeQuotes(expression.getText());
    let sourceFilePath = sourceFile.fileName;

    let groups = this.options.groups;

    let index = groups.findIndex(group =>
      group.test(modulePath, sourceFilePath),
    );

    this.moduleImportInfos.push({
      node,
      // 如果没有找到匹配的分组, 则归到 "其他" 一组, groupIndex 为 groups.length.
      groupIndex: index < 0 ? groups.length : index,
      startLine: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line,
      endLine: sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line,
    });
  }

  private validate(): void {
    let infos = this.moduleImportInfos;
    let pendingStatements = this.pendingStatements;

    if (!infos.length) {
      return;
    }

    let {ordered} = this.options;

    interface FailureItem {
      node: TypeScript.Node;
      message: string;
    }

    let failureItems: FailureItem[] = [];

    let [lastInfo, ...restInfos] = infos;

    let fixerEnabled = !pendingStatements.length;

    let appearedGroupIndexSet = new Set([lastInfo.groupIndex]);

    for (let expression of pendingStatements) {
      failureItems.push({
        node: expression,
        message: 'Unexpected code between import statements.',
      });
    }

    for (let info of restInfos) {
      let checkOrdering = ordered;

      if (info.groupIndex === lastInfo.groupIndex) {
        // 只在分组第一项检查分组顺序.
        checkOrdering = false;

        // 如果当前分组和上一份组 groupIndex 相同, 则校验是否多了空行.
        if (info.startLine - lastInfo.endLine > 1) {
          failureItems.push({
            node: info.node,
            message: ERROR_MESSAGE_UNEXPECTED_EMPTY_LINE,
          });
        }
      } else {
        // 检验该组是否已经出现过.
        if (appearedGroupIndexSet.has(info.groupIndex)) {
          checkOrdering = false;

          failureItems.push({
            node: info.node,
            message: ERROR_MESSAGE_NOT_GROUPED,
          });
        }
        // 如果未出现过则校验是否少了空行.
        else if (info.startLine - lastInfo.endLine < 2) {
          failureItems.push({
            node: info.node,
            message: ERROR_MESSAGE_EXPECTING_EMPTY_LINE,
          });
        }
      }

      if (checkOrdering) {
        // 在要求分组顺序的情况下, 如果当前分组的 groupIndex 小于上一个分组的,
        // 则说明顺序错误.
        if (info.groupIndex < lastInfo.groupIndex) {
          failureItems.push({
            node: info.node,
            message: ERROR_MESSAGE_WRONG_MODULE_GROUP_ORDER,
          });
        }
      }

      appearedGroupIndexSet.add(info.groupIndex);

      lastInfo = info;
    }

    if (failureItems.length) {
      let fixer = fixerEnabled ? this.buildFixer(infos) : undefined;

      for (let {node, message} of failureItems) {
        this.addFailureAtNode(node, message, fixer);
      }
    }
  }

  private buildFixer(infos: ModuleImportInfo[]): Replacement | undefined {
    let {ordered} = this.options;

    let startNode = infos[0].node;
    let endNode = infos[infos.length - 1].node;

    let infoGroups = groupModuleImportInfos(infos, ordered);

    let text = infoGroups
      .map(group => group.map(info => info.node.getText()).join('\n'))
      .join('\n\n');

    return new Replacement(startNode.getStart(), endNode.getEnd(), text);
  }
}

function groupModuleImportInfos(
  infos: ModuleImportInfo[],
  ordered: boolean,
): ModuleImportInfo[][] {
  // 这里利用了 Map 和 Set 枚举顺序和键加入顺序一致的特性. 如果不需要按顺序分
  // 组, 则遵照分组出现顺序.
  let infoGroupMap = new Map<number, ModuleImportInfo[]>();

  for (let info of infos) {
    let infoGroup = infoGroupMap.get(info.groupIndex);

    if (infoGroup) {
      infoGroup.push(info);
    } else {
      infoGroup = [info];
      infoGroupMap.set(info.groupIndex, infoGroup);
    }
  }

  if (ordered) {
    return Array.from(infoGroupMap.entries())
      .sort(([indexX], [indexY]) => indexX - indexY)
      .map(([, infoGroup]) => infoGroup);
  } else {
    return Array.from(infoGroupMap.values());
  }
}
