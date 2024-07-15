// https://github.com/kshutkin/rollup-extras/blob/main/plugin-exec

import { PluginContext } from 'rollup';
import { getOptionsObject } from 'src/utils/options';
import logger from 'src/utils/logger';
import { multiConfigPluginBase } from 'src/utils/mutli-config-plugin-base';

import { Logger } from '@niceties/logger';

type CallbackFunction = (this: PluginContext & { logger: Logger }) => void;

export type ExecPluginOptions = {
    pluginName?: string;
    exec?: CallbackFunction;
} | CallbackFunction;

const factories = { logger };

export default function executeScript(options: ExecPluginOptions) {
    const normalizedOptions = getOptionsObject(typeof options === 'function' ? { exec: options } : options, {
        pluginName: '@rollup-extras/plugin-exec',
        exec: () => undefined
    }, factories);
    const { pluginName, logger, exec } = normalizedOptions;
    const instance = multiConfigPluginBase(true, pluginName, execute);
    
    let started = false;

    return instance;

    async function execute(this: PluginContext) {
        if (!started) {
            started = true;

            const newContext = Object.create(this);

            newContext.logger = logger;

            exec.apply(newContext);
        }
    }
}