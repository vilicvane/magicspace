export interface MagicSpaceComment {
  name: string;
  insert: {
    match: string;
    content: string;
  };
  commentBlock: string;
  template: string;
}
