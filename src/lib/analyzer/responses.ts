import { OpenAPIV3 } from 'openapi-types';
import AST from 'abstract-syntax-tree';
import { getReasonPhrase } from 'http-status-codes';
import _ from 'lodash';
import md5 from 'md5';
import { parseHandler } from './index';

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
    return _.last(AST.find(node, 'Identifier').map((x: any) => x.name)) || 'UNKNOWN';
  }

  static getPath(node: any): string {
    if (node.type === 'Identifier') return '';
    return AST.find(node, 'Identifier')
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

const getStatusCodeTerminator = (terminator: any): ResponseStatus => {
  switch (terminator.callee.property.name) {
    case 'redirect': {
      if (terminator.arguments.length > 1) {
        return mineNodeResponse(terminator.arguments[0]);
      }
      return new ResponseStatusLiteral(302);
    }
    case 'sendStatus': {
      return mineNodeResponse(terminator.arguments[0]);
    }
    default:
      return new ResponseStatusLiteral(200);
  }
};

const mineNodeResponse = (node: any): ResponseStatus => {
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

const mineStatementResponse = (statement: any, resName: string): ResponseStatus | undefined => {
  const response = _.last(
    AST.find(
      statement,
      `CallExpression:has(Identifier[name='${resName}'])[callee.property.name='status'] > *:last-child, ` +
        `AssignmentExpression[left.object.name='${resName}'][left.property.name='statusCode'] > *[property.name!='statusCode']`,
    ),
  );
  if (response) return mineNodeResponse(response);
  const terminator = _.first(
    AST.find(
      statement,
      `CallExpression:has(Identifier[name='${resName}'])[callee.property.name=/${EXPRESS_TERMINATORS.join('|')}/]`,
    ),
  );
  if (terminator) return getStatusCodeTerminator(terminator);
};

const mineBlockResponses = (block: any, resName: string): ResponseStatus[] => {
  const statements = AST.find(
    block,
    `IfStatement :matches(ExpressionStatement, ReturnStatement):has(CallExpression:has(Identifier[name='${resName}'])` +
      `[callee.property.name=/${['status', ...EXPRESS_TERMINATORS].join('|')}/])`,
  );
  AST.remove(block, `IfStatement :matches(ExpressionStatement, ReturnStatement):has(CallExpression:has(Identifier[name='${resName}'])` +
    `[callee.property.name=/${['status', ...EXPRESS_TERMINATORS].join('|')}/])`)
  let lastStatement = _.last(
    AST.find(
      block,
        `:matches(ExpressionStatement, ReturnStatement):has(CallExpression:has(Identifier[name='${resName}'])[callee.property.name='status']), ` +
        `AssignmentExpression[left.object.name=${resName}]`,
    ),
  );
  if (!lastStatement) {
    lastStatement = _.last(
      AST.find(
        block,
        `:matches(ExpressionStatement, ReturnStatement):has(CallExpression:has(Identifier[name='${resName}'])[callee.property.name=/${EXPRESS_TERMINATORS.join('|')}/])`,
      ),
    );
  }
  if (lastStatement)  statements.push(lastStatement);

  return statements.map((x: any) => mineStatementResponse(x, resName));
};

export const mineResponses = _.memoize(
  (fnBody: string): OpenAPIV3.ResponsesObject => {
    const fn = parseHandler(fnBody);

    const [, { name: resName }] = fn.params;

    // Check if implicit return of arrow function and short-circuit
    if (fn.type === 'ArrowFunctionExpression' && fn.body.type === 'CallExpression') {
      return mineStatementResponse(fn.body, resName)?.toSpecification() || {};
    }

    const responses: ResponseStatus[] = AST.find(
      fn,
      `BlockStatement:has(CallExpression:has(Identifier[name='${resName}'])` +
        `[callee.property.name=/${EXPRESS_TERMINATORS.join('|')}/])`,
    )
      .flatMap((x: any) => mineBlockResponses(x, resName))
      .filter((x: any) => x);

    return responses.map((x) => x.toSpecification()).reduce((prev, curr) => Object.assign(prev, curr), {});
  },
  (fnBody) => md5(fnBody),
);
