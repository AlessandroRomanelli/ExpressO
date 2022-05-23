// tslint:disable:no-console
import { CLIOptionsGenerate } from '../../cli/types';
import { generateSpecification } from '../generator';
import { table } from 'table';

const tableOptions = {
  singleLine: true,
  drawHorizontalLine: () => false,
  drawVerticalLine: () => false,
};

export const expressoGenerate = async (options: CLIOptionsGenerate): Promise<void> => {
  if (options.help) {
    return console.log(
      `Usage: expresso generate [options]

Options descriptions:
${table(
  [
    [
      '--root',
      'the root of the Express.js project to generate an OpenAPI specification for, defaults to current working directory',
    ],
    ['--start', "command line that will be used to start the project, defaults to 'npm start'"],
    ['--output', "specify a path of where to output the OpenAPI specification, defaults to './expresso-openapi'"],
    ['--ext', "specify which format to use for the output, defaults to 'json'"],
    ['--json', 'Switches output from human-readable to JSON format'],
    ['--help', 'Show this help message']
  ],
  tableOptions,
)}
`,
    );
  }
  return await generateSpecification(options);
};
