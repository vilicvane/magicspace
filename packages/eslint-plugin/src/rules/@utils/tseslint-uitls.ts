import {ParserServices, TSESLint} from '@typescript-eslint/experimental-utils';

export type RequiredParserServices = {
  [k in keyof ParserServices]: Exclude<ParserServices[k], undefined>;
};

export function getParserServices<
  TMessageIds extends string,
  TOptions extends unknown[]
>(
  context: TSESLint.RuleContext<TMessageIds, TOptions>,
): RequiredParserServices {
  if (
    !context.parserServices ||
    !context.parserServices.program ||
    !context.parserServices.esTreeNodeToTSNodeMap
  ) {
    /**
     * The user needs to have configured "project" in their parserOptions
     * for @typescript-eslint/parser
     */
    throw new Error(
      'You have used a rule which requires parserServices to be generated. You must therefore provide a value for the "parserOptions.project" property for @typescript-eslint/parser.',
    );
  }

  return context.parserServices as RequiredParserServices;
}
