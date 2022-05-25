import path from 'path'
import {compareSpecifications} from "../../src/lib/comparator";
import logger from "jet-logger";

const examplesPath = "./spec/tests/examples/comparator"

describe('Comparator [Generic]', () => {
    it ("should throw an error for invalid/non-existent paths", async () => {
        await expectAsync(compareSpecifications("../non_existent/file.yaml", "../non_existent/file.yaml")).toBeRejected()
    })

    it ("should throw an error for folder paths", async () => {
        await expectAsync(compareSpecifications(examplesPath, examplesPath)).toBeRejected()
    })

    it("should not throw an error for different file types", async () => {
        await expectAsync(compareSpecifications(path.resolve(examplesPath, "specA.yaml"), path.resolve(examplesPath, "specB.json"))).toBeResolved()
    })

    it("should handle different versions of OAPI specification", async () => {
        await expectAsync(compareSpecifications(path.resolve(examplesPath, "v2.yaml"), path.resolve(examplesPath, "v3.yaml"))).toBeResolved()
    })
});

describe('Comparator [Endpoints]', () => {
    it("should report 100% coverage for the same file", async () => {
        const filePath = path.resolve(examplesPath, "specA.yaml")
        const { endpoints } = await compareSpecifications(filePath, filePath)
        expect(endpoints.coverage).toBe(1.0)
    })

    it("should detect missing endpoint with same path", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/simple${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileA, fileB)
        expect(endpoints.missing).toContain("/api/repository#post")
    })

    it("should detect missing endpoint on different path", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/paths${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileA, fileB)
        expect(endpoints.missing).toContain("/api/repositories#get")
    })

    it("should detect additional endpoint with same path", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/simple${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileB, fileA)
        expect(endpoints.additional).toContain("/api/repository#post")
    })

    it("should detect additional endpoint with different path", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/paths${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileB, fileA)
        expect(endpoints.additional).toContain("/api/repositories#get")
    })

    it("should detect matching endpoint", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/paths${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileB, fileA)
        expect(endpoints.matched).toContain("/api/repository#get")
    })

    it("should consider base paths when matching", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/basePaths${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileB, fileA)
        expect(endpoints.matched).toContain("/api/repository#get")
        expect(endpoints.coverage).toBe(1)
    })

    it("should handle specifications when no servers property is specified", async () => {
        const [ fileA, fileB ] = ["A","NoServers"].map(x => `${examplesPath}/basePaths${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileB, fileA)
        expect(endpoints.matched).toContain("/api/repository#get")
        expect(endpoints.coverage).toBe(1)
    })

    it("should handle specification with servers without a full path", async () => {
        const [ fileA, fileB ] = ["A","Shortened"].map(x => `${examplesPath}/basePaths${x}.yaml`)
        const { endpoints } = await compareSpecifications(fileB, fileA)
        expect(endpoints.matched).toContain("/api/repository#get")
        expect(endpoints.coverage).toBe(1)
    })
})

describe('Comparator [Responses]', () => {
    it("should report 100% coverage for the same file", async () => {
        const filePath = path.resolve(examplesPath, "specA.yaml")
        const { responses } = await compareSpecifications(filePath, filePath)
        expect(responses.coverage).toBe(1.0)
    })

    it("should detect missing response", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/response${x}.yaml`)
        const { responses } = await compareSpecifications(fileA, fileB)
        expect(responses.missing).toContain("/api/repository#get#404")
    })

    it("should detect additional response", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/response${x}.yaml`)
        const { responses } = await compareSpecifications(fileB, fileA)
        expect(responses.additional).toContain("/api/repository#get#404")
    })

    it("should match response", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/response${x}.yaml`)
        const { responses } = await compareSpecifications(fileB, fileA)
        expect(responses.matched).toContain("/api/repository#get#200")
    })
})

describe('Comparator [Parameters]', () => {
    it("should report 100% coverage for the same file", async () => {
        const filePath = path.resolve(examplesPath, "specA.yaml")
        const { parameters } = await compareSpecifications(filePath, filePath)
        expect(parameters.coverage).toBe(1.0)
    })

    it("should detect missing parameter", async () => {
        const [fileA, fileB] = ["A", "B"].map(x => `${examplesPath}/params${x}.yaml`)
        const { parameters } = await compareSpecifications(fileA, fileB)
        expect(parameters.missing).toContain("/api/repository#get#password")
    })

    it("should detect additional parameter", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/params${x}.yaml`)
        const { parameters } = await compareSpecifications(fileB, fileA)
        expect(parameters.additional).toContain("/api/repository#get#password")
    })

    it("should match parameter", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/params${x}.yaml`)
        const { parameters } = await compareSpecifications(fileA, fileB)
        expect(parameters.matched).toContain("/api/repository#get#username")
    })

    it("should not match parameter with same name but different type", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/params${x}1.yaml`)
        const { parameters } = await compareSpecifications(fileA, fileB)
        expect(parameters.matched).not.toContain("/api/repository/{repoId}#get#repoId")
    })

    it("should match path parameters with different names but same position", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/params${x}2.yaml`)
        const { parameters } = await compareSpecifications(fileA, fileB)
        expect(parameters.missing).not.toContain("/api/repository#get#repo_id")
        expect(parameters.additional).not.toContain("/api/repository#get#r_id")
        expect(parameters.partiallyMatched).toContain("/api/repository/{repoid|r_id}#get#repoid|r_id")
    })

    // it("", async () => {
    //     const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/params${x}3.yaml`)
    //     const { parameters } = await compareSpecifications(fileA, fileB)
    //     console.log(parameters)
    //     expect(true).toBe(false)
    // })

    it("should partially match routes with same structure but different path param names", async () => {
        const [ fileA, fileB ] = ["A","B"].map(x => `${examplesPath}/pathParamNames${x}.yaml`)
        const { endpoints, responses, parameters } = await compareSpecifications(fileA, fileB)
        expect(endpoints.partiallyMatched).toContain("/api/repository/{id|r_id}/{case_id|c_id}#get")
        expect(endpoints.missing).not.toContain("/api/repository/{id}/{case_id}#get")
        expect(endpoints.additional).not.toContain("/api/repository/{r_id}/{c_id}#get")
        expect(responses.partiallyMatched).toContain("/api/repository/{id|r_id}/{case_id|c_id}#get#200")
        expect(responses.missing).not.toContain("/api/repository/{id}/{case_id}#get#200")
        expect(responses.additional).not.toContain("/api/repository/{r_id}/{c_id}#get#200")
        expect(parameters.partiallyMatched.length).toBe(2)
        expect(endpoints.coverage).toBe(1)
        expect(endpoints.strictCoverage).toBe(0)
        expect(responses.coverage).toBe(1)
        expect(responses.strictCoverage).toBe(0)
        expect(parameters.strictCoverage).toBe(0)
        expect(parameters.coverage).toBe(1)
    })
})

