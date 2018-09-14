export interface ConvertedString {
  'name.CamelCase': string;
  'name.hyphenated': string;
}

interface TemplateData {
  [index: string]: any;
}

export function evaluatedStringTemplate(
  template: string,
  templateData: TemplateData,
): string {
  return template.replace(
    /\$\{(.*?)\}/g,
    (_match: string, key: string) => templateData[key.trim()],
  );
}

export function toCamelCase(
  targetStringParts: string[],
  form: 'upper' | 'lower' = 'upper',
): string {
  return targetStringParts
    .map(
      (part, index) =>
        (form === 'upper'
        ? index + 1
        : index)
          ? part[0].toUpperCase() + part.slice(1)
          : part,
    )
    .join('');
}

export function convertString(targetString: string): ConvertedString {
  let camelCase: string = '';
  let hyphenated: string = '';

  targetString = targetString
    .replace(/\s+/g, ' ')
    .replace(/^\s\s*/, '')
    .replace(/\s\s$/, '');

  if (targetString !== '') {
    let targetStringParts = targetString.split(' ');

    camelCase = toCamelCase(targetStringParts);

    hyphenated = targetStringParts.join('-');
  }

  return {'name.CamelCase': camelCase, 'name.hyphenated': hyphenated};
}
