import { mineResponses } from "../../src/lib/analyzer";
import { mineParameters } from "../../src/lib/analyzer";

describe('Analyzer [Responses]', () => {
    it("should throw an error if handler is missing params", () => {
        expect(() => mineResponses(`function() {}`)).toThrowError("Handler had less than two args")
    })

    it("should handle a simple case (200)", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.send('respond with a resource');
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should handle a simple case (200) w/ arrow function", () => {
        const responses = Object.keys(mineResponses(`(req, res, next) => {
            res.send('respond with a resource');
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should detect a status change (404)", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.status(404).send('respond with a resource');
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('404')
    })

    it("should detect multiple explicit statuses (300 + 404)", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            if ("someCondition".length) {
                res.status(404).send('error')
            }
            res.status(300).send('respond with a resource');
        }`))
        expect(responses.length).toBe(2)
        expect(responses).toContain('300')
        expect(responses).toContain('404')
    })


    it("should detect multiple statuses with implicit one (200 + 404)", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            if ("someCondition".length) {
                return res.status(404).send()
            }
            return res.send('special variable');
        }`))
        expect(responses.length).toBe(2)
        expect(responses).toContain('200')
        expect(responses).toContain('404')
    })

    it("should detect overwriting of status codes (inline)", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.status(200).status(400).status(404).send('respond with a resource');
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('404')
    })

    it("should detect overwriting of status codes (multiline)", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.status(200)
            res.status(400)
            res.status(404)
            res.send('respond with a resource');
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('404')
    })

    it("should detect the status code of sendStatus", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.sendStatus(201)
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('201')
    })

    it("should detect the status code of a redirect", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.redirect("new_url")
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('302')
    })

    it("should detect the status code of a redirect with explicit code", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.redirect(301,"new_url")
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('301')
    })

    it("should detect the implicit code of 'json' method", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.json([])
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should detect the implicit code of 'sendFile' method", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.sendFile("")
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should detect the implicit code of 'jsonp' method", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.jsonp("")
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should detect the implicit code of 'download' method", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.download("")
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should detect the implicit code of 'end' method", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.end()
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should detect the implicit code of 'render' method", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.render("")
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should detect the implicit code of 'render' method", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.statusCode = 300
            res.end()
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('300')
    })

    it("should detect identifiers as status codes", () => {
        const responses = Object.keys(mineResponses(`function(req, res, next) {
            res.sendStatus(http2.constants.HTTP_STATUS_ACCEPTED)
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('x-HTTP_STATUS_ACCEPTED')
    })

    it("should handle inline returns", () => {
        const responses = Object.keys(mineResponses(`async (req, res, next) => {
            if ("true".length) return res.status(404).end()
            if ("true".length) return res.redirect("somewhere_else")
            return res.status(500).json([]);
        }`))
        expect(responses.length).toBe(3)
        expect(responses).toContain('500')
        expect(responses).toContain('302')
        expect(responses).toContain('404')
    })

    it("should handle await in functions", () => {
        const responses = Object.keys(mineResponses(`async (req, res, next) => {
            await delay(1000)
            res.json([])
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should handle implicit returns", () => {
        const responses = Object.keys(mineResponses(`(req, res, next) => res.json([])`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should handle try...catch statements", () => {
        const responses = Object.keys(mineResponses(`async (req, res) => {
  try {
    const results = await Actors.findAll({ raw: true });
    res.json(results);
  } catch (error) {
    next(error);
  }
}`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('200')
    })

    it("should handle single exit point with multiple execution paths", () => {
        const responses = Object.keys(mineResponses(`(req, res, next) => {
            if (cond1) {
                res.status(404)
            }
            if (cond2) {
                res.status(200)
            }
            return res.status(500).send()
        }`))
        expect(responses.length).toBe(3)
        expect(responses).toContain('200')
        expect(responses).toContain('404')
        expect(responses).toContain('500')
    })

    it("should handle single exit point with multiple execution paths (inline branching)", () => {
        const responses = Object.keys(mineResponses(`(req, res, next) => {
            if (cond1) res.status(404)
            if (cond2) res.status(200)
            return res.status(500).json([]);
        }`))
        expect(responses.length).toBe(3)
        expect(responses).toContain('200')
        expect(responses).toContain('404')
        expect(responses).toContain('500')
    })


    it("should handle single exit point with void return", () => {
        const responses = Object.keys(mineResponses(`(req, res, next) => {
            res.status(500).json([]);
        }`))
        expect(responses.length).toBe(1)
        expect(responses).toContain('500')
    })

    it("should handle single exit point with multiple execution paths and void return", () => {
        const responses = Object.keys(mineResponses(`(req, res, next) => {
            if (cond1) res.status(404)
            if (cond2) res.status(200)
            res.status(500).json([]);
        }`))
        expect(responses.length).toBe(3)
        expect(responses).toContain('200')
        expect(responses).toContain('404')
        expect(responses).toContain('500')
    })

});


describe('Analyzer [Parameters]', () => {
    it("should handle path parameters", async () => {
        const pathParams = mineParameters(`(req, res, next) => {
            res.status(500).json([]);
        }`, '/api/:param1/:param2/:param3.:param4').map(x => x.name)
        expect(pathParams).toContain('param1')
        expect(pathParams).toContain('param2')
        expect(pathParams).toContain('param3')
        expect(pathParams).toContain('param4')
    })

    it("should handle query parameters", async () => {
        const queryParams = mineParameters(`(req, res, next) => {
            const { param2 } = req.query
            const { query: { param3 }} = req
            res.status(req.query.param1).json([]);
        }`, '/').map(x => x.name)
        expect(queryParams).toContain('param1')
        expect(queryParams).toContain('param2')
        expect(queryParams).toContain('param3')

    })
})
