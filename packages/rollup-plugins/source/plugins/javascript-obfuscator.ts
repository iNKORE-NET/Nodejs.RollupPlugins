// https://github.com/getkey/rollup-plugin-obfuscator


import { Plugin } from 'rollup';
import { createFilter } from '@rollup/pluginutils';

import { ObfuscationResult, ObfuscatorOptions } from 'javascript-obfuscator';

import pkg from 'javascript-obfuscator';

import fs from 'fs';
import path from "path";

const { obfuscate } = pkg;

type FilterOptions = string | RegExp | (string | RegExp)[];

export interface RollupPluginObfuscatorOptions
{
    /**
     * Set to `true` if you want to obfuscate the whole bundle, `false` to obfuscate each file separately.
     * @default false
     */
    global: boolean,
    /**
     * javascript-obfuscator options. Refer to documentation here https://github.com/javascript-obfuscator/javascript-obfuscator#javascript-obfuscator-options
     * @default {}
     */
    options: ObfuscatorOptions,
    /**
     * Files to include when applying per-file obfuscation.
     * @default ['**\/*.js', '**\/*.ts']
     */
    include: FilterOptions,
    /**
     * Files to exclude when applying per-file obfuscation. The priority is higher than `include`.
     * @default ['node_modules/**']
     */
    exclude: FilterOptions,
    /**
     * Overwrite the obfuscate method used.
     */
    obfuscate: (sourceCode: string, inputOptions?: ObfuscatorOptions) => ObfuscationResult,

    shouldObfuscate?: ((code: string, id: string) => boolean);
}

const defaultOptions = {
    global: false,
    options: {},
    include: ['**/*.js', '**/*.ts'],
    exclude: ['node_modules/**'],
    obfuscate,
    shouldObfuscate: undefined
};

function javascriptObfuscator(override?: Partial<RollupPluginObfuscatorOptions>): Plugin
{
    const options: RollupPluginObfuscatorOptions = {
        ...defaultOptions,
        ...override,
    };
    const filter = createFilter(options.include, options.exclude);

    return {
        name: 'rollup-plugin-obfuscator',

        transform: options.global ? undefined : (code, id) => 
        {
            if (!filter(id)) return null;

            if (options.shouldObfuscate)
            {
                if (!options.shouldObfuscate(code, id))
                    return;
            }

            const obfuscationResult = options.obfuscate(code, {
                ...options.options,
                inputFileName: id,
                sourceMap: true,
            });

            return {
                code: obfuscationResult.getObfuscatedCode(),
                map: obfuscationResult.getSourceMap(),
            };
        },
        renderChunk: !options.global ? undefined : (code, { fileName }) =>
        {
            const obfuscationResult = options.obfuscate(code, {
                ...options.options,
                inputFileName: fileName,
                sourceMap: true,
            });

            return {
                code: obfuscationResult.getObfuscatedCode(),
                map: obfuscationResult.getSourceMap(),
            };
        }
    };
}

export default javascriptObfuscator;
// unfortunately, TypeScript won't generate the following for us
// see https://github.com/microsoft/TypeScript/issues/2719
// but we can assume we're always in a CommonJS environment. Right? ...Right?
//module.exports = javascriptObfuscator;