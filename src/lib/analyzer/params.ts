import { OpenAPIV3 } from 'openapi-types';
import { parseHandler } from './index';
import { find } from 'abstract-syntax-tree';

const paramToSpecification = (
  paramName: string,
  location: 'path' | 'query',
  required = location === 'path',
): OpenAPIV3.ParameterObject => ({
  in: location,
  name: paramName,
  schema: {
    type: 'string',
  },
  ...(required && { required: true }),
});

const mineHandlerParams = (fn: any, query: string): string[] => find(fn, query).map((x: any) => x.property.name);

const mineHandlerQueryParams = (fn: any): string[] => {
  const [{ name: reqName }] = fn.params;
  return mineHandlerParams(fn, `MemberExpression[object.object.name='${reqName}'][object.property.name='query']`);
};

const mineHandlerPathParams = (fn: any): string[] => {
  const [{ name: reqName }] = fn.params;
  return mineHandlerParams(fn, `MemberExpression[object.object.name='${reqName}'][object.property.name='params']`);
};

export const mineParameters = (fnBody: string): OpenAPIV3.ParameterObject[] => {
  const fn = parseHandler(fnBody);
  const [pathParameters, queryParameters] = [mineHandlerPathParams, mineHandlerQueryParams].map((x) =>
    x(fn).map((x, i) => paramToSpecification(x, i ? 'query' : 'path')),
  );
  return pathParameters.concat(queryParameters);
};
