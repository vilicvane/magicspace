import latestVersion from 'latest-version';
import {Dict} from 'tslang';

export interface FetchPackageVersionsOptions {
  /**
   * Defaults to '^'.
   */
  rangePrefix?: string;
}

export async function fetchPackageVersions(
  versionRangeDict: Dict<string>,
): Promise<Dict<string>> {
  console.info('Fetching versions of the following packages...');
  console.info(
    Object.entries(versionRangeDict)
      .map(([name, versionRange]) => `  - ${name}: ${versionRange}`)
      .join('\n'),
  );

  return Object.fromEntries(
    await Promise.all(
      Object.entries(versionRangeDict).map(async ([name, versionRange]) => [
        name,
        `^${await latestVersion(name, {version: versionRange})}`,
      ]),
    ),
  );
}
