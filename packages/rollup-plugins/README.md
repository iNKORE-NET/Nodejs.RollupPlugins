-   A collection of some commonly used rollup plugins.
-   More info: https://github.com/iNKORE-NET/Rollup.Plugins

---

# 😭 We're Sorry that...

This package is originally created for our internal use, but we decided to share it with the community. Most of the plugins work well in our very own environment, but we can't guarantee that they will work in your environment. We're sorry for any inconvenience caused.

This is not really complete, and most of the plugins are still in the early stage of development. 

If you could be able to help us, we would be very grateful. Please feel free to contribute to this project. We welcome any issues and pull requests submitted on GitHub.

I believe that we can make it better together. Thank you for your understanding and support.

---

# ⚠️ Caution: Work in progress! (WIP)

-   We're still working on this package, which means it might be unstable or unsuable.

-   Also the APIs could be changed or removed at any time. Use at your own risk.

-   Issues and pull request are welcomed. If you encounter an issue, don't hesitate to tell us!

---

# 🤔 Quick Start

1. Install package from npm.

    ```
    [NPM] npm i @inkore/rollup-plugins -D
    [PNPM] pnpm add @inkore/rollup-plugins -D
    ```

2. Add the plugins to your rollup.config file.

    ```typescript
    import { PreserveDirectivesPlugin, ... } from "@inkore/rollup-plugins";

    export default
    {
        output:
        {
            preserveModules: true,
        },
        plugins: [ PreserveDirectivesPlugin(), ... ],
    };
    ```

# 🙋🏻‍♂️ Contribution

-   Want to contribute? The team encourages community feedback and contributions.

-   If the project is not working properly, please file a report. We welcome any issues and pull requests submitted on GitHub.

-   Sponsor us at https://inkore.net/about/members/notyoojun#sponsor
