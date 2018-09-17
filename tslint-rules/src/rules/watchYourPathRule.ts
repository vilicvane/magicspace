import _ from 'lodash';
import {
  AbstractWalker,
  IOptions,
  IRuleMetadata,
  RuleFailure,
  Rules,
} from 'tslint';
import {
  Node,
  SourceFile,
  forEachChild,
  isCallExpression,
  isPropertyAccessExpression,
} from 'typescript';

const PLATFORM_INDEPENDENT_PATH: string[] = [
  'basename',
  'delimiter',
  'format',
  'isAbsolute',
  'join',
  'normalize',
  'parse',
  'relative',
  'resolve',
  'sep',
];

const WARNING_MESSAGE_PATH = 'This method is platform independent.';

interface ParsedOptions {
  platform: string;
}

type Partial<T> = {[P in keyof T]?: T[P]};

export class Rule extends Rules.AbstractRule {
  private parsedOptions: ParsedOptions;

  constructor(options: IOptions) {
    super(options);

    let originOption: Partial<ParsedOptions> = options.ruleArguments[0];
    this.parsedOptions = {
      platform: (originOption && originOption.platform) || 'posix',
    };
  }

  apply(sourceFile: SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new WatchYourPathWalker(
        sourceFile,
        Rule.metadata.ruleName,
        this.parsedOptions,
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'watch-your-path',
    description:
      'If you want a path of platform independent, you had better open this rule. ',
    optionsDescription: 'You can set platform for keep platform independent',
    options: {
      properties: {
        platform: {
          type: 'string',
        },
      },
    },
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

class WatchYourPathWalker extends AbstractWalker<{}> {
  walk(sourceFile: SourceFile): void {
    forEachChild(sourceFile, this.walkNodes);
  }

  private walkNodes = (node: Node): void => {
    if (isCallExpression(node)) {
      this.validatePath(node);
    }

    forEachChild(node, this.walkNodes);
  };

  private validatePath(node: Node): void {
    let methodName: string;

    if (
      isCallExpression(node) &&
      isPropertyAccessExpression(node.expression) &&
      _.includes(
        PLATFORM_INDEPENDENT_PATH,
        (methodName = node.expression.name.getText()),
      )
    ) {
      this.addFailureAtNode(node, WARNING_MESSAGE_PATH);
    }
  }
}
