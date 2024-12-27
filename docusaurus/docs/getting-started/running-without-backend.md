---
sidebar_position: 6
---

# Running without the Backend

While [running the Dev Initiator](./running-with-backend.md) is easiest way to test [matchmaking](../features/matchmaking.md), [queuing](../features/queuing.md), [sharding](../features/sharding.md), [instanced dungeons](../features/instanced-dungeons.md), and other backend-specific features, it can still be cumbersome for generic multiplayer development.

If you're just adding a new multiplayer ability that doesn't use the backend features and only needs [player data](../features/player-data.md) and/or [world data](../features/world-data.md), this guide covers how configure the Redwood plugins to use a no-backend mode.

## Editor Preferences

You first need to disable the **Use Backend in PIE** setting found in `Editor Preferences > Plugins > Redwood`:

![Disable Use Backend in PIE](/img/redwood-use-backend-in-pie.jpg)

:::note
If you want to keep this setting from resetting each time you restart Unreal, you'll need to press the **Set as Default** button.
:::

This setting tells the plugin to use JSON files in the `YourProject/Saved/Persistence` directory instead of using the backend to store player/world data. All API calls through the plugin are stubbed and will either provide some default response, use the JSON files, or error for being unsupported in that mode.

## Creating a Character

Before you can PIE, you'll need to create a character now that the **Use Backend in PIE** flag has been disabled. Both the register and login calls automatically succeed with any input.

:::note
This mode assumes only one Player Identity. Multiple register calls are only useful if you need to trigger a character auto-create functionality.
:::

Load your title level where players login and create characters in **Play Standalone** Net Mode. Once you're "logged in", create the character like you normally would. You should now see a file at `YourProject/Saved/Persistence/Characters/000.json`.

Don't start matchmaking or queuing; those functions are disabled. Just quit PIE.

:::info
You should create a character for the number of simultaneous clients you're going to test with. The Redwood plugin gets the PIE client index on world login and fetches the associated numerical character index JSON file.
:::

## Running the Game

Now you can change your Net Mode to **Play Client** and start PIE for the multiplayer level you're testing in (i.e. `L_Match`, `L_Overworld`, etc). The respective character, and it's associated data, should be loaded in as if you were running the backend.

:::success
That's it! You're developing with Redwood; you can do most of your development using what you've learned so far.

When you're ready to continue learning more about Redwood, here are some follow up topics:
- **[Learn how to use the Hathora Game Servers in Development](../providers/game-server-hosting/hathora.md#using-hathora-game-servers-in-development)**
- **[Deploying to Kubernetes (locally and to the cloud)](../deploying-to-kubernetes/prerequisites.md)**
- **[Understanding the Redwood architecture](../architecture/overview.md)**
- **[Learning more about the available configuration options](../configuration/overview.md)**
:::