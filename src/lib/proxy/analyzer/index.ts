import { find, parse } from 'abstract-syntax-tree';

export { mineResponses } from './responses';

export const parseHandler = (fnBody: string) => {
  const tree = parse('const __expresso_fn = ' + (fnBody || '0'));
  const [fn] = find(tree, '*:function');
  if (fn.params.length < 2) {
    throw new Error('Handler had less than two args');
  }
  return fn;
};
