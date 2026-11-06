---
sidebar_position: 3
---

# Packaging

At a minimum, we need a dedicated server to deploy along with the backend. We technically can test Playing in Editor (PIE) as `Standalone` mode to test as a client with the actual dedicated server, but we're going to package the client build as well for this guide.

:::note
This guide shows you how to package both client and dedicated server builds from within the Unreal Editor; you can automate this task with scripts, but that is not covered here.
:::

## Packaging Settings

If you integrated Redwood into an existing project, you need to make sure you have your packaging settings properly configured. **Redwood Gameplay Templates come preconfigured**, but it's helpful for you to be aware of this section before you customize the template further.

### Default Maps

When you package for a dedicated server, you almost always need to have a different default map for the game than the client.

1. Open up the **Project Settings** (**Edit** > **Project Settings**)
1. Under the **Project** section, goto **Maps & Modes**
1. You'll see a section called **Default Maps**; expand the **Advanced** subsection:

    ![Maps & Modes section showing the advanced subsection](/img/packaging-maps-modes-default.jpg)

1. Now you can see both the **Game Default Map** and the **Server Default Map**. The former is used for the client builds and the later is used for the dedicated server builds.

    :::note
    We normally set the client map to a splash screen level or straight to the title screen, as seen in the **Blank** template.

    We normally set the server map to an empty level with the default game mode. This ensures our match level doesn't get loaded until it starts, which reduces wasted RAM and CPU usage in the case of keeping warm servers (aka servers that have no players but are ready to start a match quickly if a set of players appear). Redwood **automatically** loads the correct map and game mode when a match gets allocated.
    :::

    ![Maps & Modes section showing the default maps](/img/packaging-maps-modes-advanced.jpg)

### Packaging Maps

You need to make sure that all the maps you need are packaged. By default, Unreal will package all the maps and any assets that get loaded from loading each map. This is **excessive** and increase your package size by including assets you never use in the project. This is particularly noticed if you use any asset packs from the marketplace that include demo/showcase maps listing each asset. **Which is why we always specifically call out the maps we want to package.**

1. From the **Project Settings** tab, select **Package** under **Project**. Then be sure to expand **Advanced** under the **Packaging** section.

    ![Open the Packaging menu](/img/packaging-open-packaging.jpg)

1. Scroll down until you see **List of maps to include in a packaged build**. This is normally empty, which means to include all maps. If it's non-empty, only those maps will be included.

    ![List of maps to include in a packaged build](/img/packaging-maps-to-package.jpg)

1. Add each of your maps that your game uses. At a minimum, you **must** include the [default maps](#default-maps) you set, but you likely need to also include any maps used in the match. In the above picture, you'll see we included the `L_Match` map that actually gets loaded in the **Blank** template to host the map.

:::info
If you ever get more advanced and use scripting to package instead of packaging through the Editor, these `Packaging` settings are ignored. You must manually specify these.

Also note that the client build needs to include all maps, but the server build could technically omit the client-only builds (e.g. `L_Title` in the case of the **Blank** template). We don't normally make this distinction in our own build scripts as it usually doesn't impact build size greatly but can sometimes cause missing maps in one of the builds.
:::

## Client Build

Now that we have our package settings properly configured, we will start with packaging the Windows Client build.

1. Navigate to the currently open level tab
1. Click on **Platforms** in the toolbar, navigate under the **Windows** menu
1. Make sure that the **Build Target** has your `Client` build selected (Usually has `Client` at the end); you can have anything selected for the **Binary Configuration**

    :::info
    We don't want to use the default `Game` target here. `Game` includes both client and server code. Only use `Game` if you plan to support **Listen Servers**.

    **Pro tip:** When selecting a **Build Target** or **Binary Configuration**, click on the bubble/ball on the left instead of the name/row. This will prevent the menu from closing.
    :::

1. Click on **Package Project**; you can pick any directory you prefer for now

    ![Packaging the Windows Client](/img/packaging-windows-client.jpg)

## Dedicated Server Build

### Setting up the Linux Toolchain

When building the dedicated server build, we actually want to target the Linux OS. Linux servers are cheaper in hosting providers so we need to make sure that we can cross-compile for Linux (which means to compile for Linux on a Windows system).

1. Navigate to the [Unreal documentation](https://dev.epicgames.com/documentation/unreal-engine/linux-development-requirements-for-unreal-engine) and find the link for the **Cross-Compile Toolchain** for your UE version

    :::note
    You **do not** want the Native Toolchain unless you're building for Linux on a Linux machine.
    :::

1. Run the executable once it has finished downloading
1. Click **Next**

    ![Linux toolchain installer first page](/img/linux-toolchain-1.jpg)

1. You can change where the toolchain is installed, but we normally use the default; click **Install** when you're ready

    ![Linux toolchain installer - run install](/img/linux-toolchain-2.jpg)

1. Click **Close** once the installer finishes

    ![Linux toolchain installer finished](/img/linux-toolchain-3.jpg)

1. Add the `LINUX_MULTIARCH_ROOT` environment variable that points to the path that you installed the toolchain at

    1. Open the **Start** menu and search for `Edit the system environment variables`

        ![Environment variable how to - 1](/img/environment-var-1.jpg)

    1. Click on the **Environment Variables...** button

        ![Environment variable how to - 2](/img/environment-var-2.jpg)

    1. Click on either the **User** or **System** environment variables **New...** button; either should work

        :::info
        The installer may have already set this under the **System variables**, so double check before adding it.
        :::

        ![Environment variable how to - 3](/img/environment-var-3.jpg)

    1. Add the new `LINUX_MULTIARCH_ROOT` variable with the install path as the value

        ![Environment variable how to - 4](/img/environment-var-4.jpg)

    1. Click the **OK** button on the new system variable window
    1. Click the **OK** button on the **Environment Variables** list window
    1. Click the **OK** button on the **System Properties** window
    1. You will need to restart the Unreal Editor; if you opened it from an IDE, you may need to restart that too for it to take effect

        :::note
        Still having issues with your environment variable? You can log out and log back into Windows to fully take effect.
        :::

1. Under the **Platforms** menu in the toolbar, open the **Linux** submenu

1. To verify you have installed the toolchain and set up the environment variable properly, check under the **SDK MANAGEMENT** section to see if the correct/matching SDK version is listed as **Installed** either under the SDK or Auto SDK:

    ![Verifying the Linux toolchain is set up](/img/linux-toolchain-4.jpg)

### Executing the Build

The steps here are identical to [packaging the client build](#client-build) except you're choosing **Linux** and the `Server` target:

![Packaging the Linux server build](/img/packaging-linux-server.jpg)

:::success
Now that you have a packaged server, you can **[deploy](./deploying-locally.md)** to a local or remote Kubernetes cluster!
:::