<p align="center">
  <a target="_blank" rel="noopener noreferrer">
    <img width="128" src="https://raw.githubusercontent.com/iNKORE-Public/.github/main/assets/Inkore_Badge.png?raw=true)" alt="iNKORE Logo">
  </a>
</p>

<p align="center">A collection of some commonly used rollup plugins.</p>

<h1 align="center">
  iNKORE.Rollup.Plugins
</h1>

<p align="center">Give us a star if you like this!</p>

<p align="center">
  <a href="https://github.com/iNKORE-Public/Rollup.Plugins/releases"><img src="https://img.shields.io/github/downloads/iNKORE-Public/Rollup.Plugins/total?color=%239F7AEA" alt="Release Downloads"></a>
  <a href="#"><img src="https://img.shields.io/github/repo-size/iNKORE-Public/Rollup.Plugins?color=6882C4" alt="GitHub Repo Size"></a>
  <a href="#"><img src="https://img.shields.io/github/last-commit/iNKORE-Public/Rollup.Plugins?color=%23638e66" alt="Last Commit"></a>
  <a href="#"><img src="https://img.shields.io/github/issues/iNKORE-Public/Rollup.Plugins?color=f76642" alt="Issues"></a>
  <a href="#"><img src="https://img.shields.io/github/v/release/iNKORE-Public/Rollup.Plugins?color=%4CF4A8B4" alt="Latest Version"></a>
  <a href="#"><img src="https://img.shields.io/github/release-date/iNKORE-Public/Rollup.Plugins?color=%23b0a3e8" alt="Release Date"></a>
  <a href="https://github.com/iNKORE-Public/Rollup.Plugins/commits/"><img src="https://img.shields.io/github/commit-activity/m/iNKORE-Public/Rollup.Plugins" alt="Commit Activity"></a>
  <a href="https://www.nuget.org/packages/iNKORE.Rollup.Plugins"><img src="https://img.shields.io/npm/v/@inkore/rollup-plugins?color=blue&logo=npm" alt="NPM latest version"></a>
  <a href="https://www.nuget.org/packages/iNKORE.Rollup.Plugins"><img src="https://img.shields.io/npm/d18m/@inkore/rollup-plugins?color=blue&logo=npm" alt="NPM download conut"></a>
</p>

<p align="center">
  <a href="https://github.com/iNKORE-Public/Rollup.Plugins/network/members"><img src="https://img.shields.io/github/forks/iNKORE-Public/Rollup.Plugins?style=social" alt="Forks"></a>
  <a href="https://github.com/iNKORE-Public/Rollup.Plugins/stargazers"><img src="https://img.shields.io/github/stars/iNKORE-Public/Rollup.Plugins?style=social" alt="Stars"></a>
  <a href="https://github.com/iNKORE-Public/Rollup.Plugins/watchers"><img src="https://img.shields.io/github/watchers/iNKORE-Public/Rollup.Plugins?style=social" alt="Watches"></a>
  <a href="https://github.com/iNKORE-Public/Rollup.Plugins/discussions"><img src="https://img.shields.io/github/discussions/iNKORE-Public/Rollup.Plugins?style=social" alt="Discussions"></a>
  <a href="https://discord.gg/m6NPNVk4bs"><img src="https://img.shields.io/discord/1092738458805608561?style=social&label=Discord&logo=discord" alt="Discord"></a>
  <a href="https://twitter.com/NotYoojun"><img src="https://img.shields.io/twitter/follow/NotYoojun?style=social&logo=twitter" alt="NotYoojun's Twitter"></a>
</p>

<br>

# ✨ Intergrated

-   [preserve-directives](https://github.com/Ephem/rollup-plugin-preserve-directives): A Rollup plugin to preserve directives like "use client" when preserveModules is true.

-   [plugin-obfuscator](https://github.com/getkey/rollup-plugin-obfuscator):The most powerful rollup plugin for javascript-obfuscator.

-   [plugin-clear](https://github.com/getkey/rollup-plugin-obfuscator): This plugin can help you to clear the specific directories when the rollup bundle your resource.

-   [plugin-exec](https://github.com/kshutkin/rollup-extras/blob/main/plugin-exec): Execute some code when the bundle you are building is finished.

executeScript

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
