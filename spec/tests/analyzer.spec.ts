import { mineExpressResponses } from "../../src/lib/proxy/analyzer";

describe('Analyzer [Responses]', () => {
    it ("should throw an error when a handler isn't passed",  () => {
        expect(() => mineExpressResponses("")).toThrowError("Could not find handler definition in the given source code")
    })

    it("should throw an error if handler is missing params", () => {
        expect(() => mineExpressResponses("function() {}")).toThrowError("Handler had less than two args")
    })

    it("should handle a simple case (200)", () => {
        const responses = Object.keys(mineExpressResponses(`function(req, res, next) {
            res.send('respond with a resource');
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should handle a simple case (200) w/ arrow function", () => {
        const responses = Object.keys(mineExpressResponses(`(req, res, next) => {
            res.send('respond with a resource');
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should detect a status change (404)", () => {
        const responses = Object.keys(mineExpressResponses(`function(req, res, next) {
            res.status(404).send('respond with a resource');
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('404')
    })

    it("should detect multiple explicit statuses (200 + 404)", () => {
        const responses = Object.keys(mineExpressResponses(`function(req, res, next) {
            if (someCondition) {
                res.status(404).send('error')
            }
            res.status(200).send('respond with a resource');
        }`))
        expect(responses.length).toBe(2)
        expect(responses).toContain('200')
        expect(responses).toContain('404')
    })


    // it("should detect multiple statuses with implicit one (200 + 404)", () => {
    //     const responses = Object.keys(mineExpressResponses(`function(req, res, next) {
    //         if (someCondition) {
    //             res.status(404).send('error')
    //         }
    //         res.send('respond with a resource');
    //     }`))
    //     expect(responses.length).toBe(2)
    //     expect(responses).toContain('200')
    //     expect(responses).toContain('404')
    // })

    // it("should detect overwriting of status codes (inline)", () => {
    //     const responses = Object.keys(mineExpressResponses(`function(req, res, next) {
    //         res.status(200).status(400).status(404).send('respond with a resource');
    //     }`))
    //     expect(responses.length).toBe(1)
    //     expect(responses).toContain('404')
    // })

    // it("should detect overwriting of status codes (multiline)", () => {
    //     const responses = Object.keys(mineExpressResponses(`function(req, res, next) {
    //         res.status(200)
    //         res.status(400)
    //         res.status(404)
    //         res.send('respond with a resource');
    //     }`))
    //     expect(responses.length).toBe(1)
    //     expect(responses).toContain('404')
    // })

});

