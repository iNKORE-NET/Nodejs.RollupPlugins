import path from "path";
import fs from "fs";
import { glob } from "glob";
// import dts from 'rollup-plugin-dts';

import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default 
[
    {
        input: 
        [
            ...glob.sync("source/plugins/*.ts"),
            "source/index.ts",
            "source/utilities/index.ts",
        ],
        output: 
        {
            dir: "dist",
            format: "esm",
            preserveModules: true,
            preserveModulesRoot: "source",
        },
        /**
         * 
         * @param {string} id 
         * @returns 
         */
        external: (id) => 
        {
            id = id.replace(/\\/g, "/");

            const a = path.resolve(".", id.split("/")[0]);
            if (fs.existsSync(a) && !path.isAbsolute(id))
            {
                return false;
            }
            if (["/node_modules/"].some((dir) => id.includes(dir))) return true;
            if (path.relative(process.cwd(), id).startsWith("..")) return true;
           
            return false;
        },
        plugins: 
        [
            // sourcePathTransformPlugin(),
            typescript
            ({ 
                tsconfig: "./tsconfig.json",
                outputToFilesystem: true,
                removeComments: false,
            }),

            nodeResolve({ }),
        ],
    },
];

// function sourcePathTransformPlugin() 
// {
//     return {
//         name: "source-path-transform",
//         resolveId(source, importer) 
//         {
//             console.log(`source-path-transform: ${source}`);
//             if (source.startsWith("source/")) 
//             {
//                 // Remove 'source/' prefix
//                 const relativePath = source.slice(7);
        
//                 // Calculate relative path from importer to source
//                 const srcDir = path.resolve(process.cwd(), "source");
//                 const targetPath = path.resolve(srcDir, relativePath);

//                 if (importer) 
//                 {
//                     const importerDir = path.dirname(importer);
//                     const relative = path.relative(importerDir, targetPath);
//                     const final = relative.startsWith(".") ? relative : "./" + relative;
                    
//                     return {
//                         id: final,
//                         external: "relative",
//                     }
//                 }
//             }
//             return null;
//         }
//     };
// }