---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Prerequisites

These are the minimum prerequisites to develop with Redwood locally. There are more when you're ready to [deploy to a Kubernetes cluster](../deploying-to-kubernetes/prerequisites.md) (locally or in the cloud), but we recommend starting with just these to keep your development loop fast.

## Node.js

Node.js runs the entire backend, the [CLI](../features/cli.md), and the deployment scripts. You need it even if you have a Standard License and run the precompiled Dev Initiator: the Dev Initiator uses Node.js tooling (`npx` and Prisma) to create your local databases, and the CLI runs through Yarn.

### Installing Node

:::warning
Redwood 5.x requires Node.js **v24**. Other major versions aren't supported. (Redwood 4.x used Node.js v20; if you're upgrading, make sure you switch.)
:::

While you can install Node.js v24 using the official installer from https://nodejs.org, we prefer to use NVM (Node Version Manager). Both work just fine; NVM just makes it easy to switch and upgrade your version of Node.js. If you want to use NVM but already have Node.js installed with the official installer, uninstall it first.

- NVM for Windows: https://github.com/coreybutler/nvm-windows/releases/latest and download/install `nvm-setup.exe`
- NVM for Mac/Linux: https://github.com/nvm-sh/nvm#install--update-script

Once you have NVM installed, install Node.js `v24`:

<Tabs>
    <TabItem value="Windows" label="Windows">
        ```bash
        nvm install 24
        nvm use 24
        ```
    </TabItem>
    <TabItem value="Mac/Linux" label="Mac/Linux">
        ```bash
        nvm install 24
        ```

        The backend includes an `.nvmrc` file, so running `nvm use` in the `RedwoodBackend` folder will also pick the right version.
    </TabItem>
</Tabs>

Then make sure you can use the `node` executable:

```bash
node --version
# v24.x.x
```

### Yarn

The backend uses Yarn 4, which is installed through [Corepack](https://nodejs.org/api/corepack.html) (a tool that ships with Node.js). You'll enable it during [installation](./installing.md#backend-dependencies); you don't need to install Yarn separately.

## Unreal Engine

Redwood supports **Unreal Engine 5.4 and newer**. If you already compile Unreal from source, use that. If you don't, **you can start with the [Epic Games Launcher installed build](https://www.unrealengine.com/download)**. You'll eventually need a source build to package Linux dedicated servers when you [deploy to Kubernetes](../deploying-to-kubernetes/prerequisites.md#compile-unreal-from-source), but that can wait.

Your project needs to be a **C++ project** (it can still be almost entirely Blueprints). The Redwood plugins are C++ plugins, and dedicated servers require a C++ project with a Server target. If your project is Blueprint-only, add any C++ class via **Tools > New C++ Class...** to convert it.

## C++ Compilation tools

You'll need software to compile C++ since our plugins are written in C++. Depending on your development OS, you have different options:

- Windows: [Visual Studio](https://dev.epicgames.com/documentation/unreal-engine/setting-up-visual-studio-development-environment-for-cplusplus-projects-in-unreal-engine), [Rider](https://www.jetbrains.com/lp/rider-unreal/), **or** [VS Code](https://dev.epicgames.com/documentation/unreal-engine/setting-up-visual-studio-code-for-unreal-engine)
- MacOS: [Xcode](https://dev.epicgames.com/documentation/unreal-engine/using-xcode-with-unreal-engine)
- Linux: [Rider](https://www.jetbrains.com/lp/rider-unreal/), **or** [VS Code](https://dev.epicgames.com/documentation/unreal-engine/setting-up-visual-studio-code-for-unreal-engine)

:::success
That's all of the prerequisites for now! You can now **[Install Redwood](./installing.md)**.
:::
