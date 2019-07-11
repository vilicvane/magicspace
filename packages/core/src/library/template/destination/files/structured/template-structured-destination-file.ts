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
}

abstract class TemplateStructuredDestinationFile<
  TConfig extends ITemplateStructuredDestinationConfig
> extends AbstractTemplateDestinationFile<TConfig> {
  private propertyPathKeyToDestinationInfoMap = new Map<
    string,
    DestinationInfo
  >();

  private prioritizedKeys: string[] = [];

  constructor(path: string, readonly formatter: Formatter) {
    super(path);
  }

  update(
    content: unknown,
    {
      propertyPath,
      spread = false,
      mergeStrategy = 'error',
      sort: prioritizedKeys,
    }: TConfig,
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
          };
          break;
        case 'shallow':
          info = {
            propertyPath,
            object: _.assign(info.object, content),
            spread: info.spread || spread,
          };
          break;
        case 'deep':
          info = {
            propertyPath,
            object: _.merge(info.object, content),
            spread: info.spread || spread,
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
      };
    }

    this.propertyPathKeyToDestinationInfoMap.set(propertyPathKey, info);

    if (prioritizedKeys) {
      this.prioritizedKeys = prioritizedKeys;
    }
  }

  async flush(): Promise<void> {
    let result: unknown;

    if (FSE.existsSync(this.path)) {
      let structuredText = FSE.readFileSync(this.path, 'utf8');
      result = this.parse(structuredText);
    }

    for (let {
      propertyPath,
      object,
      spread,
    } of this.propertyPathKeyToDestinationInfoMap.values()) {
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

    let prioritizedKeyToIndexMap = this.prioritizedKeys.reduce(
      (map, key, index, keys) => map.set(key, keys.length - index),
      new Map<string, number>(),
    );

    if (_.isPlainObject(result)) {
      result = sortKeys(
        _.mapValues(result as object, value =>
          _.isPlainObject(value) ? sortKeys(value, {deep: true}) : value,
        ),
        {
          compare(keyA: string, keyB: string) {
            return (
              (prioritizedKeyToIndexMap.get(keyB) || 0) -
                (prioritizedKeyToIndexMap.get(keyA) || 0) ||
              keyA.localeCompare(keyB)
            );
          },
        },
      );
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
