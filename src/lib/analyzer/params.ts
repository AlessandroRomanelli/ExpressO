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

const mineHandlerQuery = (fn: any): string[] => {
  const [{ name: reqName }] = fn.params;
  const queryParams = find(
    fn,
    `VariableDeclarator[id.type='ObjectPattern'][init.type='MemberExpression']:has(MemberExpression[object.name='${reqName}'][property.name='query']) ObjectPattern Identifier`,
  )
    .map((x: any) => x.name)
    .filter((x: any, i: number) => i % 2 === 0)
    .concat(
      find(
        fn,
        `VariableDeclarator[id.type='ObjectPattern'][init.type='Identifier'][init.name='${reqName}']:has(Property[key.name='query']) ObjectPattern Identifier`,
      )
        .map((x: any) => x.name)
        .filter((x: any) => x !== 'query')
        .filter((x: any, i: number) => i % 2 === 0),
    )
    .concat(
      find(fn, `MemberExpression[object.object.name='${reqName}'][object.property.name='query']`).map(
        (x: any) => x.property.name,
      ),
    );
  return Array.from(new Set(queryParams));
};

export const mineParameters = (fnBody: string, pathStr: string): OpenAPIV3.ParameterObject[] => {
  const fn = parseHandler(fnBody);
  const pathParameters = pathStr.match(/(?<=:)\w+/g)?.map((x) => paramToSpecification(x, 'path')) || [];
  const queryParameters = mineHandlerQuery(fn).map((x) => paramToSpecification(x, 'query'));
  // const [pathParameters, queryParameters] = ['params', 'query'].map((x) =>
  //   mineHandler(fn, x).map((x, i) => paramToSpecification(x, i ? 'query' : 'path')),
  // );
  return pathParameters.concat(queryParameters);
};
