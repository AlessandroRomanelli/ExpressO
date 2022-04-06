// tslint:disable:no-empty-interface

export type CLIProgram = 'compare' | 'generate' | 'monitor' | 'test';
export type CLICommand = CLIProgram | 'version' | 'help';

export type OAPIFormat = 'json' | 'yaml';

export interface CLIOptions {
  command: CLICommand;
  subOptions?: CLISubOptions;
}

export interface CLISubOptions {
  help: boolean;
}

export interface CLIOptionsComparison extends CLISubOptions {
  json: boolean;
  fileA: string;
}

export interface CLIOptionsTest extends CLIOptionsComparison, CLIOptionsSpecification {

}

export interface CLIOptionsCompare extends CLIOptionsComparison {
  fileB: string;
}

export interface CLIOptionsSpecification extends CLISubOptions {
  root: string;
  output: string;
  extension: OAPIFormat;
  startLine: string;
}

export type CLIOptionsMonitor = CLIOptionsSpecification;

export type CLIOptionsGenerate = CLIOptionsSpecification;
