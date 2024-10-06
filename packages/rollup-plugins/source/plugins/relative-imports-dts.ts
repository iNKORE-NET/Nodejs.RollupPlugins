import MagicString from "magic-string";
import path from "path";
import { Plugin } from "rollup";
import fs from "fs";
import { createFilter } from "@rollup/pluginutils";

// 请帮我写一个 relative-imports 插件，解析包含文件中的所有 import 如果 import 中的路径是基于项目根目录的绝对路径，那么就将其改为相对于文件自身的相对路径。使用 magicstring 并带 sourcemap，不要直接暴力正则，而是使用 acorn 进行解析。

export type RelativeDtsImportsPluginOptions =
{
    include?: string | RegExp;
    exclude?: string | RegExp;
    /**
     * - Auto: Automatically find all directories in the project root and use them as root directories.
     * - Strings in the array: the directories to be used as root directories. relative to the current working directory.
     * - Objects in the array: the directories to be used as root directories. The `alias` is the name of the root directory, and the `path` is the absolute path to the root directory.
     */
    rootDirectories?: (string | { alias: string; path: string; })[] | "auto";



    // /**
    //  * When there arer two directories 'source' and 'dist'. In one dts file it imports from 'source/path/to'.
    //  * The plugin will resolve the path to the real 'source' directory. This is not expected. What we want is to resolve the path to the 'dist' directory.
    //  * So this property is used to transform the source directory to the dist directory.
    //  * 
    //  */
    // sourceDirectoryTransform?: (sourceDir: string) => string | { soruce: string[]; dist: string; } | { source: string; dist: string; }[];
}


export const RelativeDtsImportsPluginOptionsDefaults: RelativeDtsImportsPluginOptions =
{
    rootDirectories: 
    [
        {
            alias: "source",
            path: "./dist/types"
        }
    ]
}

type TextRange = { start: number, end: number };

/**
 * This plugin helps to change imports in .d.ts files from absolute paths to relative paths.
 * For example, it changes `"source/components/component"` to `"../components/component"`.
 * This is useful when you have a project with a complex structure and you want to make the imports more portable.
 * 
 * This plugin need to be placed after the `typescript` plugin.
 */
