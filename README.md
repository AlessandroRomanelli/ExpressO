# ExpressO
An Express.js CLI tool to statically analyze the backend, generating the specification for its routes using the OpenAPI standard.

## How to install
`npm install -g expresso-api`

This will allow you to use the `expresso` command from anywhere.

## Requirements
The project for which you wish to generate the OpenAPI specification should:
- be an Express.js project;
- be able to complete the start-up without any errors;

## Commands &mdash; How to use
### Generate
This command is used to generate the OpenAPI3.0 specification relative to an Express.js project by statically analyzing it.

Usage: `expresso generate [--root] [--start] [--output] [--ext]`

Description:

| Command    | Alias | Description                                                                                                                   | Default              |
|------------|-------|-------------------------------------------------------------------------------------------------------------------------------|----------------------|
| `--root`   |       | Specifies the root of the Express.js project to generate an OpenAPI specification for, defaults to current working directory. | `process.cwd()`      |
| `--start`  |       | The command line that will be used to start the project.                                                                      | `npm start`          |
| `--output` | `-O`  | Specifies a path of where to output the OpenAPI specification.                                                                | `./expresso-openapi` |
| `--ext`    | `-E`  | Specifies which format to use for the output between `json` and `yaml`.                                                       | `json`               |

[//]: # (### Monitor)

[//]: # (This command is similar to `generate` but will continue monitoring the backend and periodically update the OpenAPI3.0 specification with metrics about the data coming through the routes.)

[//]: # ()
[//]: # (    Not implemented yet.)

### Test 
This command takes as input another specification and compares it to the one that the tool generates.

Usage: `expresso test <OAPIspec> [--root] [--start] [--output] [--ext]`

#### Arguments

| Argument   | Description                                                                                                     |
|------------|-----------------------------------------------------------------------------------------------------------------|
| `OAPIspec` | Specifies the file path that points to the OpenAPI specification that the generated one will be tested against. |

#### Options' descriptions

| Command    | Alias | Description                                                                                                                   | Default              |
|------------|-------|-------------------------------------------------------------------------------------------------------------------------------|----------------------|
| `--root`   |       | Specifies the root of the Express.js project to generate an OpenAPI specification for, defaults to current working directory. | `process.cwd()`      |
| `--start`  |       | The command line that will be used to start the project.                                                                      | `npm start`          |
| `--output` | `-O`  | Specifies a path of where to output the OpenAPI specification.                                                                | `./expresso-openapi` |
| `--ext`    | `-E`  | Specifies which format to use for the output between `json` and `yaml`.                                                       | `json`               |

### Compare
Usage: `expresso compare <OAPIspecA> <OAPIspecB> [--json]`

#### Arguments

| Argument    | Description                                                                                                |
|-------------|------------------------------------------------------------------------------------------------------------|
| `OAPIspecA` | Specifies the file path that points to an OpenAPI specification.                                           |
| `OAPIspecB` | Specifies the file path that points to a second OpenAPI specification that will be compared to `OAPIspecA` |

#### Options' descriptions

| Command  | Alias | Description                                                    | Default |
|----------|-------|----------------------------------------------------------------|---------|
| `--json` | `-J`  | Specifies to produce a JSON instead of a human readable report | `False` |

[//]: # (## Limitations)

[//]: # (Currently, the tool only allows users to extract all the endpoints registered in the application and the corresponding response codes.)
[//]: # (This should suffice to generate the skeleton of a valid OpenAPI documentation.)

## Known Issues
- The response mining has issues with local identifiers. Global constants are self explanatory but local variables (e.g: `status`) does not say anything about the type of response.

