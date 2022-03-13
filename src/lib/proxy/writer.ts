import path from "path"
import { Handler, Method } from "./model";
import { readFile, writeFile } from "fs-extra"
import { OpenAPIV3 } from "openapi-types";
import { StatusCodes } from "http-status-codes";
import logger from "jet-logger";

const handlerToSpecification = async (handler: Handler): Promise<OpenAPIV3.PathsObject> => {
  const endpoints = handler.getEndpoints()
  return Object.keys(endpoints).map(pattern => {
    const methods: Method[] = Object.keys(endpoints[pattern]) as Method[]
    const patternMethods = methods.map(method => [method, {
      responses: endpoints[pattern][method].responses
    }] as [Method, { responses: StatusCodes[] }])
      .reduce((prev, [key, value]) => Object.assign(prev, { [key]: value }), {})
    return [ pattern, patternMethods ] as [string, { [k: string]: { responses: StatusCodes[] }}]
  }).reduce((prev, [key, value]) => Object.assign(prev, { [key]: value }), {})
}

const modelsToSpecification = async (projectRoot: string, models: Set<Handler>): Promise<OpenAPIV3.Document> => {
  let pkg;
  try {
    pkg = JSON.parse(await readFile(path.resolve(projectRoot, "package.json"), 'utf-8'))
  } catch (e) {
    logger.warn("Could not read from project's package.json")
  }

  return {
    info: {
      title: pkg.name || "",
      version: pkg.version || "0.0.0"
    },
    paths: Array.from(models).map(handlerToSpecification).reduce((curr, prev) => Object.assign(curr, prev), {}),
    openapi: "3.0.0"
  }
}

export const writeSpecification = async (projectRoot = ".", models: Set<Handler>): Promise<void> => {
  const spec = await modelsToSpecification(projectRoot, models)
  const filePath = path.resolve(projectRoot, "openapi.json")
  await writeFile(filePath, JSON.stringify(spec, null, 4))
  logger.info(`OpenAPI specification successfully generated at '${filePath}'`)
}