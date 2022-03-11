// tslint:disable:no-console
import { CLIOptionsGenerate } from "../../cli/types";
import { generateSpecification } from "../generator";

export const expressoGenerate = async (options: CLIOptionsGenerate): Promise<void> => {
  if (options.help) {
    return console.log(
`Usage: expresso generate \u003croot folder\ufe65

Root folder should be the root of the Express.js project for which you wish to generate an OpenAPI specification.`)
  }
  return await generateSpecification(options.root)
}