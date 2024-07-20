import { parse } from "acorn";
import MagicString from "magic-string";
import path from "path";
import { Plugin } from "rollup";
import { simple as acornWalk } from "acorn-walk";
import fs from "fs";

// 请帮我写一个 relative-imports 插件，解析包含文件中的所有 import 如果 import 中的路径是基于项目根目录的绝对路径，那么就将其改为相对于文件自身的相对路径。使用 magicstring 并带 sourcemap，不要直接暴力正则，而是使用 acorn 进行解析。

export type RelativeImportsPluginProps =
    {
        include?: string | RegExp;
        exclude?: string | RegExp;
    }


/*
 * This plugin change imports like "source/components/component" to relative imports like "../components/component".
 */
export default function RelativeImportsPlugin(options?: RelativeImportsPluginProps): Plugin
{
    const includePattern = options?.include ? new RegExp(options.include) : null;
    const excludePattern = options?.exclude ? new RegExp(options.exclude) : null;

    return {
        name: "relative-imports",
        transform(code, id)
        {
            if (includePattern && !includePattern.test(id))
            {
                return null;
            }

            if (excludePattern && excludePattern.test(id))
            {
                return null;
            }
            const ast = parse(code, { sourceType: 'module', ecmaVersion: "latest" });
            const magicString = new MagicString(code);

            acornWalk(ast,
                {
                    ImportDeclaration(node)
                    {
                        const importPath = node.source.value;
                        // 假设所有以 "source/" 开头的路径都是绝对路径
                        if (typeof importPath === "string")
                        {
                            if (importPath.startsWith("./") || importPath.startsWith("../"))
                            {
                                return;
                            }

                            const rootFolder = importPath.split("/")[0];

                            if (!fs.existsSync(path.join(path.dirname(id), rootFolder)))
                                return;

                            const absolutePath = path.resolve(importPath);
                            const relativePath = './' + path.relative(path.dirname(id), absolutePath).replace(/\\/g, '/');
                            const start = node.source.start;
                            const end = node.source.end;
                            magicString.overwrite(start, end, `'${ relativePath }'`);
                        }
                    },
                });

            return {
                code: magicString.toString(),
                map: magicString.generateMap({ hires: true }),
            };
        },
    };
}