export function RelativeDtsImportsPlugin(_options?: Partial<RelativeDtsImportsPluginOptions>): Plugin
{
    const options: RelativeDtsImportsPluginOptions =
    {
        ...RelativeDtsImportsPluginOptionsDefaults,
        ..._options,
    }
    const filter = createFilter(options.include, options.exclude);

    const rootDirectories: { [key: string]: string } = {};

    if (options.rootDirectories === "auto")
    {
        fs.readdirSync(path.resolve(".")).forEach(file =>
        {
            const fullPath = path.resolve(file);
            if (fs.statSync(fullPath).isDirectory())
            {
                rootDirectories[normalizePath(file).toLowerCase()] = fullPath;
            }
        });
                            
    }
    else if (Array.isArray(options.rootDirectories))
    {
        for (const dir of options.rootDirectories)
        {
            if (typeof dir === "string")
            {
                rootDirectories[normalizePath(dir).toLowerCase()] = path.resolve(dir);
            }
            else
            {
                rootDirectories[normalizePath(dir.alias).toLowerCase()] = path.resolve(dir.path);
            }
        }
    }

    return {
        name: "relative-dts-imports",
        generateBundle(outputOptions, bundle, isWrite)
        {
            Object.keys(bundle).forEach(filePath =>
            {
                if (!filter(filePath)) return;

                const file = bundle[filePath];
                if ("code" in file)
                {
                    // Here goes .js files
                    // Don't need to do anything here
                }
                else if ("source" in file)
                {
                    // Here goes .d.ts files
                    if (filePath.toLowerCase().trim().endsWith(".d.ts"))
                    {
                        const ms = new MagicString(typeof file.source === "string" ? file.source : file.source.toString());
                        // const ast = acorn.Parser.extend(tsPlugin({ dts: true }) as any).parse(ms.original, { sourceType: "module", ecmaVersion: "latest", locations: true });
                        /* eslint-disable quotes */

                        const imports: 
                        {  
                            /** e.g. `import React from "react"` */
                            statement: TextRange,
                            /** e.g. `"react"` */
                            source: TextRange,
                        }[] = [];

                        // Acorn is not able to parse TypeScript, so we need to use regex to find the imports
                        // Check all `import "..."` statements
                        // "import" + 任意数量空格 + 任意引号 + 匹配此处内容 + 任意引号

                        function foundMatch(match: RegExpExecArray)
                        {
                            imports.push
                            ({
                                statement: { start: match.index, end: match.index + match[0].length },
                                source: { start: match.index + match[0].indexOf(match[1]), end: match.index + match[0].indexOf(match[1]) + match[1].length },
                            });
                        }

                        const importRegex = new RegExp(`import\\s*['"\`]([^'"\n]+)['"\`]`, "g");
                        let match: RegExpExecArray | null;
                        while (match = importRegex.exec(ms.original))
                        {
                            foundMatch(match);
                        }

                        // Check all `im/export ... from "..."` statements
                        // "import" 或 "export" + 任意数量空格 + 不含引号的内容 + 任意数量空格 + "from" + 任意数量空格 + 任意引号 + 匹配此处内容 + 任意引号

                        const importFromRegex = new RegExp(`(?:import|export)\\s+[^'"\`]+\\s+from\\s+['"]([^'"]+)['"\`]`, "g");
                        while (match = importFromRegex.exec(ms.original))
                        {
                            foundMatch(match);
                           
                        }

                        // Check all `require("...")` and `import("...")` statements

                        const requireRegex = new RegExp(`(?:require|import)\\s*\\(["'\`]([^'"\`]+)["']\\)`, "g");
                        while (match = requireRegex.exec(ms.original))
                        {
                            foundMatch(match);
                        }

                        // Change the imports

                        for (const imp of imports)
                        {
                            // Check if the current import is in a comment
                            let isComment = false;
                            const txtBefore = ms.original.substring(0, imp.statement.start);
                            const txtAfter = ms.original.substring(imp.statement.end);

                            // const txtBeforeLastQuote = Math.max(txtBefore.lastIndexOf("\""), txtBefore.lastIndexOf("'"), txtBefore.lastIndexOf("`"));
                            // const txtAfterFirstQuote = Math.min(txtAfter.indexOf("\""), txtAfter.indexOf("'"), txtAfter.indexOf("`"));

                            isComment = isComment || (txtBefore.lastIndexOf("/*") > txtBefore.lastIndexOf("*/") 
                                && txtAfter.indexOf("*/") < txtAfter.indexOf("/*"));
                            isComment = isComment || txtBefore.lastIndexOf("//") > txtBefore.lastIndexOf("\n");
                            
                            if (isComment) continue;

                            const originalSource = normalizePath(ms.original.substring(imp.source.start, imp.source.end));
                            const originalSourcePts = normalizePath(originalSource).split("/");

                            if (originalSource.startsWith(".")) continue;
                            if (originalSource.startsWith("/")) continue;
                            if (originalSourcePts.length === 0) continue;

                            for (const dir of Object.keys(rootDirectories))
                            {
                                const rootDir = rootDirectories[dir];
                                if (originalSourcePts[0].toLowerCase() == dir)
                                {
                                    const newSourceAbs = normalizePath(rootDir + "/" + originalSource.substring(originalSourcePts[0].length + 1))
                                    const currentFileDir = path.resolve(outputOptions.dir ?? ".", path.dirname(file.fileName));
                                    const newSource = path.relative(currentFileDir, newSourceAbs).replaceAll("\\", "/");

                                    ms.overwrite(imp.source.start, imp.source.end, newSource);
                                    break;
                                }
                            }
                        }

                        file.source = ms.toString();
                    }
                }
            });
        }
    };
}



function normalizePath(filePath: string)
{
    let pt = filePath;

    pt = pt.replaceAll("\\", "/");

    if (pt.endsWith("/"))
        pt = pt.substring(0, pt.length - 1);

    return pt;
}