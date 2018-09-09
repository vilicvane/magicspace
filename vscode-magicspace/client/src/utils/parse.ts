import {MagicSpaceComment} from '../common';

export function parseComment(comment: string): MagicSpaceComment {
  let commentParts = comment.split('\n');

  return {
    name: '',
    insert: {
      match: /s/,
      content: '',
    },
    commentBlock: '',
    template: '',
  };
}
