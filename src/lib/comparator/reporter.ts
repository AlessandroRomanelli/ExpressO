import _ from 'lodash';
import { ComparisonResults, CoverageReport, HTTPMethod } from './types';
import { table, TableUserConfig } from 'table';
import numeral from 'numeral';

interface Endpoint {
  pattern: string;
  method: HTTPMethod;
}

type Response = Endpoint & {
  response: string;
};

type Parameter = Endpoint & {
  parameter: string;
};

type Model = Endpoint | Response | Parameter;

const parseMethod = (x: string): HTTPMethod => x.toUpperCase() as HTTPMethod;

const parseEndpoint = (x: string): Endpoint => {
  const [pattern, method] = x.split('#');
  return { pattern, method: parseMethod(method) };
};

const parseResponse = (x: string): Response => {
  const [pattern, method, response] = x.split('#');
  return { pattern, method: parseMethod(method), response };
};

const parseParameter = (x: string): Parameter => {
  const [pattern, method, parameter] = x.split('#');
  return { pattern, method: parseMethod(method), parameter };
};

const CLIWidth = 70;

const generateHeader = (leftSide: string, rightSide: string): string => {
  return `${leftSide} ${'─'.repeat(CLIWidth - (leftSide.length + rightSide.length + 2))} ${rightSide}`;
};

const generateCoverageBar = (coverage: number): string =>
  `${'\u2588'.repeat(Math.round(CLIWidth * coverage))}${'\u2591'.repeat(Math.round(CLIWidth * (1 - coverage)))}`;

const generateCoverage = (coverage: number, name: string, elementsCount: number, totalCount: number): string => {
  return `${numeral(coverage).format('0.00%')} (${elementsCount}/${totalCount} ${name})`;
};

const tableConfig: TableUserConfig = {
  singleLine: true,
  drawHorizontalLine: () => false,
  drawVerticalLine: () => false,
  border: {
    topBody: `─`,
    topJoin: `┬`,
    topLeft: `┌`,
    topRight: `┐`,

    bottomBody: `─`,
    bottomJoin: `┴`,
    bottomLeft: `└`,
    bottomRight: `┘`,

    bodyLeft: `│`,
    bodyRight: `│`,
    bodyJoin: `│`,

    joinBody: `─`,
    joinLeft: `├`,
    joinRight: `┤`,
    joinJoin: `┼`,
  },
};

type ModelMapping = (x: string) => Model;

const generateTabularResults = (results: string[], mappingFn: ModelMapping, iterates = ['pattern', 'method']): string =>
  table(
    _.sortBy(results.map(mappingFn), iterates).map((x) => Object.values(x).reverse()),
    tableConfig,
  ).trimEnd();

const generateResults = (title: string, results: string[], fn: ModelMapping) => {
  if (!results.length) return `No ${title.toLowerCase()} entities detected`;
  return `${title} (${results.length}):\n${generateTabularResults(results, fn)}`;
};

const generateReportSubtype = (results: CoverageReport, name: string, fn: ModelMapping) => `${generateHeader(
  `${name} coverage`,
  generateCoverage(
    results.coverage,
    name,
    results.matched.length + results.partiallyMatched.length,
    results.originalCount,
  ),
)}
${generateCoverageBar(results.coverage)}
${generateHeader(
  `Strict coverage (no partials)`,
  generateCoverage(results.strictCoverage, name, results.matched.length, results.originalCount),
)}
${generateCoverageBar(results.strictCoverage)}

${(
  [
    ['Missing', results.missing],
    ['Extra', results.additional],
    ['Matched', results.matched],
    ['Partially matched', results.partiallyMatched],
  ] as [string, string[]][]
)
  .map(([title, res]) => generateResults(title, res, fn))
  .join('\n\n')}`;

export const generateReport = (
  results: ComparisonResults,
) => `Results for OpenAPI specification comparison between the following files:
  - ${results.custom}
  - ${results.generated}

${(
  [
    ['Endpoints', results.endpoints, parseEndpoint],
    ['Responses', results.responses, parseResponse],
    ['Parameters', results.parameters, parseParameter],
  ] as [string, CoverageReport, ModelMapping][]
)
  .map(([title, res, fn]) => generateReportSubtype(res, title, fn))
  .join('\n\n')}`;
