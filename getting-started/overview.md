---
sidebar_position: 1
sidebar_label: Overview
---

# Getting Started

This Getting Started section is your one-stop guide for going from nothing to an Unreal project fully integrated with Redwood: players logging in, creating characters, getting into dedicated servers that the backend starts for them, and having their data saved. It works for a brand new project or one you've been building for years, and for both Blueprint and C++ projects.

If you want to get started with the Redwood backend, you'll first need to [**register for a license**](https://license.redwoodmmo.com/register).

## The Path

Each page builds on the previous one, so we recommend following them in order:

| Step | Page | What you'll do |
| --- | --- | --- |
| 1 | [Getting Access](./getting-access.md) | Create your Redwood account |
| 2 | [Prerequisites](./prerequisites.md) | Install Node.js, Unreal Engine, and C++ tools |
| 3 | [Installing](./installing.md) | Download the plugins and backend, set up your `hosts` file, and create your backend config |
| 4 | [Setting Up Unreal](./setting-up-unreal.md) | Enable the plugins and wire Redwood into your game modes, game state, player state, maps, and Data Assets |
| 5 | [Building the Main Menu](./building-the-main-menu.md) | Connect, log in, choose a realm and character, and join a server |
| 6 | [Running with the Backend](./running-with-backend.md) | Start the backend locally and play through the whole loop |
| 7 | [Saving Player Data](./saving-player-data.md) | Persist your characters' data |
| 8 | [Running without the Backend](./running-without-backend.md) | Iterate on gameplay in PIE without the backend |
| 9 | [Next Steps](./next-steps.md) | Add the features your game needs and get ready to deploy |

## A Few Terms First

You'll see these throughout the docs; the [Architecture](../architecture/overview.md) section explains them in depth.

| Term | What it is |
| --- | --- |
| **Director** | The central service that handles accounts, authentication, and the list of realms. Your game client connects to it first. |
| **Realm** | A self-contained game world with its own characters and game servers. Most games have one; MMOs might have several. |
| **Game profile** | A game mode defined in the backend config (`game.yaml`), with its zones, maps, and rules. Matched to a Game Mode Data Asset in Unreal. |
| **GameServerProxy** | What players think of as a "server" or "lobby": a persistent record of a game session that can be started and stopped. |
| **Zone** and **shard** | A proxy's world can be split into zones (each its own Unreal server), and busy zones can be split into shards (copies of the zone). A simple match has one zone and one shard. |
| **Sidecar** | A small Node.js service that runs next to every Unreal server and relays everything between it and the realm. |
| **Config environment** | A folder of YAML files that overrides the backend's default configuration for your game (and for each environment, like local development or production). |
| **Dev Initiator** | A single process that runs the entire backend on your machine for development. |

## Where Things Are Documented

Once you've finished Getting Started, these sections are your reference:

- **[Deploying to Kubernetes](../deploying-to-kubernetes/prerequisites.md)**: packaging your game and running Redwood locally in Kubernetes or in the cloud
- **[Features](../features/index.md)**: how each feature works and how to use it, from authentication to guilds to instanced dungeons
- **[Unreal Plugin Reference](../unreal-reference/overview.md)**: every class, component, function, event, Blueprint node, setting, and type in the Unreal plugins
- **[Configuration](../configuration/overview.md)**: how the backend config system works, plus the **[Config Reference](../configuration/reference/index.md)** with every variable, its default, and what it does
- **[Architecture](../architecture/overview.md)**: how the services fit together
- **[Troubleshooting](../support/troubleshooting.md)**: common problems and their fixes

:::tip
These docs are also shipped with the backend, so you (or an AI coding assistant) can read them offline alongside the code.
:::
