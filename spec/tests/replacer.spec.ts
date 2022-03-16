import path from "path"
import { copy, remove } from "fs-extra";
import { replaceExpress } from "../../src/lib/replacer";
import { replaceInFile } from "replace-in-file";

const examplesPath = "./spec/tests/examples/replacer"

describe('Replacer', () => {
  it("should handle empty projects or projects without .js / .ts files", async () => {
    await expectAsync(replaceExpress(path.resolve(examplesPath, "empty-folder"))).toBeResolved()
  })

  it ("should replace top level imports of 'express' with 'express-api'", async () => {
    await replaceExpress(path.resolve(examplesPath, "top-level"))

    try {
      const result = await replaceInFile({
        files: path.resolve(examplesPath, ".expresso-runtime/**/*.js"),
        from: /"expresso-api"/g,
        to: '',
        countMatches: true,
        dry: true
      })
      const expressoCount = result.map(x => x.numMatches || 0).reduce((prev, curr) => prev+curr, 0)
      expect(expressoCount).toBe(1)
    } catch (e) {
      console.error(e)
    }
    await remove(path.resolve(examplesPath, ".expresso-runtime"))
  })

  it("should replace imports of express at any level of 'express' with 'expresso-api'", async () => {
    await replaceExpress(path.resolve(examplesPath, "nested"))

    try {
      const result = await replaceInFile({
        files: path.resolve(examplesPath, ".expresso-runtime/**/*.js"),
        from: /"expresso-api"/g,
        to: '',
        countMatches: true,
        dry: true
      })
      const expressoCount = result.map(x => x.numMatches || 0).reduce((prev, curr) => prev+curr, 0)
      expect(expressoCount).toBe(2)
    } catch (e) {
      console.error(e)
    }
    await remove(path.resolve(examplesPath, ".expresso-runtime"))
  })
});

