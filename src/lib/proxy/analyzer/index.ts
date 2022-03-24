import { OpenAPIV3 } from 'openapi-types';
import { parse, find, walk, traverse } from 'abstract-syntax-tree';
import { getReasonPhrase } from 'http-status-codes';
import logger from 'jet-logger';

const mineExpressionForResponses = (expr: any): number[] => {
  return find(expr, 'Literal').map((x: any) => x.value);
};

export const mineExpressResponses = (fnBody: string): OpenAPIV3.ResponsesObject => {
  const tree = parse('const __expresso_fn = ' + (fnBody || '0'));
  let [fn] = find(tree, 'FunctionExpression');
  if (!fn) {
    [fn] = find(tree, 'ArrowFunctionExpression');
  }
  if (!fn) {
    throw new Error('Could not find handler definition in the given source code');
  }
  const responses = [];
  if (fn.params.length < 2) {
    throw new Error('Handler had less than two args');
  }
  const [, { name: resName }] = fn.params;

  // walk(fn, (node: any) => {
  //   logger.info(JSON.stringify(node, null, 2))
  // })
  //
  // let depth = 0
  // traverse(fn, {
  //   enter(node: any) {
  //     console.log(`${'\t'.repeat(depth)}${node.type}`)
  //     depth += 1
  //   },
  //   leave(node: any) {
  //     depth -= 1
  //   }
  // })

  find(fn, `CallExpression[callee.object.name=${resName}][callee.property.name='status']`)
    .flatMap((x: any) => mineExpressionForResponses(x.arguments[0]))
    .forEach((x: number) => responses.push(x));

  find(fn, `AssignmentExpression[left.object.name=${resName}]`)
    .flatMap((x: any) => mineExpressionForResponses(x.right))
    .forEach((x: number) => responses.push(x));

  if (!responses.length) {
    responses.push(200);
  }
  return Object.fromEntries(responses.map((x) => [x, { description: getReasonPhrase(x) }]));
};
