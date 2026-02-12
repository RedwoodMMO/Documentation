---
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Prerequisites

These are the minimum prerequisites to run Redwood locally. There are more when you are ready to deploy to a Kubernetes cluster either locally or to the cloud, but we recommend starting with these to support a faster development cycle.

## NodeJS

NodeJS is used for the entire backend infrastructure as well as the deployment scripts. It's required when deploying to a Kubernetes cluster, locally or remotely.

### Installing Node

:::warning
We require NodeJS `v20`; note that other versions are not currently compatible with Redwood.
:::

While you can install NodeJS v20 using the official installer from https://nodejs.org, we prefer to use NVM (Node Version Manager). Both will work just fine; NVM just makes it easy to switch and upgrade your version of NodeJS. If you want to install using NVM but already have NodeJS installed using the official installer from https://nodejs.org, you will need to uninstall it before using NVM.

- NVM for Windows: https://github.com/coreybutler/nvm-windows/releases/latest and download/install `nvm-setup.exe`
- NVM for Mac/Linux: https://github.com/nvm-sh/nvm#install--update-script

Once you have NVM installed, you can run the following command to install NodeJS `v20`:

<Tabs>
    <TabItem value="Windows" label="Windows">
        ```bash
        nvm install 20
        nvm use 20
        ```
    </TabItem>
    <TabItem value="Mac/Linux" label="Mac/Linux">
        ```bash
        nvm install 20
        ```
    </TabItem>
</Tabs>

Then make sure you can use the `node` executable:

```bash
node --version
```

### Installing Yarn

Once you have installed NodeJS, you need to install yarn, which is used to install dependencies and run scripts for the backend. We use version 4.10.3+, which you can download by running the following command in the `RedwoodBackend` directory:

```bash
corepack enable
```

Then make sure you can use the `yarn` executable:

```bash
yarn --version
4.10.3
```

## Unreal Engine

You'll need Unreal Engine to use Redwood. If you already compile Unreal from source, use that. If you don't, **you can start with the [Epic Games Launcher installed build](https://www.unrealengine.com/download)**. Eventually you'll need to compile Unreal from source when you [deploy to Kubernetes](../deploying-to-kubernetes/prerequisites.md#compile-unreal-from-source).

## C++ Compilation tools

You'll need software to compile C++ since our plugins are written in C++. Depending on your development OS, you have different options:

- Windows: [Visual Studio](https://dev.epicgames.com/documentation/unreal-engine/setting-up-visual-studio-development-environment-for-cplusplus-projects-in-unreal-engine), [Rider](https://www.jetbrains.com/lp/rider-unreal/), **or** [VS Code](https://dev.epicgames.com/documentation/unreal-engine/setting-up-visual-studio-code-for-unreal-engine)
- MacOS: [Xcode](https://dev.epicgames.com/documentation/unreal-engine/using-xcode-with-unreal-engine)
- Linux: [Rider](https://www.jetbrains.com/lp/rider-unreal/), **or** [VS Code](https://dev.epicgames.com/documentation/unreal-engine/setting-up-visual-studio-code-for-unreal-engine)

:::success
That's all of the current perquisites for now! You can now **[Install Redwood](./installing.md)**.
:::