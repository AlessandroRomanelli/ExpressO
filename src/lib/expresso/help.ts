import fs from "fs"
import { table } from "table";

// tslint:disable:no-console
export const expressoHelp = async (): Promise<void> => {
  const tableOptions = {
    singleLine: true,
    drawHorizontalLine: () => false,
    drawVerticalLine: () => false
  }
  console.log(
`
Usage: expresso [expresso-options] [command] [command-options]

Available options:
${table([
  ["-H", "--help", "Prints to console command line commands and options"],
  ["-V", "--version", "Prints to console the current version of expresso"]
], tableOptions)}
Available commands:
${table([
  ["generate", "Generates OpenAPI specification for the Express.js project in the current directory"],
  ["monitor", "Generates OpenAPI specification and monitors data traffic in real-time to infer payload schemas and report routes' usage"],
  ["test", "Generates OpenAPI specification and compares it with a user-provided ground truth"],
  ["compare", "Compares two OpenAPI specifications regardless of version or format"],
], tableOptions)}
All commands can be further inspected with: expresso [command] [-H | --help]
`)
}