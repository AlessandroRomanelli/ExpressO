import { OpenAPIV3 } from 'openapi-types';
import { parse, find, walk, traverse, remove } from 'abstract-syntax-tree';
import { getReasonPhrase } from 'http-status-codes';
import logger from 'jet-logger';
import { ExpressHandlerFunction } from '../model';
import http2 from 'http2';
import _ from 'lodash';

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

const getStatusCode = (terminator: any): ResponseStatus | undefined => {
  switch (terminator.callee.property.name) {
    case 'redirect': {
      if (terminator.arguments.length > 1) {
        return mineNodeForResponse(terminator.arguments[0]);
      }
      return new ResponseStatusLiteral(302);
    }
    case 'sendStatus': {
      try {
        return mineNodeForResponse(terminator.arguments[0]);
      } catch (e) {
        logger.warn('sendStatus had no status code specified');
        return;
      }
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
  return mineNodeForResponse(response);
};

const mineBlockForResponses = (block: any, resName: string): ResponseStatus | undefined => {
  remove(block, 'IfStatement,SwitchStatement');
  const lastStatement = _.last(
    find(
      block,
      `ExpressionStatement:has(CallExpression:has(Identifier[name='${resName}'])[callee.property.name='status']), ` +
        `AssignmentExpression[left.object.name=${resName}]`,
    ),
  );
  if (!lastStatement) {
    const terminator = _.first(find(block, `CallExpression[callee.property.name=/${EXPRESS_TERMINATORS.join('|')}/]`));
    return getStatusCode(terminator);
  }
  return mineStatementForResponse(lastStatement, resName);
};

export const mineExpressResponses = (fnBody: ExpressHandlerFunction): OpenAPIV3.ResponsesObject => {
  const tree = parse('const __expresso_fn = ' + (fnBody.toString() || '0'));
  const [fn] = find(tree, '*:function');
  if (!fn) {
    throw new Error('Could not find handler definition in the given source code');
  }
  if (fn.params.length < 2) {
    throw new Error('Handler had less than two args');
  }
  const [, { name: resName }] = fn.params;

  const responses: ResponseStatus[] = find(
    fn,
    `BlockStatement:has(CallExpression:has(Identifier[name='${resName}'])[callee.property.name=/${EXPRESS_TERMINATORS.join(
      '|',
    )}/])`,
  )
    .flatMap((x: any) => mineBlockForResponses(x, resName))
    .filter((x: any) => x);

  return responses.map((x) => x.toSpecification()).reduce((prev, curr) => Object.assign(prev, curr), {});
};

// console.log(mineExpressResponses((req, res) => {
//   if ("someCondition".length) {
//     res.status(404).send('error')
//   }
//   res.send('respond with a resource');
// }))
