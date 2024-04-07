-   A collection of some commonly used rollup plugins.
-   More info: https://github.com/iNKORE-Public/Rollup.Plugins

---

# 🤔 Quick Start

1. Install package from npm.

    ```
    [NPM] npm i @inkore/rollup-plugins -D
    [PNPM] pnpm add @inkore/rollup-plugins -D
    ```

2. Add the plugins to your rollup.config file.

    ```typescript
    import { preserveDirectives, ... } from "@inkore/rollup-plugins";

    export default
    {
        output:
        {
            preserveModules: true,
        },
        plugins: [ preserveDirectives(), ... ],
    };
    ```

# 🙋🏻‍♂️ Contribution

-   Want to contribute? The team encourages community feedback and contributions.

-   If the project is not working properly, please file a report. We welcome any issues and pull requests submitted on GitHub.

-   Sponsor us at https://inkore.net/about/members/notyoojun#sponsor
