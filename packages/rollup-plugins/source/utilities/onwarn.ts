export type GetOnWarnHandlerOptions =
{
    /** Automatically filters out some warnings that are actually normal when using the plugins. We STRONGLY recommend to keep this enabled. Default is true. */
    useDefaultExclusions?: boolean;
    /**
     * List of strings that will be used to filter out warnings.
     * When a warning message includes any of these strings, it will be ignored.
     */
    exclusions?: string[];
    /**
     * A custom function that will be used to determine if a warning should be shown or not. This function will have the highest priority.
     * @param message 
     * @param raw 
     * @param options 
     * @returns If true, the warning will be shown. If false, it will be ignored. If undefined, the default behavior will be used (exclusions).
     */
    shouldWarn?: (message: string, raw: string | object, options: GetOnWarnHandlerOptions) => (boolean | void);
    /**
     * If true, the comparison of the warning message with the exclusion list will be case-insensitive. Default is true.
     */
    ignoreCase?: boolean;
}

/**
 * Get a onWarn handler that can be used in rollup plugins. 
 * You can also provide a custom function to determine if a warning should be shown or not.
 * @example
 * ```ts
 * export default { ..., onwarn: onWarnHandler({ exclusions: ["some warning message u dont wanna see"] }) }
 * ```
 */
export function onWarnHandler(options: GetOnWarnHandlerOptions)
{
    const { 
        useDefaultExclusions = true,
        exclusions = [],
        shouldWarn = undefined,
        ignoreCase = true

    } = options;

    return (warning: string | object, warn: (arg0: any) => void) =>
    {
        // ----------
        // Get actual message
        // ----------

        let warnMessage = "";

        if (typeof warning === "string")
        {
            warnMessage = warning;
        }
        else if (typeof warning === "object")
        {
            if ("message" in warning)
            {
                const warningMessage = warning.message;
                if(typeof warningMessage === "string")
                {
                    warnMessage = warningMessage;
                }
            }
            else
            {
                warnMessage = JSON.stringify(warning);
            }
        }
        else
        {
            warnMessage = "(unknown)";
        }


        // ----------
        // Check if should warn
        // ----------

        let shouldWarnResult: boolean | undefined = undefined;

        if (shouldWarn)
            shouldWarnResult = shouldWarn(warnMessage, warning, options) ?? undefined;

        if (shouldWarnResult === undefined)
        {
            const excludeList =
            [
                ...(useDefaultExclusions ? 
                    [
                        "Module level directives cause errors when bundled",
                        "@@_MAGIC_PATH_@@",

                    ] : []),
                ...exclusions
            ];

            if (ignoreCase)
            {
                if (excludeList.some((e) => warnMessage.toLowerCase().includes(e.toLowerCase())))
                {
                    shouldWarnResult = false;
                }
            }
            else
            {
                if (excludeList.some((e) => warnMessage.includes(e)))
                {
                    shouldWarnResult = false;
                }
            }
        }
        

        if (shouldWarnResult)
        {
            warn(warning);
        }
    }
}