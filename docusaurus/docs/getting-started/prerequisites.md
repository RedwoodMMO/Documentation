---
sidebar_position: 3
---

# Prerequisites

These are the minimum prerequisites to run Redwood locally. There are more when you are ready to deploy to a Kubernetes cluster either locally or to the cloud, but we recommend starting with these to support a faster development cycle.

## Unreal Engine

You'll need Unreal Engine to use Redwood. If you already compile Unreal from source you can use that, but **for most developers we recommend starting with the [Epic Games Launcher installed build](https://www.unrealengine.com/download)**.

## C++ Compilation tools

You'll need software to compile C++ since our plugins are written in C++. Depending on your development OS, you have different options:

- Windows: [Visual Studio](https://dev.epicgames.com/documentation/unreal-engine/setting-up-visual-studio-development-environment-for-cplusplus-projects-in-unreal-engine), [Rider](https://www.jetbrains.com/lp/rider-unreal/), **or** [VS Code](https://dev.epicgames.com/documentation/unreal-engine/setting-up-visual-studio-code-for-unreal-engine)
- MacOS: [Xcode](https://dev.epicgames.com/documentation/unreal-engine/using-xcode-with-unreal-engine)
- Linux: [Rider](https://www.jetbrains.com/lp/rider-unreal/), **or** [VS Code](https://dev.epicgames.com/documentation/unreal-engine/setting-up-visual-studio-code-for-unreal-engine)

:::success
That's all of the current perquisites for now! You can now **[Install Redwood](./installing.md)**.
:::