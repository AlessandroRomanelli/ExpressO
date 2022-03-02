import _ from 'lodash';
import { ComparisonResults, CoverageReport, HTTPMethod } from './types';
import { table, TableUserConfig } from 'table';
import numeral from 'numeral';

interface Endpoint {
  pattern: string;
  method: HTTPMethod;
}

type Response = Endpoint & {
  response: number;
};

type Parameter = Endpoint & {
  parameter: string;
};

const parseMethod = (x: string): HTTPMethod => x.toUpperCase() as HTTPMethod;

const parseEndpoint = (x: string): Endpoint => {
  const [pattern, method] = x.split('#');
  return { pattern, method: parseMethod(method) };
};

const parseResponse = (x: string): Response => {
  const [pattern, method, response] = x.split('#');
  return { pattern, method: parseMethod(method), response: parseInt(response, 10) };
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

const generateCoverage = (coverage: number, name: string, elements: number): string => {
  return `${numeral(coverage).format('0.00%')} (${Math.round(elements * coverage)}/${elements} ${name})`;
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

const generateTabularResults = (
  results: string[],
  mappingFn: (x: string) => Endpoint | Response | Parameter,
  iterates = ['pattern', 'method'],
): string =>
  table(
    _.sortBy(results.map(mappingFn), iterates).map((x) => Object.values(x).reverse()),
    tableConfig,
  ).trimEnd();

const generateResults = (title: string, results: string[], fn: (x: string) => Endpoint | Response | Parameter) => {
  if (!results.length) return `No ${title.toLowerCase()} entities detected`;
  return `${title} (${results.length}):\n${generateTabularResults(results, fn)}`;
};

const generateReportSubtype = (results: CoverageReport, name: string) => `${generateHeader(
  `${name} coverage`,
  generateCoverage(results.coverage, name, results.matched.length + results.missing.length),
)}
${generateCoverageBar(results.coverage)}

${(
  [
    ['Missing', results.missing],
    ['Extra', results.additional],
    ['Matched', results.matched],
  ] as [string, string[]][]
)
  .map(([title, res]) => generateResults(title, res, parseEndpoint))
  .join('\n\n')}`;

export const generateReport = (
  results: ComparisonResults,
) => `Results for OpenAPI specification comparison between the following files:
  - ${results.custom}
  - ${results.generated}

${(
  [
    ['Endpoints', results.endpoints],
    ['Responses', results.responses],
    ['Parameters', results.parameters],
  ] as [string, CoverageReport][]
)
  .map(([title, res]) => generateReportSubtype(res, title))
  .join('\n\n')}`;
