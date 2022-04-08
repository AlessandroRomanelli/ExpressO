import { OpenAPIV3 } from 'openapi-types';
import { parseHandler } from './index';
import { find } from 'abstract-syntax-tree';

const paramToSpecification = (
  paramName: string,
  location: 'path' | 'query',
  required = false,
): OpenAPIV3.ParameterObject => ({
  in: location,
  name: paramName,
  ...(required && { required: true }),
});

export const mineFunctionParamNames = (fn: any): string[] => {
  const [{ name: reqName }] = fn.params;
  return find(fn, `MemberExpression[object.object.name='${reqName}'][object.property.name='query']`).map(
    (x: any) => x.property.name,
  );
};

export const mineParameters = (path: string, fnBody: string): OpenAPIV3.ParameterObject[] => {
  const pathParameters = Array.from(path.match(/(?<=:)\w*/g) || []).map((x) => paramToSpecification(x, 'path', true));
  const queryParameters = mineFunctionParamNames(parseHandler(fnBody)).map((x) => paramToSpecification(x, 'query'));
  return pathParameters.concat(queryParameters);
};
