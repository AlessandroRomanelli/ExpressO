// tslint:disable:no-empty-interface

export type CLIProgram = 'compare' | 'generate' | 'monitor' | 'test';
export type CLICommand = CLIProgram | 'version' | 'help';

export interface CLIOptions {
  command: CLICommand;
  subOptions?: CLISubOptions;
}

export interface CLISubOptions {
  help: boolean;
}

export interface CLIOptionsTest extends CLISubOptions {
  json: boolean;
  fileA: string;
}

export interface CLIOptionsCompare extends CLIOptionsTest {
  fileB: string;
}

export interface CLIOptionsSpecifcation extends CLISubOptions {
  root: string
}

export interface CLIOptionsMonitor extends CLIOptionsSpecifcation {}

export interface CLIOptionsGenerate extends CLIOptionsSpecifcation {}
