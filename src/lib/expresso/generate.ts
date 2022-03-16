// tslint:disable:no-console
import { CLIOptionsGenerate } from '../../cli/types';
import { generateSpecification } from '../generator';
import { table } from "table";

export const expressoGenerate = async (options: CLIOptionsGenerate): Promise<void> => {
  if (options.help) {
    return console.log(
      `Usage: expresso generate [\u003croot\ufe65, start]

Options descriptions:
${table([
  ["root", "the root of the Express.js project to generate an OpenAPI specification for, defaults to current working directory"],
  ["start", "command line that will be used to start the project, defaults to 'npm start'"],
])}
`,
    );
  }
  return await generateSpecification(options.root, options.startLine);
};
