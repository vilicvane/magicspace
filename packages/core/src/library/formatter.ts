import {Options, format, getFileInfo, resolveConfig} from 'prettier';

export interface FormatterFormatOptions {
  filePath: string;
}

export class Formatter {
  async format(
    content: string,
    {filePath}: FormatterFormatOptions,
  ): Promise<string> {
    let options = (await resolveConfig(filePath, {})) || undefined;
    let {inferredParser: parser} = await getFileInfo(filePath);

    return format(content, {
      ...(parser ? {parser} as Options : undefined),
      ...options,
    });
  }
}
