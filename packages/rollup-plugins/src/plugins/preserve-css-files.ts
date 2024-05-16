// From https://github.com/DanielAmenou/rollup-plugin-lib-style

import { createFilter } from "@rollup/pluginutils"
import fs from "fs-extra"
import * as sass from "sass"
import * as glob from "glob"

//#region Types

export interface ProcessArgs {
  code: string
  filePath: string
}

export interface Loader {
  name: string
  regex: string
  process: (arg: ProcessArgs) => string
}

export interface PreserveCssFileOptions 
{
  include?: string | string[]
  exclude?: string | string[]
  loaders?: Loader[]
  importCSS?: boolean
  postCssPlugins?: object[]
  classNamePrefix?: string
  scopedName?: string
  customPath?: string
}

//#endregion

//#region Main

const PLUGIN_NAME = "rollup-plugin-lib-style"
const MAGIC_PATH_REGEX = /@@_MAGIC_PATH_@@/g
const MAGIC_PATH = "@@_MAGIC_PATH_@@"

const modulesIds = new Set()

const outputPaths: string[] = [];
const inputPaths: string[] = []

const defaultLoaders = [
  {
    name: "sass",
    regex: /\.(sass|scss)$/,
    process: ({filePath}) => ({code: sass.compile(filePath).css.toString()}),
  },
  {
    name: "css",
    regex: /\.(css)$/,
    process: ({code}) => ({code}),
  },
]

const replaceMagicPath = (fileContent, customPath = ".") => fileContent.replace(MAGIC_PATH_REGEX, customPath)

function PreserveCssFile (options: PreserveCssFileOptions = {})
{
  const {customPath, loaders, include, exclude, importCSS = true, ...postCssOptions} = options
  const allLoaders = [...(loaders || []), ...defaultLoaders]
  const filter = createFilter(include, exclude)
  const getLoader = (filepath) => allLoaders.find((loader) => typeof loader.regex === "string" ? loader.regex == filepath : loader.regex.test(filepath))

  return {
    name: PLUGIN_NAME,

    options(options) 
    {
        if (!options.output) console.error("missing output options")
        else options.output.forEach((outputOptions) => outputPaths.push(outputOptions.dir))
        
        if (!options.input) console.error("missing input options")
        else
        {
            if(typeof options.input === "string")
            {
                inputPaths.push(options.input)
            }
            else if (Array.isArray(options.input))
            {
                options.input.forEach((inputOptions) => inputPaths.push(inputOptions.dir))
            }
        }
    },

    async transform(code, id) {
      const loader = getLoader(id)
      if (!filter(id) || !loader) return null

      modulesIds.add(id)

      const rawCss = await loader.process({filePath: id, code})

      const postCssResult = await postCssLoader({code: typeof rawCss == "string" ? rawCss : rawCss.code, fiePath: id, options: postCssOptions})

      for (const dependency of postCssResult.dependencies) this.addWatchFile(dependency)

      const cssFilePathAbsolute = id.replace(loader.regex, ".css").replaceAll("\\", "/");

      let cssFilePath = path.relative(process.cwd(), cssFilePathAbsolute);
      const cssFilePath_parts = cssFilePath.split("/");
      if (cssFilePath_parts.length > 0) cssFilePath = cssFilePath.substring(cssFilePath_parts[0].length + 1);
    this.warn(cssFilePath);
      // create a new css file with the generated hash class names
      this.emitFile({
        type: "asset",
        fileName: cssFilePath,
        source: postCssResult.extracted.code,
      })

      const importStr = importCSS ? `import "${MAGIC_PATH}${cssFilePath}";\n` : ""

      // create a new js file with css module
      return {
        code: importStr + postCssResult.code,
        map: {mappings: ""},
      }
    },

    async closeBundle() {
      if (!importCSS) return

      // get all the modules that import CSS files
      const importersPaths = outputPaths
        .reduce((result: string[][], currentPath) => {
          result.push(glob.sync(`${currentPath}/**/*.js`))
          return result
        }, [])
        .flat()

      // replace magic path with relative path
      await Promise.all(
        importersPaths.map((currentPath) =>
          fs
            .readFile(currentPath)
            .then((buffer) => buffer.toString())
            //.then((fileContent) => replaceMagicPath(fileContent, "./"))
            .then((fileContent) => {
                const regex = /import\s+['"]@@_MAGIC_PATH_@@([^'"]+)['"]/g;
                return fileContent.replace(regex, (_, match) => {
                    let relativePath = path.relative(path.dirname(currentPath), path.join(match)).replace(/\\/g, "/");
                    if (!fs.existsSync(path.resolve(path.dirname(currentPath), relativePath)))
                    {
                        if(relativePath.startsWith("../"))
                        {
                            const newPath = relativePath.substring("../".length);
                            if (fs.existsSync(path.resolve(path.dirname(currentPath), relativePath)))
                                relativePath = newPath;
                        }
                    }
                    const correctedPath = relativePath.replace(/\\/g, "/");
                    return `import '${"currenPath:" + currentPath + "_match:" + match}'`;
                });
            })
            .then((fileContent) => fs.writeFile(currentPath, fileContent))
        )
      )
    },
  }
}

