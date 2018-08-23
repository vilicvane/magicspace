export function trimLeftEmptyLines(text: string): string {
  return text.replace(/^\s*\r?\n|\r?\n\s*$/g, '');
}
