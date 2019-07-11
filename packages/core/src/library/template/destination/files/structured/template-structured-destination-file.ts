import assert from 'assert';

import * as FSE from 'fs-extra';
import _ from 'lodash';
import sortKeys from 'sort-keys';

import {
  ITemplateStructuredDestinationConfig,
  TemplateStructuredPlaceholder,
} from '../../../../config';
import {Formatter} from '../../../../formatter';
import {AbstractTemplateDestinationFile} from '../../template-destination-file';

interface DestinationInfo {
  propertyPath: string[];
  object: unknown;
  spread: boolean;
  sort: string[] | boolean | undefined;
}

abstract class TemplateStructuredDestinationFile<
  TConfig extends ITemplateStructuredDestinationConfig
> extends AbstractTemplateDestinationFile<TConfig> {
  private propertyPathKeyToDestinationInfoMap = new Map<
    string,
    DestinationInfo
  >();

  constructor(path: string, readonly formatter: Formatter) {
    super(path);
  }

  update(
    content: unknown,
    {propertyPath, spread = false, mergeStrategy = 'error', sort}: TConfig,
  ): void {
    propertyPath = _.toPath(propertyPath);

    let propertyPathKey = propertyPath.join('\t');

    let info = this.propertyPathKeyToDestinationInfoMap.get(propertyPathKey);

    if (info) {
      switch (mergeStrategy) {
        case 'error':
          throw new Error(
            `Content for structured destination ${JSON.stringify(
              this.path,
            )} ${JSON.stringify(
              propertyPath,
            )} already exist (merge strategy "error")`,
          );
        case 'ignore':
          return;
        case 'replace':
          info = {
            propertyPath,
            object: content,
            spread,
            sort,
          };
          break;
        case 'shallow':
          info = {
            propertyPath,
            object: _.assign(info.object, content),
            spread: info.spread || spread,
            sort: _.defaultTo(info.sort, sort),
          };
          break;
        case 'deep':
          info = {
            propertyPath,
            object: _.merge(info.object, content),
            spread: info.spread || spread,
            sort: _.defaultTo(info.sort, sort),
          };
          break;
        case 'union':
          assert(
            Array.isArray(info.object) && Array.isArray(content),
            'Merge strategy "union" requires operants to be arrays',
          );

          info = {
            propertyPath,
            object: _.union(info.object as unknown[], content as unknown[]),
            spread: info.spread || spread,
            sort: _.defaultTo(info.sort, sort),
          };
          break;
        case 'concat':
          assert(
            Array.isArray(info.object) && Array.isArray(content),
            'Merge strategy "concat" requires operants to be arrays',
          );

          info = {
            propertyPath,
            object: [...(info.object as unknown[]), ...(content as unknown[])],
            spread: info.spread || spread,
            sort: _.defaultTo(info.sort, sort),
          };
          break;
        default:
          throw new Error(
            `Invalid structured destination merge strategy ${JSON.stringify(
              mergeStrategy,
            )}`,
          );
      }
    } else {
      info = {
        propertyPath,
        object: content,
        spread,
        sort,
      };
    }

    this.propertyPathKeyToDestinationInfoMap.set(propertyPathKey, info);
  }

  async flush(): Promise<void> {
    let result: unknown;

    if (FSE.existsSync(this.path)) {
      let structuredText = FSE.readFileSync(this.path, 'utf8');
      result = this.parse(structuredText);
    }

    let infos = _.sortBy(
      Array.from(this.propertyPathKeyToDestinationInfoMap),
      ([key]) => key,
    ).map(([, info]) => info);

    for (let {propertyPath, object, spread} of infos) {
      object = _.cloneDeepWith(object, value => {
        if (value instanceof TemplateStructuredPlaceholder) {
          return new TemplateStructuredPlaceholder(_.cloneDeep(value.value));
        } else {
          return undefined;
        }
      });

      if (spread) {
        if (propertyPath.length) {
          let property = _.assignWith(
            _.get(result, propertyPath),
            object,
            placeholderAssignCustomizer,
          );

          result = _.set(result as object, propertyPath, property);
        } else {
          result = _.assignWith(result, object, placeholderAssignCustomizer);
        }
      } else {
        if (propertyPath.length) {
          if (object instanceof TemplateStructuredPlaceholder) {
            if (!_.has(result, propertyPath)) {
              result = _.set(result as object, propertyPath, object.value);
            }
          } else {
            result = _.set(result as object, propertyPath, object);
          }
        } else {
          if (object instanceof TemplateStructuredPlaceholder) {
            result = object.value;
          } else {
            result = object;
          }
        }
      }
    }

    for (let {propertyPath, sort = true} of infos.reverse()) {
      if (!sort) {
        continue;
      }

      if (!Array.isArray(sort)) {
        sort = [];
      }

      if (propertyPath.length) {
        _.update(result as object, propertyPath, object =>
          sortKeysWithPrioritizedKeys(object, sort as string[]),
        );
      } else {
        result = sortKeysWithPrioritizedKeys(result, sort);
      }
    }

    let updatedStructuredText = this.stringify(result);

    updatedStructuredText = await this.formatter.format(updatedStructuredText, {
      filePath: this.path,
    });

    FSE.outputFileSync(this.path, updatedStructuredText);
  }

  protected abstract parse(text: string): unknown;

  protected abstract stringify(object: unknown): string;
}

export const AbstractTemplateStructuredDestinationFile = TemplateStructuredDestinationFile;

export interface ITemplateStructuredDestinationFile<
  TConfig extends ITemplateStructuredDestinationConfig
> extends TemplateStructuredDestinationFile<TConfig> {}

function placeholderAssignCustomizer(
  destinationValue: unknown,
  sourceValue: unknown,
): unknown {
  if (sourceValue instanceof TemplateStructuredPlaceholder) {
    if (destinationValue === undefined) {
      return sourceValue.value;
    } else {
      return destinationValue;
    }
  } else {
    return sourceValue;
  }
}

function sortKeysWithPrioritizedKeys(
  object: unknown,
  prioritizedKeys: string[],
): unknown {
  let prioritizedKeyToIndexMap = prioritizedKeys.reduce(
    (map, key, index, keys) => map.set(key, keys.length - index),
    new Map<string, number>(),
  );

  if (!_.isPlainObject(object)) {
    return object;
  }

  return sortKeys(object, {
    compare(keyA: string, keyB: string) {
      return (
        (prioritizedKeyToIndexMap.get(keyB) || 0) -
          (prioritizedKeyToIndexMap.get(keyA) || 0) || keyA.localeCompare(keyB)
      );
    },
  });
}
