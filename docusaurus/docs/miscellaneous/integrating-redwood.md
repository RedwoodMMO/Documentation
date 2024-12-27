---
sidebar_position: 1
---

# Integrating with an Existing Project

:::info
Do you want **Redwood's Lead Developer** to work closely with your team and project to ensure proper integration? You may be interested in **Premium Support**. [Send us an email](mailto:redwood@incanta.games) to schedule a call to go over the details of Premium Support and get you set up.
:::

While this section will cover everything you need to know to get a basic integration with Redwood for your existing project, if you're looking for some more reference, we recommend setting up the TODO gameplay templates to reference their integration.

## Copy and Convert your Project

Make a new clone/copy of your existing project to prevent any data loss if you run into any issues integrating with Redwood.

With the new copy, you'll need to switch it to use the Redwood Evaluation version. The easiest method to do this is to Right Click on the `.uproject` file, and under **Show more options**, click **Switch Unreal Engine version...**

![Switch Unreal Engine Version - Show more options](/img/switch-engine-1.jpg)

![Switch Unreal Engine Version - Switch Unreal Engine Version](/img/switch-engine-2.jpg)

If you [registered the installed build during installation](../getting-started/installing.md#registering-the-installed-version), you should see an option for **Binary build at 'path to where you installed Redwood'**. Select that and press **OK**.

![Switch Unreal Engine Version - Select binary build RedwoodInstalled](/img/switch-engine-3.jpg)

## Add Client and Server Build Targets

The Redwood Gameplay Templates come with the correct build targets, but your existing game may not have the required `Client` and `Server` `.Target.cs` files. The **Blank** template is a great reference, but here is how you can set these up quickly.

1. If you have a Blueprint-only project, you need to convert it to a C++ one

    :::note
    Converting to a C++ project doesn't mean you can't use Blueprints or must use C++.

    Doing the conversion is as simple as creating an empty C++ class. We have a set of instructions on our [marketplace plugin wiki](https://wiki.incanta.games/en/plugins/install-as-project-plugin#convert-your-project-to-a-c-and-blueprint-project) on how to do this. You only need to follow the steps until you reach "Great, you now have a C++ [and Blueprint] Project!" and come back here.
    :::

1. Under the `Source` directory, look at each of your `.Target.cs` files. If none of them have `Type = TargetType.Client;` and/or `Type = TargetType.Server;`, continue on; otherwise you should already be set!

1. Find the `.Target.cs` file that has `Type = TargetType.Game;`; it probably just has the name of your project

1. Make two copies of this file and rename the copies to `<prevname>Client.Target.cs` and `<prevname>Server.Target.cs`

    ![Client and Server targets](/img/client-server-targets.jpg)

1. In the `Client` one, change the `class` name to have `Client` preceding target (e.g. `RedwoodEvalProjectClientTarget`). you'll need to do this next to `public class` and `public`

1. Change the `Type` to `Type = TargetType.Client;`

1. Repeat the last 2 steps for the `Server` target using `Server` instead of `Client`

Here are examples from a project created with the **Blank** template, but your files will be different.

`RedwoodEvalProjectClient.Target.cs`:
```csharp
// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;
using System.Collections.Generic;

public class RedwoodEvalProjectClientTarget : TargetRules
{
	public RedwoodEvalProjectClientTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Client;
		DefaultBuildSettings = BuildSettingsVersion.V4;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_3;
		ExtraModuleNames.Add("RedwoodEvalProject");
	}
}
```

`RedwoodEvalProjectServer.Target.cs`:
```csharp
// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;
using System.Collections.Generic;

public class RedwoodEvalProjectServerTarget : TargetRules
{
	public RedwoodEvalProjectServerTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Server;
		DefaultBuildSettings = BuildSettingsVersion.V4;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_3;
		ExtraModuleNames.Add("RedwoodEvalProject");
	}
}
```

## Enable the Plugin

First, you will enable the `Redwood` Unreal plugin for your project. You can do this by going to **Edit** > **Plugins**.

![Project Plugins](/img/project-plugins.jpg)

Then in the search box type `Redwood` and enable the checkbox next to `Redwood MMO Framework` by `Incanta Games`:

![Enabling Redwood Plugin](/img/redwood-plugin.jpg)

:::note
You'll need to restart the editor to ensure the plugin is loaded properly.
:::

## Add the Redwood Module

If you'll be using Redwood with C++ classes, you'll need to add the `"Redwood"` module to the `PublicDependencyModuleNames` variable in your `.Build.cs` file. You can see an example of this in the generated `Source/<ProjectName>/<ProjectName>.Build.cs` file from the **Blank** template.

## Integrate the Redwood Classes

Next, you'll need to ensure some classes provided by the Redwood plugin are properly integrated. While the source files are not included in the Evaluation version, you can still see the headers in the plugin folder at `<RedwoodInstallDirectory>/Engine/Plugins/Redwood/Source/Redwood/Public`. You can integrate these with C++ or Blueprint.

| Redwood Class                                | Integration Point                                                                                                                           | Function                                                                                                                                                                                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ARedwoodTitlePlayerController`              | The Player Controller class you use for the main menu/title screen should inherit from this class (directly or indirectly).                 | This class provides the implementation details for interfacing with the Director and Realm Frontend services and handling the asynchronous callbacks.                                                                                                                                            |
| `ARedwoodTitleGameModeBase`                  | This class can be used as the Game Mode class directly if you don't extend `ARedwoodTitlePlayerController`.                                 | All this class does is define the Player Controller class to `ARedwoodTitlePlayerController`. It's for ease of use in simpler setups, but it's not required to use.                                                                                                                              |
| `ARedwoodGameMode` or `ARedwoodGameModeBase` | Your Game Mode class for the game session should inherit from one of these classes (directly or indirectly).                                | These class handle player joining and fetch the associated character data if the player is authorized. `ARedwoodGameMode` inherits from `AGameMode`, which is designed for ephemeral matches. Everything else (i.e. persistent games like RPGs and sandboxes) should use `ARedwoodGameModeBase`. |
| `URedwoodGameSubsystem`                      | No integration necessary. This subsystem is automatically instantiated on the dedicated server when the `Redwood` Unreal plugin is enabled. | This subsystem handles the lifecycle of the Unreal process for a dedicated server. Primarily, it enables the backend to tell the server to load a new map/mode after a match has been allocated to it.                                                                                           |

## Integrate the Main Menu

There is quite a bit of integration you'll need to do in the main menu to properly onboard players. The best reference for this is to follow the `/Content/UI/W_MainMenu` widget in the [**Blank** template](../getting-started/running-with-backend.md) which outlines the entire onboarding process.

## Integrate the Match

You'll need to [configure the Game Modes and Maps](../configuration/game-modes-and-maps.md) you'd like Redwood to know about.

## Packaging

<!-- TODO -->

Sorry for the inconvenience! We haven't gotten here yet, [reach out](../support/how-to-get-support.md) if this is blocking you and we'll prioritize it!
