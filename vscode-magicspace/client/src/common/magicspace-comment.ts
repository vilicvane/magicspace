export interface MagicSpaceComment {
  name: string;
  insert: {
    match: RegExp;
    content: string;
  };
  commentBlock: string;
  template: string;
}
