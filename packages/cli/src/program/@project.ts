import {Config, Project} from '@magicspace/core';

export async function createDefaultProject(
  projectDir: string,
  templateDir?: string,
): Promise<Project.Project> {
  let config: Config.Config | undefined;

  if (typeof templateDir === 'string') {
    try {
      config = await Config.resolveTemplateConfig(templateDir);
    } catch (error) {
      if (error instanceof Config.ValidateError) {
        // eslint-disable-next-line no-throw-literal
        throw `Error validating template options:
${error.diagnostics.join('\n').replace(/^(?=[^\r\n])/gm, '  ')}`;
      } else {
        throw error;
      }
    }
  }

  return new Project.Project(
    Project.DEFAULT_FILE_OBJECT_CREATOR_MAP,
    Project.DEFAULT_EXTENSION_TO_FILE_TYPE_MAP,
    projectDir,
    config,
  );
}
