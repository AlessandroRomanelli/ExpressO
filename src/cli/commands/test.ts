import { CLIOptionsTest } from '../types';
import commandLineArgs from 'command-line-args';

export const parseTestCommandLineArgs = (argv: string[]): CLIOptionsTest => {
  const testCommandDefinitions = [
    { name: 'file', defaultOption: true },
    { name: 'json', alias: 'J', type: Boolean, defaultValue: false },
    { name: 'help', alias: 'H', type: Boolean, defaultValue: false },
    { name: 'root', defaultValue: process.cwd() },
    { name: 'start', defaultValue: 'npm start' },
  ];

  const testOptions = commandLineArgs(testCommandDefinitions, { stopAtFirstUnknown: true, argv });

  if (!testOptions.file) throw new Error("Must provide a OAPI specification file as input.\nUsage: expresso test <file>")

  return {
    fileA: testOptions.file,
    json: testOptions.json,
    help: testOptions.help,
    extension: "json",
    output: "expresso-openapi",
    root: testOptions.root,
    startLine: testOptions.start
  };
};
