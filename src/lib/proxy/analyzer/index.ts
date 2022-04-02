import { OpenAPIV3 } from 'openapi-types';
import { parse, find, walk, traverse, remove } from 'abstract-syntax-tree';
import { getReasonPhrase } from 'http-status-codes';
import logger from 'jet-logger';
import _ from 'lodash';
import { RequestHandler } from 'express';

const EXPRESS_TERMINATORS = [
  'send',
  'sendFile',
  'json',
  'jsonp',
  'download',
  'end',
  'redirect',
  'render',
  'sendStatus',
];

abstract class ResponseStatus {
  readonly response: string;
  protected constructor(response: string) {
    this.response = response;
  }

  abstract toSpecification(): OpenAPIV3.ResponsesObject;
}

class ResponseStatusLiteral extends ResponseStatus {
  readonly statusCode: number;
  constructor(statusCode: number) {
    super(statusCode.toString());
    this.statusCode = statusCode;
  }

  toSpecification(): OpenAPIV3.ResponsesObject {
    return {
      [this.response]: {
        description: getReasonPhrase(this.statusCode),
      },
    };
  }
}

class ResponseStatusIdentifier extends ResponseStatus {
  readonly node: any;
  readonly path: string = '';
  constructor(node: any) {
    super(ResponseStatusIdentifier.getName(node));
    this.node = node;
    this.path = ResponseStatusIdentifier.getPath(node);
  }

  static getName(node: any): string {
    if (node.type === 'Identifier') return node.name;
    return _.last(find(node, 'Identifier').map((x: any) => x.name)) || 'UNKNOWN';
  }

  static getPath(node: any): string {
    if (node.type === 'Identifier') return '';
    return find(node, 'Identifier')
      .map((x: any) => x.name)
      .slice(0, -1)
      .join('.');
  }

  toSpecification(): OpenAPIV3.ResponsesObject {
    if (!this.path) {
      return {
        [`x-${this.response}`]: {
          description: '',
        },
      };
    }
    return {
      [`x-${this.response}`]: {
        description: '',
        ['x-path']: this.path,
      } as OpenAPIV3.ResponseObject,
    };
  }
}

const getStatusCodeForTerminator = (terminator: any): ResponseStatus => {
  switch (terminator.callee.property.name) {
    case 'redirect': {
      if (terminator.arguments.length > 1) {
        return mineNodeForResponse(terminator.arguments[0]);
      }
      return new ResponseStatusLiteral(302);
    }
    case 'sendStatus': {
      return mineNodeForResponse(terminator.arguments[0]);
    }
    default:
      return new ResponseStatusLiteral(200);
  }
};

const mineNodeForResponse = (node: any): ResponseStatus => {
  switch (node.type) {
    case 'Literal':
      return new ResponseStatusLiteral(node.value);
    case 'MemberExpression':
      return new ResponseStatusIdentifier(node);
    case 'Identifier':
      return new ResponseStatusIdentifier(node);
    default:
      return new ResponseStatusIdentifier(node);
  }
};

const mineStatementForResponse = (statement: any, resName: string): ResponseStatus | undefined => {
  const response = _.last(
    find(
      statement,
      `CallExpression:has(Identifier[name='${resName}'])[callee.property.name='status'] > *:last-child, ` +
        `AssignmentExpression[left.object.name='${resName}'][left.property.name='statusCode'] > *[property.name!='statusCode']`,
    ),
  );
  if (response) return mineNodeForResponse(response);
  const terminator = _.first(
    find(
      statement,
      `CallExpression:has(Identifier[name='${resName}'])[callee.property.name=/${EXPRESS_TERMINATORS.join('|')}/]`,
    ),
  );
  if (terminator) return getStatusCodeForTerminator(terminator);
};

const mineBlockForResponses = (block: any, resName: string): ResponseStatus[] => {
  remove(block, 'IfStatement BlockStatement,SwitchStatement');
  const statements = find(
    block,
    `IfStatement ReturnStatement:has(CallExpression:has(Identifier[name='${resName}'])` +
      `[callee.property.name=/${['status', ...EXPRESS_TERMINATORS].join('|')}/])`,
  );
  const lastStatement = _.last(
    find(
      block,
      `ExpressionStatement:has(CallExpression:has(Identifier[name='${resName}'])[callee.property.name='status']), ` +
        `*:not(IfStatement) > ReturnStatement:has(CallExpression:has(Identifier[name='${resName}'])[callee.property.name='status']), ` +
        `AssignmentExpression[left.object.name=${resName}]`,
    ),
  );
  if (lastStatement) {
    statements.push(lastStatement);
  } else {
    const lastStatement = _.last(
      find(
        block,
        `ExpressionStatement:has(CallExpression:has(Identifier[name='${resName}'])[callee.property.name=/${EXPRESS_TERMINATORS.join(
          '|',
        )}/]), ` +
          `*:not(IfStatement) > ReturnStatement:has(CallExpression:has(Identifier[name='${resName}'])[callee.property.name=/${EXPRESS_TERMINATORS.join(
            '|',
          )}/])`,
      ),
    );
    if (lastStatement) statements.push(lastStatement);
  }

  return statements.map((x: any) => mineStatementForResponse(x, resName));
};

export const mineExpressResponses = (fnBody: string): OpenAPIV3.ResponsesObject => {
  const tree = parse('const __expresso_fn = ' + (fnBody || '0'));
  const [fn] = find(tree, '*:function');
  if (fn.params.length < 2) {
    throw new Error('Handler had less than two args');
  }

  const [, { name: resName }] = fn.params;

  // Check if implicit return of arrow function and short-circuit
  if (fn.type === 'ArrowFunctionExpression' && fn.body.type === 'CallExpression') {
    return mineStatementForResponse(fn.body, resName)?.toSpecification() || {};
  }

  const responses: ResponseStatus[] = find(
    fn,
    `BlockStatement:has(CallExpression:has(Identifier[name='${resName}'])` +
      `[callee.property.name=/${EXPRESS_TERMINATORS.join('|')}/])`,
  )
    .flatMap((x: any) => mineBlockForResponses(x, resName))
    .filter((x: any) => x);

  return responses.map((x) => x.toSpecification()).reduce((prev, curr) => Object.assign(prev, curr), {});
};
