import { OpenAPIV3 } from 'openapi-types';
import { parse, find, walk, traverse } from 'abstract-syntax-tree';
import { getReasonPhrase } from 'http-status-codes';
import logger from 'jet-logger';
import { ExpressHandlerFunction } from "../model";
import http2 from "http2";

const EXPRESS_TERMINATORS = [
  "send",
  "sendFile",
  "json",
  "jsonp",
  "download",
  "end",
  "redirect",
  "render",
  "sendStatus"
]

const getStatusCode = (terminator: any): number | undefined => {
  switch (terminator.callee.property.name) {
    case "redirect": {
      if (terminator.arguments.length > 1) {
        return mineNodeForResponse(terminator.arguments[0])
      }
      return 302
    }
    case "sendStatus": {
      try {
        return mineNodeForResponse(terminator.arguments[0])
      } catch (e) {
        logger.warn("sendStatus had no status code specified")
        return
      }
    }
    default: return 200
  }
}

const mineNodeForResponse = (node: any): number => {
  switch (node.type) {
    case "Literal": return node.value
    case "Identifier": return node.name
    default: return node.toString()
  }
};

const mineStatementForResponse = (statement: any, resName: string): number | undefined => {
  const [response] = find(statement,
    `CallExpression:has(Identifier[name='${resName}'])[callee.property.name='status'][arguments] > *:not(MemberExpression), ` +
    `AssignmentExpression[left.object.name='res'] > *:not(MemberExpression)`).slice(-1)
  return mineNodeForResponse(response)
}

const mineBlockForResponses = (block: any, resName: string): number | undefined => {
  const [lastStatement] = find(block,
    `ExpressionStatement:has(CallExpression:has(Identifier[name='${resName}'])[callee.property.name='status']), ` +
    `AssignmentExpression[left.object.name=${resName}]`).slice(-1)
  if (!lastStatement) {
    const [firstTerminator] = find(block, `CallExpression[callee.property.name=/${EXPRESS_TERMINATORS.join("|")}/]`)
    return getStatusCode(firstTerminator)
  }
  return mineStatementForResponse(lastStatement, resName)
}

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

  // let depth = 0
  // traverse(fn, {
  //   enter(node: any) {
  //     console.log(`${'  '.repeat(depth)}${node.type}`)
  //     depth += 1
  //   },
  //   leave(node: any) {
  //     depth -= 1
  //   }
  // })

  const responses: number[] = find(fn, `BlockStatement:has(CallExpression:has(Identifier[name='${resName}'])[callee.property.name=/${EXPRESS_TERMINATORS.join("|")}/])`)
    .flatMap((x: any) => mineBlockForResponses(x, resName))
    .filter((x: any) => x)

  return Object.fromEntries(responses.map(x => [x, { description: getReasonPhrase(x) }]));
};

console.log(mineExpressResponses((req, res) => {
  res.statusCode = 500
  if ("something".length) {
    res.redirect("asgheno")
  }
  res.statusCode = 500
  if ("something_else".length) {
    res.sendStatus(404)
  }
  if ("something_else_still".length) {
    res.redirect(301, "something")
  }
  if ("something_else_entirely".length) {
    res.json(JSON.stringify({}))
  }
  res.status(401).status(402).status(403).status(201);
  res.statusCode = 202
  res.end()
}))