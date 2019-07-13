import {Formatter} from './formatter';
import {
  MagicspaceBuilder,
  MagicspaceBuilderOptions,
} from './magicspace-builder';
import {
  TemplateBlobDestinationFile,
  TemplateBlobSourceFile,
  TemplateHandlebarsSourceFile,
  TemplateJSONDestinationFile,
  TemplateJSONSourceFile,
  TemplateModuleSourceFile,
  TemplateTextDestinationFile,
  TemplateTextSourceFile,
} from './template';

export function createDefaultMagicspaceBuilder(
  workspacePath: string,
  options?: MagicspaceBuilderOptions,
): MagicspaceBuilder {
  let builder = new MagicspaceBuilder(workspacePath, options);

  ////////////
  // source //
  ////////////

  builder.registerSourceFile(
    'json',
    filePath => new TemplateJSONSourceFile(filePath),
  );

  builder.registerSourceFile(
    'module',
    filePath => new TemplateModuleSourceFile(filePath),
  );

  builder.registerSourceFile(
    'text',
    filePath => new TemplateTextSourceFile(filePath),
  );

  builder.registerSourceFile(
    'handlebars',
    filePath => new TemplateHandlebarsSourceFile(filePath),
  );

  builder.registerSourceFile(
    'blob',
    filePath => new TemplateBlobSourceFile(filePath),
  );

  /////////////////
  // destination //
  /////////////////

  let formatter = new Formatter();

  builder.registerDestinationFile(
    'json',
    filePath => new TemplateJSONDestinationFile(filePath, formatter),
  );

  builder.registerDestinationFile(
    'text',
    filePath => new TemplateTextDestinationFile(filePath),
  );

  builder.registerDestinationFile(
    'blob',
    filePath => new TemplateBlobDestinationFile(filePath),
  );

  return builder;
}
