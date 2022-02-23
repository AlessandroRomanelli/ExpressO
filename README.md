# ExpressO
An Express.js tool to statically analyze the backend, generating the specification for its routes using the OpenAPI standard.

## Context
This software is developed in the context of the 2022 Spring semester for the Master Thesis in Software & Data Engineering.

## How to install
`npm install expresso`, (optionally -g to install globally);

## How to use
There are several ways to use the tool:
- `expresso generate`: will statically analyze your project and generate the corresponding `openapi.yaml` OpenAPI 3.0 specification;
- `expresso monitor`: will generate the OpenAPI 3.0 specification and add middleware to your Express.js application to monitor route usage and infer payloads schemas;
- `expresso test <custom_specification>`: will evaluate the generated specification against your provided specification and generate a report of mismatches.

## Acknowledgements
