---
sidebar_position: 5
---

# Text Chat

Redwood includes a self-hosted Text Chat server and easy-to-use client SDK calls. Redwood automatically deploys and configures an [ejabberd](https://www.ejabberd.im/) server. Ejabberd is a free and open source XMPP server. The `RedwoodChat` plugin includes a forked version of Unreal's `XMPP` module (`RedwoodXMPP`) and wraps it with some helper functions for easier integration.

The `RedwoodChat` plugin maintains two XMPP chat connections for the user, one for the `PlayerIdentity` and one for the `PlayerCharacter`. These have separate XMPP user accounts with the associated `id` as the username and the same XMPP password (`PlayerIdentity.xmppPassword`, stored in the Director database). The accounts are created for you: the player's account the first time they log in while text chat is enabled, and the character's account when the character is created.

:::warning
Characters created **before** text chat was enabled don't have an XMPP account, so chat can't connect for them. Enable text chat from the start (or wipe your development database) to avoid this.
:::

:::warning
Redwood does not automatically connect to rooms for you. Redwood just makes sure players/characters have access to rooms based on their connection. Rooms are marked as private and members-only, which ensures players can't connect to a room just because they know its ID. It's up to you to call the [`JoinRoom` function](#joining-rooms) accordingly.
:::

## Configuration

Text chat is configured with the `chat.text` config object (see `config/node/default/chat/text.yaml` and the [chat config reference](../../configuration/reference/chat-and-email.md) for every variable). The most important ones:

| Variable | Default | Description |
| --- | --- | --- |
| `chat.text.enabled` | `false` (`true` in the `kubernetes` and `simple-chat` environments) | Whether text chat is enabled |
| `chat.text.host` | `chat.localhost` | The chat server's hostname, which is also the XMPP domain. The client's **XMPP Server Uri** setting must be exactly the same. |
| `chat.text.room-types.<type>.enabled` | see [Room Types](#room-types) | Enable or disable each [room type](#room-types) |
| `chat.text.max-offline-messages` | `500` | How many direct messages to keep per user while they're offline |
| `chat.text.max-users-per-room` | `1000` | The maximum number of users in a room |
| `chat.text.connection.xmpp.external.port` | `30222` (`5222` in `simple-chat`) | The port the chat server listens on for clients |

## Setup

1. Enable the `RedwoodChat` plugin in your project (via `Edit > Plugins` or your `.uproject`)
1. If you're using it from C++, add **both** the `RedwoodChat` and `RedwoodXMPP` modules (and `Redwood`) to your `*.Build.cs`
1. In **Project Settings > Plugins > Redwood Chat**, set **XMPP Server Uri** to your chat server's host. It defaults to `chat.localhost`, which works for local development. For deployed environments, set it to the same value as `chat.text.host` (you can also override it per build with an `xmppServerUri` field in the same `redwood.json` file used for the [Director Uri](../../getting-started/setting-up-unreal.md#project-settings)).
1. Turn on text chat in the backend (see [Deploying with the Dev Initiator](#deploying-with-the-dev-initiator) or [Deploying with Kubernetes](#deploying-with-kubernetes))

:::caution Known issue (5.0.0)
The Unreal client always connects to the chat server on port `5222`, but the `kubernetes` environment exposes the chat server on port `30222` by default. When deploying to Kubernetes, either expose the chat server on `5222` (e.g. with a load balancer or port mapping) or set `chat.text.connection.xmpp.external.port` to `5222` if your cluster allows it.
:::

:::warning
Text chat isn't encrypted by default. You can require STARTTLS on the server with `chat.text.connection.xmpp.external.starttls.enabled` (and verify certificates with `starttls.verify-certificates`), but the full TLS integration with the client hasn't been verified yet. You can follow the [GitHub issue tracking this feature](https://github.com/RedwoodMMO/Roadmap/issues/104) on the [roadmap](https://github.com/orgs/RedwoodMMO/projects/1/views/1).
:::

:::note
`RedwoodXMPP` reads the same `[XMPP] bEnabled` setting in `Engine.ini` as Unreal's built-in `XMPP` module. If your project sets `bEnabled=false` there to turn off Epic's XMPP module, it also turns off Redwood chat.
:::

## Connecting

Call **Initialize Chat Connection** (`URedwoodClientChatSubsystem::InitializeChatConnection`) once per game session after the player has:

1. Logged in to the Director
1. Connected to a realm
1. Selected a character with **Set Selected Character**

It fetches the player's XMPP credentials from the Director and logs in both XMPP connections. An empty `Error` means success. It's one-shot: calling it again returns `Already initialized.`, and there's currently no way to switch to a different character's chat connection without restarting the game. Check the connection at any time with **Is Connected** (`IsConnected`).

:::caution Known issue (5.0.0)
**Initialize Chat Connection** doesn't currently report success: after both connections log in, its output never fires and the receive events (`OnRoomChatReceived` and the private chat events) aren't bound. Sending may still work (**Is Connected** becomes `true`), but receiving messages doesn't. This needs a plugin fix before text chat is usable.
:::

## Room Types

Redwood supports these types of chat rooms; players are automatically authorized to a particular room via the backend when applicable:

| Room Type | XMPP Connection | Enabled by default | Description |
| - | - | - | - |
| `Guild` | `PlayerCharacter` if `game.guilds.scoped-to-realm` is `true`, otherwise `PlayerIdentity` | Yes | Room for an entire [guild](./guilds-alliances.md) regardless of their server connection |
| `Party` | `PlayerCharacter` | Yes | Room for an entire [party](./parties.md) regardless of their server connection (see the known issue below) |
| `Realm` | `PlayerCharacter` | Yes | Room for all characters connected to any game server in a particular Realm |
| `Proxy` | `PlayerCharacter` | Yes | Room for all characters connected to a game server in a particular GameServerProxy |
| `Shard` | `PlayerCharacter` | Yes | Room for all characters connected to a specific game server |
| `Nearby` | `PlayerCharacter` | (uses `Shard`) | Abstract room type that shows messages sent by nearby characters in your same shard; messages are sent in the shard room, but `Shard` rooms don't show `Nearby` messages and vice versa to the client |
| `Custom` | Depends on the `bJoinAsCharacter` arg passed to `JoinCustomRoom` | No | [Rooms created by users](#custom-rooms) |
| `Direct` | Depends on whether you call `SendMessageToPlayer` or `SendMessageToCharacter` | (always) | Direct messages between 2 players regardless of their server connection |

:::warning
The `Team` room type that exists in the `ERedwoodChatRoomType` enum is currently not supported, but will be supported in the future.
:::

:::caution Known issue (5.0.0)
`Party` rooms are never created or authorized by the backend, so party chat doesn't work yet. `Realm` rooms are created with the realm's name but players are authorized with the realm's ID, so joining a realm room is also expected to fail.
:::

## Joining Rooms

Clients must join a room with **Join Room** (`JoinRoom(Type, Id)`) before they can send or receive messages in it. The `Id` depends on the room type:

| Room Type | `Id` to pass | Where to get it on the client |
| --- | --- | --- |
| `Guild` | The guild's ID | `FRedwoodGuild::Id` from **List Guilds**, **Get Guild**, or **Get Selected Guild** |
| `Proxy` | The GameServerProxy's ID | `GetServerDetails().ProxyId` on the [Redwood Game State Component](../../getting-started/setting-up-unreal.md#game-state) |
| `Shard` | The game server instance's ID | `GetServerDetails().InstanceId` on the Redwood Game State Component |
| `Realm` | The realm's name | `GetServerDetails().RealmName` on the Redwood Game State Component |
| `Party` | The party's ID | `GetCachedParty().Id` |

The Redwood Game State Component replicates the server details to clients, and its `OnServerDetailsChanged` event fires on clients when they arrive. That's a good place to join the `Proxy` and `Shard` rooms after the player joins a server (and leave the previous server's rooms with **Leave Room**).

Don't call **Join Room** with the `Custom`, `Nearby`, or `Direct` types: use **Join Custom Room** for custom rooms, join the `Shard` room to receive nearby messages, and direct messages don't need joining.

When a join succeeds, `OnJoinPrivateRoom` fires with the room's identity. Join failures are only logged (`LogRedwoodChat`); there's no failure event.

## Sending and Receiving

| Function | What it does |
| --- | --- |
| `SendMessageToRoom(Type, Id, Message)` | Send a message to a room you've joined |
| `SendNearbyMessage(ShardId, Message, Location)` | Send a [nearby message](#nearby-messages) through the shard room (`ShardId` is `GetServerDetails().InstanceId`) |
| `SendMessageToPlayer(TargetPlayerId, Message)` | Send a direct message to another `PlayerIdentity` |
| `SendMessageToCharacter(TargetCharacterId, Message)` | Send a direct message to another `PlayerCharacter` in the same Realm |

`SendMessageToCharacter` requires a `PlayerCharacter` **ID** and **will not** accept a character name. Clients can look up an ID with **Get Character Data** (`GetCharacterData`) using the exact name (case-insensitive). Character data isn't returned for characters the calling player doesn't own, but the ID and name are.

Incoming messages arrive through these events on the chat subsystem:

| Event | When it fires |
| --- | --- |
| `OnRoomChatReceived(RoomIdentity, Sender, Timestamp, Message, Location)` | A message arrived in a room you've joined. Rooms echo your own messages back to you too. For nearby messages, `RoomIdentity.Type` is `Nearby` and `Location` is the sender's location. |
| `OnPlayerPrivateChatReceived(Sender, Timestamp, Message)` | Your `PlayerIdentity` received a direct message |
| `OnCharacterPrivateChatReceived(Sender, Timestamp, Message)` | Your `PlayerCharacter` received a direct message |
| `OnJoinPrivateRoom(RoomIdentity)` | A **Join Room** or **Join Custom Room** call succeeded |

`Sender` is an `FRedwoodChatIdentity` (`PlayerId` and `Nickname`); `RoomIdentity` is an `FRedwoodChatRoomIdentity` (`CompleteRoomId`, `Type`, and `RedwoodId`, the ID you joined with). Timestamps are UTC.

Direct messages sent while the recipient is offline are stored (up to `chat.text.max-offline-messages`) and delivered the next time they connect, with their original timestamps. There's no room history: players only see room messages sent while they're in the room. There's also no presence API in the chat plugin; use the [Friends](./friends.md) system's online state instead.

:::warning
Message bodies include the sender's ID and nickname as reported by the sending client, so a modified client could spoof them in room messages. Only the sender `PlayerId` of a direct message comes from the authenticated XMPP connection.
:::

## Custom Rooms

Custom rooms are disabled by default, but can be enabled by setting the config variable `chat.text.room-types.custom.enabled: true`. This allows any player to create as many custom rooms as they want:

1. Create the room with **Create Custom Room** (`CreateCustomRoom(Id, Password)`). The `Id` can be a human-friendly name; leave `Password` empty for no password. Creating a room doesn't join it.
1. Join it with **Join Custom Room** (`JoinCustomRoom(Id, Password, bJoinAsCharacter)`). Players enter as their `PlayerIdentity` or `PlayerCharacter` depending on `bJoinAsCharacter`. Anyone who knows the `Id` (and the password, if it has one) can join.

**Create Custom Room** can fail with `Text chat room already exists` or `Text chat room creation is disabled`. Only call it after **Initialize Chat Connection**; calling it before crashes in 5.0.0.

## Nearby Messages

Nearby messages are special messages sent on the `Shard` room that the **client** filters out of the `Shard` room and reports as `Nearby` room messages with the sender's location. It's up to your client logic to decide the allowable distance to show a nearby message (compare the message's `Location` with the local player's pawn).

:::warning
Clients call `SendNearbyMessage` and specify the `FVector` location for the message, which means they could add a bypass and send messages to any location. You will need to modify Redwood to have this location validated or provided by the game server.
:::

## Blocking

Redwood automatically sends the [XMPP Blocking Command](https://xmpp.org/extensions/xep-0191.html) on behalf of the `PlayerIdentity` or `PlayerCharacter` user to prevent unwanted `Direct` messages. Messages from blocked XMPP users still appear in rooms. Redwood blocks/unblocks accordingly. These block commands are sent when the following happens:
- A `PlayerIdentity` calls the `URedwoodClientGameSubsystem::SetPlayerBlocked` function (can block or unblock)
- A `PlayerCharacter` calls the `URedwoodClientGameSubsystem::AddRealmContact` function (can block or unblock)
- A `PlayerCharacter` calls the `URedwoodClientGameSubsystem::RemoveRealmContact` function (always unblocks)

## Deploying with the Dev Initiator

Text chat isn't started by the Dev Initiator itself, but you can run the chat server locally in Docker alongside it.

:::info
You'll need Docker installed. We recommend [Rancher Desktop](https://rancherdesktop.io/), which you'll also need for [Kubernetes deployments](../../deploying-to-kubernetes/prerequisites.md).
:::

1. Add this line to your [`hosts`](../../getting-started/installing.md#configure-hosts-file) file if you haven't already:

    ```
    127.0.0.1 chat.localhost
    ```

    (The XMPP group chat service, `conference.chat.localhost`, doesn't need a hosts entry; its traffic goes over the same connection.)

1. Inherit from the `simple-chat` config environment in your config env's `_config.json`:

    ``` json
    {
      "parentNames": ["standard", "simple-chat"]
    }
    ```

    (Use your existing `parentNames` and add `"simple-chat"` at the end.) This turns on `chat.text.enabled` and points the backend and client at the local chat server on port `5222`.

1. Make sure Rancher Desktop (or your Docker engine) is running
1. Deploy the ejabberd server:

    ``` bash
    yarn deploy:chat <config-env>
    ```

1. Start (or restart) the Dev Initiator. Remember that characters created before chat was enabled don't have chat accounts.

Now you can use text chat as if you're in a full Kubernetes environment!

You can stop the ejabberd server with the command:

``` bash
yarn deploy:chat <config-env> --stop
```

You can get the XMPP credentials for any user (e.g. to log in to ejabberd's web admin) with the [`get-text-chat-credentials`](../cli.md#get-text-chat-credentials) CLI command.

## Deploying with Kubernetes

:::warning
You **should not** inherit from the `simple-chat` config environment when deploying with Kubernetes.
:::

Text Chat is automatically enabled and deployed with all `kubernetes` environments (`chat.text.enabled` is `true` there).

Add this line to your [`hosts`](../../getting-started/installing.md#configure-hosts-file) file if you haven't already and are deploying to your local Kubernetes cluster:

```
127.0.0.1 chat.localhost
```

For remote deployments, set `chat.text.host` to your chat server's public hostname and set the client's **XMPP Server Uri** to match. See the known issue about the client port in [Setup](#setup).

## Unreal Reference

Everything is on the `URedwoodClientChatSubsystem` (a Game Instance Subsystem, available in Blueprints with **Get RedwoodClientChatSubsystem**), and everything is meant to be called from the client.

### Events

- `OnJoinPrivateRoom` - Called when a `JoinRoom` or `JoinCustomRoom` call succeeds
- `OnPlayerPrivateChatReceived` - Called when the `PlayerIdentity` connection receives a `Direct` message
- `OnCharacterPrivateChatReceived` - Called when the `PlayerCharacter` connection receives a `Direct` message
- `OnRoomChatReceived` - Called when the player receives a message in a room (including `Nearby` messages)

### Functions

- `InitializeChatConnection` (async node **Initialize Chat Connection**) - Connects, authenticates, and configures the ejabberd connections. See [Connecting](#connecting) for what must happen first.
- `IsConnected` - Returns whether both XMPP connections are logged in.
- `JoinRoom` - Join a room; see [Joining Rooms](#joining-rooms) for which `Id` to pass.
- `JoinCustomRoom` - If [custom rooms](#custom-rooms) are enabled, join one with its `Id` and `Password` (empty if no password).
- `CreateCustomRoom` (async node **Create Custom Room**) - If [custom rooms](#custom-rooms) are enabled, create a custom room.
- `LeaveRoom` - Leave a chat room.
- `SendMessageToRoom` - Send a message to an already joined room.
- `SendNearbyMessage` - Send a message to the abstract `Nearby` room, providing a location for the message.
- `SendMessageToPlayer` - Send a direct message to another `PlayerIdentity`.
- `SendMessageToCharacter` - Send a direct message to another `PlayerCharacter` in the same Realm.

The send and join functions do nothing (silently) if **Is Connected** is `false`. The [plugin reference](../../unreal-reference/optional-plugins.md) has the full signatures and types.
