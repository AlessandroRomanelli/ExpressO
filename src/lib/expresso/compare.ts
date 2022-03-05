// tslint:disable:no-console
import { CLIOptionsCompare } from "../../cli/types";
import { compareSpecifications, generateReport } from "../tester";
import { table } from "table";

export const expressoCompare = async (options: CLIOptionsCompare): Promise<void> => {
  const tableOptions = {
    singleLine: true,
    drawHorizontalLine: () => false,
    drawVerticalLine: () => false
  }

  if (options.help) return console.log(
`Usage: expresso compare <fileA> <fileB> [options]

This command compare two user-provided specifications and generates a report of how much the OAPI specification of fileB covers what is specified in fileA.

Available options:
${table([
  ["-H", "--help", "Prints to console description and options for this command"],
  ["-J", "--json", "Switches output from human-readable to JSON format"],
], tableOptions)}`
  )
  const results = await compareSpecifications(options.fileA, options.fileB);
  if (options.json) {
    return console.log(results);
  }
  return console.log(generateReport(results));
};