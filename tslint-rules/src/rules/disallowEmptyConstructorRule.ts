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
      new DisallowEmptyConstructorWalker(sourceFile, this.getOptions()),
    );
  }
}

const ERROR_MESSAGE_CONSTRUCTOR_EMPTY = 'The constructor cannot be empty';

class DisallowEmptyConstructorWalker extends RuleWalker {
  visitConstructorDeclaration(node: ConstructorDeclaration): void {
    let {modifiers} = node;

    if (
      this.isAllowConstructorModifierKeyWord(modifiers) ||
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
    for (let parameter of parameters) {
      if (parameter.modifiers) {
        return true;
      }
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
