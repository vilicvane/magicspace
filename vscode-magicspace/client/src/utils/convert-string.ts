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
) {
  return template.replace(
    /\$\{(.*?)\}/g,
    (_match: string, key: string) => templateData[key.trim()],
  );
}

export function toCamelCase(targetStringParts: string[]) {
  return targetStringParts
    .map(
      (part, index) =>
        index
          ? Array.from(part)
              .map((char, index) => (index ? char : char.toUpperCase()))
              .join('')
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
