import {compare} from "../../src/tester";

describe('Tester [Generic]', () => {
    it ("should throw an error for invalid/non-existent paths", () => {
        expect(() => compare("", "../non_existent/file.yaml")).toThrowError()
    })

    it ("should throw an error for folder paths", () => {
        expect(() => compare("./spec", "./spec/tests/examples")).toThrowError()
    })

    it("should throw an error for missing 'paths' property", () => {
        const filePath = "./spec/tests/examples/specMissingPaths.yaml"
        expect(() => compare(filePath,  filePath)).toThrowError()
    })

    it("should not throw an error for different file types", () => {
        expect(() => compare("./spec/tests/examples/specA.yaml", "./spec/tests/examples/specB.json")).not.toThrowError()
    })
});

describe('Tester [Endpoints]', () => {
    it("should report 100% coverage for the same file", () => {
        const filePath = "./spec/tests/examples/specA.yaml"
        const { endpoints } = compare(filePath, filePath)
        expect(endpoints.coverage).toBe(1.0)
    })

    it("should detect missing endpoint with same path", () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `./spec/tests/examples/simple${x}.yaml`)
        const { endpoints } = compare(fileA, fileB)
        expect(endpoints.missing.includes("/repository#post")).toBe(true)
    })

    it("should detect missing endpoint on different path", () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `./spec/tests/examples/paths${x}.yaml`)
        const { endpoints } = compare(fileA, fileB)
        expect(endpoints.missing.includes("/repositories#get")).toBe(true)
    })

    it("should detect additional endpoint with same path", () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `./spec/tests/examples/simple${x}.yaml`)
        const { endpoints } = compare(fileB, fileA)
        expect(endpoints.additional.includes("/repository#post")).toBe(true)
    })

    it("should detect additional endpoint with different path", () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `./spec/tests/examples/paths${x}.yaml`)
        const { endpoints } = compare(fileB, fileA)
        expect(endpoints.additional.includes("/repositories#get")).toBe(true)
    })
})

describe('Tester [Responses]', () => {
    it("should report 100% coverage for the same file", () => {
        const filePath = "./spec/tests/examples/specA.yaml"
        const { responses } = compare(filePath, filePath)
        expect(responses.coverage).toBe(1.0)
    })
})

describe('Tester [Parameters]', () => {
    it("[Parameters] should report 100% coverage for the same file", () => {
        const filePath = "./spec/tests/examples/specA.yaml"
        const { parameters } = compare(filePath, filePath)
        expect(parameters.coverage).toBe(1.0)
    })
})

