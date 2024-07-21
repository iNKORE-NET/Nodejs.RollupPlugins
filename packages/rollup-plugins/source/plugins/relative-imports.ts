import { parse } from "acorn";
import MagicString from "magic-string";
import path from "path";
import { Plugin } from "rollup";
import { simple as acornWalk } from "acorn-walk";
import fs from "fs";
import { glob } from "glob";
import * as acorn from 'acorn'
import tsPlugin from 'acorn-typescript'

// 请帮我写一个 relative-imports 插件，解析包含文件中的所有 import 如果 import 中的路径是基于项目根目录的绝对路径，那么就将其改为相对于文件自身的相对路径。使用 magicstring 并带 sourcemap，不要直接暴力正则，而是使用 acorn 进行解析。

export type RelativeImportsPluginProps =
    {
        include?: string | RegExp;
        exclude?: string | RegExp;
    }


/*
 * This plugin change imports like "source/components/component" to relative imports like "../components/component".
 */
// export default function RelativeImportsPlugin(options?: RelativeImportsPluginProps): Plugin
// {
//     const includePattern = options?.include ? new RegExp(options.include) : null;
//     const excludePattern = options?.exclude ? new RegExp(options.exclude) : null;

//     return {
//         name: "relative-imports",
//         transform(code, id)
//         {
//             if (includePattern && !includePattern.test(id))
//             {
//                 return null;
//             }

//             if (excludePattern && excludePattern.test(id))
//             {
//                 return null;
//             }

//             return processFile(code, id);
//         },
//     };
// }

export type RelativeDtsImportsPluginOptions =
    {
        dtsBuildDir: string;
        dtsFilter: string;
        sourceDirName: string;
    }

export function RelativeDtsImportsPlugin(_options?: Partial<RelativeDtsImportsPluginOptions>): Plugin
{
    const options: RelativeDtsImportsPluginOptions =
    {
        sourceDirName: "source",
        dtsBuildDir: "dist/types",
        dtsFilter: "**/*.d.ts",

        ..._options,
    }

    return {
        name: "relative-dts-imports",
        writeBundle()
        {
            // 使用 glob 查找所有的 .d.ts 文件
            const files = glob.sync(normalizePath(options.dtsBuildDir) + "/" + options.dtsFilter);

            files.forEach(file =>
            {
                const content = fs.readFileSync(file, 'utf8');
                let contentNew: string | undefined = undefined;

                const importRegex = /(import\s+(?:\*\s+as\s+\w+|\w+|\{(?:.|\s)*?\})\s+from\s+['"`])(.*?)(['"`])/gm;
                let match;
                while ((match = importRegex.exec(contentNew ?? content)) !== null)
                {
                    const [fullMatch, , modulePath] = match;
                    // 计算相对路径

                    const relativePath = relat(modulePath, path.relative(process.cwd(), file), options.sourceDirName, options.dtsBuildDir);

                    if (relativePath != null)
                    {
                        if (contentNew === undefined)
                            contentNew = content;

                        contentNew = contentNew.replaceAll(fullMatch, fullMatch.replaceAll(modulePath, relativePath));
                    }
                }

                // 写回修改后的内容
                if (contentNew !== undefined)
                    fs.writeFileSync(file, contentNew, 'utf8');
            });
        }
    };
}


// function processFile(code: string, id: string)
// {
//     const ast = parse(code, { sourceType: 'module', ecmaVersion: "latest" });
//     const magicString = new MagicString(code);

//     let isChanged = false;
//     acornWalk(ast,
//         {
//             ImportDeclaration(node)
//             {
//                 const importPath = node.source.value;
//                 // 假设所有以 "source/" 开头的路径都是绝对路径
//                 if (typeof importPath === "string")
//                 {
//                     const rela = relat(importPath, id);
//                     if (rela != null)
//                     {
//                         const start = node.source.start;
//                         const end = node.source.end;
//                         magicString.overwrite(start, end, `'${ rela }'`);
//                         isChanged = true;
//                     }
//                 }

//             },
//         });

//     return {
//         hasChanged: isChanged,
//         code: magicString.toString(),
//         map: magicString.generateMap({ hires: true }),
//     };
// }


function relat(importPath: string, filePath: string, sourceDirName: string, dtsBuildDir: string)
{
    if (typeof importPath === "string")
    {
        if (importPath.startsWith("./") || importPath.startsWith("../"))
        {
            return null;
        }

        const rootFolder = importPath.split("/")[importPath.startsWith("./") ? 1 : 0];
        let importPathModified = importPath;

        if (!fs.existsSync(path.resolve(rootFolder)))
            return null;

        if (rootFolder.toLowerCase() == sourceDirName.toLowerCase())
        {
            importPathModified = path.join(dtsBuildDir, importPath.substring(importPath.indexOf(rootFolder) + rootFolder.length));
        }


        const absolutePath = path.resolve(importPathModified);
        const relativePath = './' + path.relative(path.dirname(filePath), absolutePath).replace(/\\/g, '/');

        return relativePath;
    }

    return null;
}

function normalizePath(filePath: string)
{
    let pt = filePath;

    pt = pt.replaceAll("\\", "/");

    if (pt.endsWith("/"))
        pt = pt.substring(0, pt.length - 1);

    return pt;
}