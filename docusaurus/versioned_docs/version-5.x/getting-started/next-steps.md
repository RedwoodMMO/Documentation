---
sidebar_position: 10
---

# Next Steps

You've got the core loop working: players log in, pick a character, get into a server the backend started, and their data is saved. From here, add what your game needs. This page is a map of what's available and where to start.

## Getting Players Together

| Feature | What it gives you |
| --- | --- |
| [Parties](../features/social/parties.md) | Groups of players that matchmake, queue, and travel together |
| [Friends](../features/social/friends.md) | Friend lists, requests, blocking, and seeing what friends are playing |
| [Realm Contacts](../features/social/realm-contacts.md) | Per-character contact lists within a realm |
| [Guilds and Alliances](../features/social/guilds-alliances.md) | Player-run organizations, with tags shown next to names |
| [Text Chat](../features/social/text-chat.md) | Realm, guild, server, and private chat |
| [Ticketing](../features/ticketing/overview.md) | Tuning [matchmaking](../features/ticketing/matchmaking/simple-match.md), [queuing](../features/ticketing/queuing.md), or writing [your own flow](../features/ticketing/custom.md) |

## Building Bigger Worlds

| Feature | What it gives you |
| --- | --- |
| [Zones](../features/game-servers/zones.md) | Split a world across multiple servers and move players between them |
| [Sharding](../features/game-servers/sharding.md) | Automatically add copies of busy zones |
| [Instanced Dungeons](../features/instanced-dungeons.md) | Private instances players enter from a persistent world |
| [Sync Items](../features/sync-items.md) | Actors whose state is shared between servers and optionally saved |
| [World Data](../features/data/game/world-data.md) and [Zone Data](../features/data/game/zone-data.md) | Saved state for a whole world or one zone |
| [Interactables](../features/interactables.md) | A pattern for things players interact with, without RPCs scattered everywhere |
| [Realms](../features/realms.md) | Multiple realms, maintenance windows, and a default proxy |

## Accounts

| Feature | What it gives you |
| --- | --- |
| [Authentication](../features/authentication/overview.md) | Steam, Epic, Discord, Twitch, JWT, and username/email accounts |
| [Transactional Email](../features/transactional-email/overview.md) | Email verification for email accounts |

## Before You Ship

When you're ready to test in a production-like environment:

1. **[Package your game](../deploying-to-kubernetes/packaging.md)**, including a Linux dedicated server.
1. **[Deploy to a local Kubernetes cluster](../deploying-to-kubernetes/deploying-locally.md)** to test the real deployment on your machine.
1. **[Deploy to the cloud](../deploying-to-kubernetes/deploying-remotely.md)**.
1. Move passwords and API keys into a **[secrets provider](../features/secrets/overview.md)**, and replace every placeholder secret from the default config (production deployments refuse to deploy while any are left).
1. Set **Director Uri** (or a [`redwood.json`](../unreal-reference/settings.md)) for each environment your builds connect to.

Along the way, the **[Config Reference](../configuration/reference/index.md)** lists every backend setting, the **[Unreal Plugin Reference](../unreal-reference/overview.md)** lists every class and function, and **[Troubleshooting](../support/troubleshooting.md)** covers common problems. If you get stuck, [reach out](../support/how-to-get-support.md)!
