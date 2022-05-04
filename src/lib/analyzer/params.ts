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

const mineHandler = (fn: any, propertyName: string): string[] => {
  const [{ name: reqName }] = fn.params;
  return Array.from(new Set(find(
    fn,
    `MemberExpression[object.object.name='${reqName}'][object.property.name='${propertyName}']`
  ).map((x: any) => x.property.name)));
}


export const mineParameters = (fnBody: string): OpenAPIV3.ParameterObject[] => {
  const fn = parseHandler(fnBody);
  const [pathParameters, queryParameters] = ['params', 'query'].map((x) =>
    mineHandler(fn, x).map((x, i) => paramToSpecification(x, i ? 'query' : 'path')),
  );
  return pathParameters.concat(queryParameters);
};
