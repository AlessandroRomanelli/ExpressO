import {  remove } from 'fs-extra';
import logger from 'jet-logger';
import { exec as syncExec } from 'child_process';
import { promisify } from "util"

(async () => {
    const exec = promisify(syncExec)
    // Remove current build
    await remove('./dist/');
    // Copy back-end files
    const { stdout, stderr } = await exec('tsc --build tsconfig.prod.json', {
        cwd: './'
    })
    if (stdout) logger.info(stdout)
    if (stderr) logger.err(stderr)

    logger.info("Project built successfully")
})();

