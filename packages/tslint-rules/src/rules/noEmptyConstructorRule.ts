import {RuleFailure, RuleWalker, Rules} from 'tslint';
import {
  Block,
  ConstructorDeclaration,
  Modifier,
  NodeArray,
  ParameterDeclaration,
  SourceFile,
  SyntaxKind,
} from 'typescript';

export class Rule extends Rules.AbstractRule {
  apply(sourceFile: SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new NoEmptyConstructorWalker(sourceFile, this.getOptions()),
    );
  }
}

const ERROR_MESSAGE_CONSTRUCTOR_EMPTY = 'The constructor cannot be empty';

// tslint:disable-next-line:deprecation
class NoEmptyConstructorWalker extends RuleWalker {
  visitConstructorDeclaration(node: ConstructorDeclaration): void {
    if (
      this.isAllowConstructorModifierKeyWord(node.modifiers) ||
      this.isAllowConstructorBody(node.body) ||
      this.isAllowArgumentsModifierKeyWord(node.parameters)
    ) {
      return;
    }

    this.addFailureAtNode(node, ERROR_MESSAGE_CONSTRUCTOR_EMPTY);
  }

  private isAllowArgumentsModifierKeyWord(
    parameters: NodeArray<ParameterDeclaration>,
  ): boolean {
    if (parameters.length) {
      return true;
    }

    return false;
  }

  private isAllowConstructorBody(body: Block | undefined): boolean {
    if (!body) {
      return false;
    }

    return (
      body
        .getChildren()[1]
        .getText()
        .trim() !== ''
    );
  }

  private isAllowConstructorModifierKeyWord(
    modifiers: NodeArray<Modifier> | undefined,
  ): boolean {
    let {ProtectedKeyword, PrivateKeyword} = SyntaxKind;

    if (modifiers && modifiers.length) {
      for (let modifier of modifiers) {
        if (
          modifier.kind === ProtectedKeyword ||
          modifier.kind === PrivateKeyword
        ) {
          return true;
        }
      }
    }

    return false;
  }
}
