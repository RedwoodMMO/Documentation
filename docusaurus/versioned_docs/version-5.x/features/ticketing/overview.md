---
sidebar_position: 1
sidebar_label: Overview
---

# Ticketing System

Ticketing is the term Redwood uses for how players get into a server: the client asks to join, the backend creates a "ticket", and once there's a server (and room) for the player, they're sent there. The Ticketing System can be configured with several options:

- Matchmaking
  - [**Simple Match**](./matchmaking/simple-match.md) - A dead-simple matchmaker used in development without Kubernetes; shares its config with Open Match
  - [**Open Match**](./matchmaking/open-match.md) - An open-source, flexible, and scalable matchmaker
- [**Queuing**](./queuing.md) - This is used for persistent/lobby-based systems where players already know what server they want to join, but it may be full (i.e. MMORPGs). This provider implements a FIFO (First-In-First-Out) queue system.
- [**Custom Flow**](./custom.md) - This enables you to program a custom ticketing flow for more advanced setups.

:::warning
The Idem matchmaking provider is no longer supported as they sunset their service.
:::

Ticketing runs in its own services per realm: a **ticketing director** that schedules work and one or more **ticketing workers** (`ticketing.replicas`) that process tickets. See the [Architecture](../../architecture/overview.md) page for how these fit together.

:::note
Not every way of joining a server uses ticketing. Joining a specific lobby with **Join Proxy with Single Instance** (or creating one with **Create Proxy**) skips ticketing entirely; see [Building the Main Menu](../../getting-started/building-the-main-menu.md#5-join-a-server) for all of the options.
:::

## How to specify which provider is used?

It's possible for you to run one of the matchmaking providers along with queuing. `ticketing.queue.enabled` and `ticketing.matchmaking.enabled` (both `true` by default) decide whether or not either runs. An example of needing both is an open world MMORPG that has instanced dungeons; the overworld would use the queue provider while the instanced dungeons would use matchmaking.

These variables live in each realm's [Realm Instance Config](../../configuration/realm-instance-config.md) (the defaults are in `config/node/default/realm/instances/redwoodBase.yaml`). You can configure which matchmaking provider is used with `ticketing.matchmaking.provider`, which can be `simple-match` (the default) or `open-match`. For example, in `config/node/your-game/realm/instances/default.yaml`:

```yaml
ticketing:
  matchmaking:
    provider: "open-match"
```

Our `kubernetes` [inheritable config environment](../../configuration/overview.md#config-environment-inheritance) sets this to `open-match` for the `default` realm for you (in `config/node/kubernetes/realm/instances/default.yaml`). If you add more realms, set it yourself for each of them.

See the [realm config reference](../../configuration/reference/realm.md) for every ticketing variable.

## Which should I use in production?

If you need to match players by region, skill, class, type of game mode, etc., use Open Match. If the player is choosing a specific world/server to join that may reach capacity, and you want to have a wait list, use Queue.

You may also need to implement your own ticketing provider for your specific game; if you have Dedicated Support, [reach out](../../support/how-to-get-support.md) and we'll help discuss your options!

## Unreal

| Ticketing type | Blueprint node | C++ |
| --- | --- | --- |
| Matchmaking | **Join Matchmaking** | `URedwoodClientGameSubsystem::JoinMatchmaking(ProfileId, Regions, OnUpdate)` |
| Queuing | **Join Queue** | `URedwoodClientGameSubsystem::JoinQueue(ProxyId, ZoneName, bTransferWholeParty, OnUpdate)` |
| Custom flow | **Join Custom** | `URedwoodClientGameSubsystem::JoinCustom(bTransferWholeParty, Regions, OnUpdate)` |
| Cancel any of the above | **Leave Ticketing** | `URedwoodClientGameSubsystem::LeaveTicketing(OnOutput)` |

All of them require a [selected character](../../getting-started/building-the-main-menu.md#4-pick-or-create-a-character) and a realm connection, and they report progress through an `FRedwoodTicketingUpdate`:

| `Type` | Meaning |
| --- | --- |
| `JoinResponse` | The backend's answer to the join request. An empty `Message` means the ticket was created; a non-empty `Message` is the reason it was rejected. |
| `Update` | A status message while waiting |
| `TicketError` | The ticket failed (e.g. it went stale); `Message` says why |

When the backend assigns a server, the client travels there automatically (or fires `OnRequestToJoinServer` if **Auto Connect to Servers** is off). A player can only have one active ticket at a time; starting a new join replaces the previous request's update callback.

Matchmaking and custom flows wait until the client has measured its ping to every region before sending the request.

:::caution Known issue (5.0.0)
If any region never responds to pings, **Join Matchmaking** and **Join Custom** keep waiting (retrying every 2 seconds) and never send the request. Also, ping values (from **Get Regions** and sent to the matchmaker) are in **seconds**, not milliseconds.
:::

:::caution Known issue (5.0.0)
**Join Queue** doesn't check for a realm connection first, and crashes if it's called before **Initialize Realm Connection** has finished.
:::

## Common Configuration

The only common config variable for all ticketing providers is how often ticketing is processed: `ticketing.process-interval` specifies the number of milliseconds to wait between processing tickets. It defaults to `5000` (5 seconds). Lowering it makes matches and queues respond faster at the cost of more backend work.
