import {AbstractWalker} from 'tslint';
import * as Lint from 'tslint';
import {ImportKind, findImports} from 'tsutils';
import * as TS from 'typescript';

// tslint:disable-next-line:no-duplicate-imports
import {ConfigItem} from '../@lang';

type ModuleGroupTester = (path: string) => boolean;

// let testConfigString = '$node';

// name
// regex: "$node"
// const tsConfig: TSConfig = require('../package.json');

interface ModuleImportInfo {
  node: TS.Node;
  index: number;
  line: number;
  // tag: importGroup;
}

export class Rule extends Lint.Rules.AbstractRule {
  apply(sourceFile: TS.SourceFile): Lint.RuleFailure[] {
    // return this.applyWithFunction(sourceFile, walk);
    return this.applyWithWalker(
      new ImportGroupWalker(
        sourceFile,
        Rule.metadata.ruleName,
        this.ruleArguments,
      ),
    );
  }

  // faiture信息
  static readonly SAME_GROUP_FAILURE_STRING = '同组之间不能有空行';
  static readonly DIFF_GROUP_FAILURE_STRING = '异组之间必须有空行';
  static readonly SEQUERENCE_FAILURE_STRING = '顺序错误';

  // 元数据配置
  static metadata: Lint.IRuleMetadata = {
    ruleName: 'import-group',
    description: '针对于传入的参数对import的模块进行分组',
    optionsDescription: '',
    options: {
      type: 'array',
      items: {type: 'ConfigItem'},
    },
    optionExamples: [
      `{
        name:"runtime",
        test:"$node"
      }`,
    ],
    type: 'style',
    hasFix: true,
    typescriptOnly: false,
  };
}

class ImportGroupWalker extends AbstractWalker<ConfigItem[]> {
  // 分组容器
  private moduleImportInfosArr: ModuleImportInfo[] = [];

  // runtime模块或者npm模块的标志符
  private readonly RUNTIME_NPM_MODULE_TAG = '$';
  // npm模块的安装位置
  private readonly NPM_MODULE_POSITION = 'node_modules';

  walk(sourceFile: TS.SourceFile): void {
    if (this.options.length === 0) {
      return;
    }
    this.moduleImportInfosArr = [];
    let expressions = findImports(sourceFile, ImportKind.AllStaticImports);

    // 录入 import 语句到分组容器
    for (let expression of expressions) {
      let text = this.removeQuotes(expression.getText());
      let line = TS.getLineAndCharacterOfPosition(
        sourceFile,
        expression.getStart(),
      ).line;

      this.moduleImportInfosArr = this.pushInModuleImportInfosArr(
        expression.parent!,
        text,
        line,
      );
    }

    // 检查规则
    this.judgeRule();
  }

  /**
   * 去掉路径两边的引号
   * @param value 原始字符串
   * @returns 返回去掉引号后的字符串
   */
  private removeQuotes(value: string): string {
    let groups = /^(['"])(.*)\1$/.exec(value);
    return groups ? groups[2] : '';
  }

  /**
   * 检测规则
   * @description 遍历容器，不符合顺序的抛出failure
   */
  private judgeRule() {
    // 当前索引
    let currentIndex = 0;
    // 上一个节点
    let prev: ModuleImportInfo | undefined;
    // 遍历容器
    for (let moduleImportInfo of this.moduleImportInfosArr) {
      if (moduleImportInfo.index >= currentIndex) {
        currentIndex = moduleImportInfo.index;
      } else {
        this.addFailureAtNode(
          moduleImportInfo.node,
          Rule.SEQUERENCE_FAILURE_STRING,
        );
      }

      // 异组之间必须空行
      if (
        prev &&
        prev.index !== moduleImportInfo.index &&
        (prev.line === moduleImportInfo.line - 1 ||
          prev.line === moduleImportInfo.line + 1)
      ) {
        this.addFailureAtNode(
          moduleImportInfo.node,
          Rule.DIFF_GROUP_FAILURE_STRING,
        );
      } else if (
        prev &&
        prev.index === moduleImportInfo.index &&
        (prev.line !== moduleImportInfo.line - 1 &&
          prev.line !== moduleImportInfo.line + 1)
      ) {
        this.addFailureAtNode(
          moduleImportInfo.node,
          Rule.SAME_GROUP_FAILURE_STRING,
        );
      }

      prev = moduleImportInfo;
    }
  }

  /**
   * 将模块路径封装成ModuleImportInfo添加到数组里
   * @param node AST中的一个节点
   * @param path 模块路径
   * @return 返回一个新的ModuleImportInfo数组
   */
  private pushInModuleImportInfosArr(
    node: TS.Node,
    path: string,
    line: number,
  ): ModuleImportInfo[] {
    let tmpArr = this.moduleImportInfosArr.concat([]);
    for (let index of Object.keys(this.options)) {
      if (this.matchModulePath(path, this.options[+index].test)) {
        tmpArr.push({node, index: +index, line});
      }
    }
    return tmpArr;
  }

  /**
   * 创建tester
   * @description 通过对module path的初步解析，创建tester
   * @param configString 配置的匹配字符串
   * @return 返回一个tester用于匹配实际路径
   */
  private buildTester(configString: string): RegExp | ModuleGroupTester {
    if (configString.startsWith(this.RUNTIME_NPM_MODULE_TAG)) {
      return (path: string): boolean => {
        switch (configString) {
          case '$node':
            return require.resolve(path) === path;
          case '$npm':
            return require.resolve(path).includes(this.NPM_MODULE_POSITION);
          default:
            return false;
        }
      };
    } else {
      return new RegExp(configString);
    }
  }

  /**
   * 匹配路径
   * @param path 模块路径
   * @param configString 配置的匹配字符串
   * @returns 返回匹配结果
   */
  private matchModulePath(path: string, configString: string): boolean {
    let tester = this.buildTester(configString);
    if (typeof tester === 'function') {
      return tester(path);
    } else {
      return tester.test(path);
    }
  }
}
