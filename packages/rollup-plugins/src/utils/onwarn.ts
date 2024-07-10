export type GetOnWarnHandlerOptions =
{
    useDefaultsExclusions?: boolean;
    exclude?: string[];
    shouldWarn?: (message: string, raw: string | object, options: GetOnWarnHandlerOptions) => boolean;
    ignoreCase?: boolean;
}

export function GetOnWarnHandler(options: GetOnWarnHandlerOptions)
{
    const 
    { 
        useDefaultsExclusions = true,
        exclude = [],
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

        let shouldWarnResult = true;

        if (shouldWarn == undefined)
        {
            const excludeList =
            [
                ...(useDefaultsExclusions ? 
                    [
                        "Module level directives cause errors when bundled",
                        "@@_MAGIC_PATH_@@",

                    ] : []),

                ...exclude
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
        else
        {
            shouldWarnResult = shouldWarn(warnMessage, warning, options);
        }

        if (shouldWarnResult)
        {
            warn(warning);
        }
    }
}