const onwarn = (warning, warn) => {
  if (warning.code === "UNRESOLVED_IMPORT" && warning.message.includes(MAGIC_PATH)) return
  warn(warning)
}

export { onwarn as PreserveCssFileOnWarn }
export default PreserveCssFile;

//#endregion

//#region Functions

import crypto from "node:crypto"

const hashFormats = ["latin1", "hex", "base64"]

const replaceFormat = (formatString, fileName, cssContent) => {
  const hashLengthMatch = formatString.match(/hash:.*:(\d+)/)
  const hashFormatMatch = formatString.match(/hash:([^:]*)[:-]?/)
  const hashFormat = hashFormatMatch && hashFormats.includes(hashFormatMatch[1]) ? hashFormatMatch[1] : "hex"
  const hashLength = hashLengthMatch ? parseInt(hashLengthMatch[1]) : 6
  const hashString = crypto.createHash("md5").update(cssContent).digest(hashFormat)
  const hashToUse = hashString.length < hashLength ? hashString : hashString.slice(0, hashLength)
  return formatString.replace("[local]", fileName).replace(/\[hash:(.*?)(:\d+)?\]/, hashToUse)
}


//#endregion

//#region Transformer

import postcss from "postcss"
import postcssModules from "postcss-modules"
import path from "node:path"

const DEFAULT_SCOPED_NAME = "[local]_[hash:hex:6]"

/**
 * @typedef {object} postCssLoaderOptions
 * @property {object[]} postCssPlugins
 * @property {string} classNamePrefix
 * @property {string} scopedName
 */

/**
 * @typedef {object} postCssLoaderProps
 * @property {postCssLoaderOptions} options
 * @property {string} fiePath
 * @property {string} code
 */

/**
 * Transform CSS into CSS-modules
 * @param {postCssLoaderProps}
 * @returns
 */
const postCssLoader = async ({code, fiePath, options}) => {
  const {scopedName = DEFAULT_SCOPED_NAME, postCssPlugins = [], classNamePrefix = ""} = options

  const modulesExported = {}

  const isGlobalStyle = /\.global.(css|scss|sass|less|stylus)$/.test(fiePath)
  const isInNodeModules = /[\\/]node_modules[\\/]/.test(fiePath)

  const postCssPluginsWithCssModules = [
    postcssModules({
      generateScopedName: (name, filename, css) => {
        return isInNodeModules || isGlobalStyle ? name : classNamePrefix + replaceFormat(scopedName, name, css)
      },
      getJSON: (cssFileName, json) => (modulesExported[cssFileName] = json),
    }),
    ...postCssPlugins,
  ]

  const postcssOptions = {
    from: fiePath,
    to: fiePath,
    map: false,
  }

  const result = await postcss(postCssPluginsWithCssModules).process(code, postcssOptions)

  // collect dependencies
  const dependencies: string[] = []
  for (const message of result.messages) {
    if (message.type === "dependency") {
      dependencies.push(message.file)
    }
  }

  // print postcss warnings
  for (const warning of result.warnings()) {
    console.warn(`WARNING: ${warning.plugin}:`, warning.text)
  }

  return {
    code: `export default ${JSON.stringify(modulesExported[fiePath])};`,
    dependencies,
    extracted: {
      id: fiePath,
      code: result.css,
    },
  }
}

//#endregion