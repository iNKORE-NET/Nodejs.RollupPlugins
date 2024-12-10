// https://github.com/prantlf/rollup-plugin-write-only-changes/blob/master/lib/index.js

import { readFile } from "fs/promises";
import { dirname, join } from "path";
import type { Plugin } from "rollup";

export type WriteOnlyChangesLogOptions =
{
    /**
     * Log files, which were missing in the output directory.
     * @default false
     */
    missing?: boolean;

    /**
     * Log files, which failed when they tried to be read from the output directory.
     * @default true
     */
    failing?: boolean;

    /**
     * Log files, which already existed in the output directory and were read.
     * @default false
     */
    existed?: boolean;

    /**
     * Log files, which had to be created in the output directory,
     * because they did not exist there.
     * @default false
     */
    created?: boolean;

    /**
     * Log files, which had to be rewritten in the output directory,
     * because their content was different.
     * @default false
     */
    changed?: boolean;

    /**
     * Log files, which did not have to be rewritten in the output directory,
     * because their content remained the same.
     * @default false
     */
    intact?: boolean;
}

export type WriteOnlyChangesPluginOptions =
{
    /**
     * Logging configuration. All cases can be enabled by `true` and disabled
     * by `false`. ingle cases are selectable by specifying an object
     * with `WriteOnlyChangesPluginLogOptions`.
     * @default { failing: true }
     */
    verbose?: boolean | WriteOnlyChangesLogOptions;

    /**
     * If the output files should be forcibly written at least once, when rollup
     * starts and the project is built at first, before the watcher starts.
     * @default false
     */
    rebuild?: boolean;
}

const cache = new Map();

export default function WriteOnlyChangesPlugin({ verbose, rebuild }: WriteOnlyChangesPluginOptions = {}): Plugin
{
    let missing; let failing; let existed; let created; let changed; let intact;
    if (verbose) 
    {
        if (verbose === true) 
        {
            missing = failing = existed = created = changed = intact = true;
        }
        else 
        {
            ({ missing, failing, existed, created, changed, intact } = verbose);
        }
    }
    const cwd = process.cwd();

    return {
        name: "write-only-changes",

        async generateBundle({ dir, file }, bundles, write) 
        {
            if (!write || !file) return;
            const outDir = join(cwd, dir ? dir : dirname(file));
            for (const name in bundles) 
            {
                const file = join(outDir, name);
                const bundle = bundles[name];
                const current = "code" in bundle ? bundle.code : bundle.source;
                let previous = cache.get(file);
                if (!previous && !rebuild) 
                {
                    try 
                    {
                        previous = await readFile(file, "utf8");
                        // const map = /\r?\n\s*\/\/\s*#\s*sourceMappingURL=.+$/m.exec(previous)
                        // if (map) {
                        //   previous = previous.substring(0, map.index)
                        // }
                        // previous = previous.trim()
                        cache.set(file, previous);
                        existed && console.warn(`existed: ${name}`);
                    }
                    catch (error) 
                    {
                        if (error.code === "ENOENT") 
                        {
                            missing && console.warn(`missing: ${name}`);
                        }
                        else 
                        {
                            failing && console.warn(`failing: ${name} (${error.message})`);
                        }
                    }
                }
                // current = current.trim()
                if (previous === current) 
                {
                    // eslint-disable-next-line no-console
                    intact && console.log(`intact:  ${name}`);
                    delete bundles[name];
                    continue;
                }
                if (previous) 
                {
                    // eslint-disable-next-line no-console
                    changed && console.log(`changed: ${name}`);
                }
                else 
                {
                    // eslint-disable-next-line no-console
                    created && console.log(`created: ${name}`);
                }
                cache.set(file, current);
            }
        }
    };
}