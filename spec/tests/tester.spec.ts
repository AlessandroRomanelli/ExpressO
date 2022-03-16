import path from 'path'
import {compareSpecifications} from "../../src/lib/tester";

const examplesPath = "./spec/tests/examples/tester"

describe('Tester [Generic]', () => {
    it ("should throw an error for invalid/non-existent paths", async () => {
        await expectAsync(compareSpecifications("../non_existent/file.yaml", "../non_existent/file.yaml")).toBeRejected()
    })

    it ("should throw an error for folder paths", async () => {
        await expectAsync(compareSpecifications(examplesPath, examplesPath)).toBeRejected()
    })

    it("should throw an error for missing 'paths' property", async () => {
        const filePath = path.resolve(examplesPath, "specMissingPaths.yaml")
        await expectAsync(compareSpecifications(filePath,  filePath)).toBeRejected()
    })

    it("should not throw an error for different file types", async () => {
        await expectAsync(compareSpecifications(path.resolve(examplesPath, "specA.yaml"), path.resolve(examplesPath, "specB.json"))).toBeResolved()
    })

    it("should handle different versions of OAPI specification", async () => {
        await expectAsync(compareSpecifications(path.resolve(examplesPath, "v2.yaml"), path.resolve(examplesPath, "v3.yaml"))).toBeResolved()
    })
});

describe('Tester [Endpoints]', () => {
    it("should report 100% coverage for the same file", async () => {
        const filePath = path.resolve(examplesPath, "specA.yaml")
        const { endpoints } = await compareSpecifications(filePath, filePath)
        expect(endpoints.coverage).toBe(1.0)
    })

    it("should detect missing endpoint with same path", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/simple${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileA, fileB)
        expect(endpoints.missing.includes("/repository#post")).toBe(true)
    })

    it("should detect missing endpoint on different path", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/paths${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileA, fileB)
        expect(endpoints.missing.includes("/repositories#get")).toBe(true)
    })

    it("should detect additional endpoint with same path", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/simple${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileB, fileA)
        expect(endpoints.additional.includes("/repository#post")).toBe(true)
    })

    it("should detect additional endpoint with different path", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/paths${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileB, fileA)
        expect(endpoints.additional.includes("/repositories#get")).toBe(true)
    })

    it("should detect matching endpoint", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/paths${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileB, fileA)
        expect(endpoints.matched.includes("/repository#get")).toBe(true)
    })
})

describe('Tester [Responses]', () => {
    it("should report 100% coverage for the same file", async () => {
        const filePath = path.resolve(examplesPath, "specA.yaml")
        const { responses } = await compareSpecifications(filePath, filePath)
        expect(responses.coverage).toBe(1.0)
    })

    it("should detect missing response", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/response${x}.yaml`)
        const { responses } = await compareSpecifications(fileA, fileB)
        expect(responses.missing.includes("/repository#get#404")).toBe(true)
    })

    it("should detect additional response", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/response${x}.yaml`)
        const { responses } = await compareSpecifications(fileB, fileA)
        expect(responses.additional.includes("/repository#get#404")).toBe(true)
    })

    it("should match response", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/response${x}.yaml`)
        const { responses } = await compareSpecifications(fileB, fileA)
        expect(responses.matched.includes("/repository#get#200")).toBe(true)
    })
})

describe('Tester [Parameters]', () => {
    it("should report 100% coverage for the same file", async () => {
        const filePath = path.resolve(examplesPath, "specA.yaml")
        const { parameters } = await compareSpecifications(filePath, filePath)
        expect(parameters.coverage).toBe(1.0)
    })

    it("should detect missing parameter", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/params${x}.yaml`)
        const { parameters } = await compareSpecifications(fileA, fileB)
        expect(parameters.missing.includes("/repository#get#password"))
    })

    it("should detect additional parameter", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/params${x}.yaml`)
        const { parameters } = await compareSpecifications(fileB, fileA)
        expect(parameters.additional.includes("/repository#get#password"))
    })

    it("should match parameter", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/params${x}.yaml`)
        const { parameters } = await compareSpecifications(fileA, fileB)
        expect(parameters.matched.includes("/repository#get#username"))
    })
})

