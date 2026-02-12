---
sidebar_position: 5
---

# Text Chat

Redwood includes a self-hosted Text Chat server and easy to use client SDK calls. Redwood will automatically deploy and configure a [ejabberd](https://www.ejabberd.im/) server. Ejabberd is a free and open source XMPP server. Redwood also includes a forked version of Unreal's `XMPP` module and wraps it with some helper functions for easier integration.

The `RedwoodChat` plugin maintains two XMPP chat connections for the user, one for the `PlayerIdentity` and one for the `PlayerCharacter`. These have separate XMPP user accounts with the associated `id` as the username (auto created for you on player registration and character creation respectively) and the same XMPP password (`PlayerIdentity.xmppPassword` stored in the Director database).

:::warning
Redwood does not automatically connect to rooms for you. Redwood just makes sure players/characters have access to rooms based on their connection. Rooms are marked as Private, which ensures players can't just manually connect to any room if they know the ID. It's up to you to call the [`JoinRoom` function](#unreal-utilities) accordingly.
:::

:::tip
The RPG Template (as of 4.0) provides a great BP example of how to use Text Chat and highly recommended to use as reference or a starting point for your own integration.
:::

## Configuration

See `config/node/default/chat/text.yaml` for all configurable parameters. You can enable/disable various [room types](#room-types) with the `chat.text.room-types` config object.

## Setup

1. Enable the [`RedwoodChat` plugin](https://github.com/RedwoodMMO/RedwoodPlugins/tree/main/RedwoodChat) in your project
1. Add the `RedwoodChat` module to your `*.Build.cs` if you're using it in C++

:::warning
Redwood currently doesn't have a full integration to provide TLS/encrypted text chat. You can follow the [GitHub issue tracking this feature](https://github.com/RedwoodMMO/Roadmap/issues/104) on the [roadmap](https://github.com/orgs/RedwoodMMO/projects/1/views/1).
:::

## Room Types

Redwood supports these types of chat rooms; players are automatically authorized to a particular room via the backend when applicable:

| Room Type | XMPP Connection | Description |
| - | - | - |
| `Guild` | Depends on guild scope | Room for an entire guild regardless of their server connection |
| `Party` | `PlayerCharacter` | Room for an entire party regardless of their server connection |
| `Realm` | `PlayerCharacter` | Room for all characters connected to any game server in a particular Realm |
| `Proxy` | `PlayerCharacter` | Room for all characters connected to a game server in a particular GameServerProxy |
| `Shard` | `PlayerCharacter` | Room for all characters connected to a specific game server |
| `Nearby` | `PlayerCharacter` | Abstract room type that shows messages sent by nearby characters in your same shard; messages are sent in the shard room, but `Shard` rooms don't show `Nearby` messages and vice versa to the client |
| `Custom` | Depends on `bJoinAsCharacter` arg passed in `JoinCustomRoom` | [Rooms created by users](#custom-rooms), disabled by default |
| `Direct` | Depends if you call `SendMessageToPlayer` or `SendMessageToCharacter` | Room for direct messages between 2 players regardless of their server connection |

:::warning
The `Team` room type that exists in the `ERedwoodChatRoomType` enum is currently not supported, but will be supported in the future.
:::

## Custom Rooms

Custom rooms are disabled by default, but can be enabled by setting the config variable `chat.text.room-type.custom.enabled: true`. This allows any player to create as many custom rooms as they want. Players can join custom rooms using `JoinCustomRoom` and they can enter as their `PlayerIdentity` or `PlayerCharacter` specified by the `bJoinAsCharacter` arg.

## Nearby Messages

Nearby messages are special messages sent on the `Shard` room that the **client** will filter out of the `Shard` room and determine if it should be displayed in the `Nearby` room. It's up to your client logic to determine the allowable distance to show a nearby message.

:::warning
Clients call `SendNearbyMessage` and specify the `FVector` location for the message, which means they could add a bypass and send messages to any location. You will need to modify Redwood to have this location validated or provided by the game server.
:::

## Blocking

Redwood will automatically send the [XMPP Blocking Command](https://xmpp.org/extensions/xep-0191.html) on behalf of the `PlayerIdentity` or `PlayerCharacter` user to prevent unwanted `Direct` messages. Messages from blocked XMPP users will still appear in rooms. Redwood will block/unblock accordingly. These block commands are sent when the following happens:
- A `PlayerIdentity` calls the `URedwoodClientGameSubsystem::SetPlayerBlocked` function (can block or unblock)
- A `PlayerCharacter` calls the `URedwoodClientGameSubsystem::AddRealmContact` function (can block or unblock)
- A `PlayerCharacter` calls the `URedwoodClientGameSubsystem::RemoveRealmContact` function (always unblocks)

## Deploying with the Dev Initiator

:::info
You will need install the [Kubernetes dependencies](../../deploying-to-kubernetes/prerequisites.md) before continuing.
:::

Normally text chat is only available in a full Kubernetes environment, but we provided a way for you to enable text chat using the Dev Initiator.

1. Add these lines to your [`etc/hosts`](../../getting-started/installing.md#configure-hosts-file) file if you haven't already:

    ```
    127.0.0.1 chat.localhost
    127.0.0.1 muc.chat.localhost
    ```

1. You will need to inherit from the `simple-chat` config environment in your config env's `_config.json`:

    ``` json
    {
      "parentNames": [/* your existing parentNames array contents*/, "simple-chat"]
    }
    ```

1. Make sure Rancher Desktop is running

1. Deploy the ejabberd server:

    ``` bash
    yarn deploy:chat <config-env>
    ```

Now you will be able to use text chat as if you're in a full Kubernetes environment!

You can stop the ejabberd server with the command:

``` bash
yarn deploy:chat <config-env> --stop
```

## Deploying with Kubernetes

:::warning
You **should not** inherit from the `simple-chat` config environment when deploying with Kubernetes.
:::

Text Chat is automatically enabled and deployed with all `kubernetes` environments.

Add these lines to your [`etc/hosts`](../../getting-started/installing.md#configure-hosts-file) file if you haven't already and are deploying to your local Kubernetes cluster:

    ```
    127.0.0.1 chat.localhost
    127.0.0.1 muc.chat.localhost
    ```

## Unreal Utilities

Everything is accessible via the `URedwoodClientChatSubsystem` and all are meant to be called from the client.

### Delegates

- `OnJoinPrivateRoom` - Called if the `JoinRoom` function succeeds
- `OnPlayerPrivateChatReceived` - Called if the `PlayerIdentity` connection receives a `Direct` message
- `OnCharacterPrivateChatReceived` - Called if the `PlayerCharacter` connection receives a `Direct` message
- `OnRoomChatReceived` - Called if the player receives any other type of chat message

### Functions

- `InitializeChatConnection` - Connects, authenticates, and configures the ejabberd connection. **NOTE:** Players must already be connected and logged into the Director before calling this function.
- `IsConnected` - Returns if the player is connected to the ejabberd server.
- `JoinRoom` - Clients must join a room before sending messages to it; they will need to know the Room Type and the ID of that type. See the RPG Template for a good example on how to use this practically.
- `JoinCustomRoom` - If [custom rooms](#custom-rooms) are enabled, this function is used to join those rooms. Clients need to know the `Id` (this can be a human-friendly name) and the `Password` (left empty if no password) used in the `CreateCustomRoom` function call.
- `CreateCustomRoom` - If [custom rooms](#custom-rooms) are enabled, this function is used to create a custom room.
- `LeaveRoom` - Leave a chat room.
- `SendMessageToRoom` - Send a message to an already joined room.
- `SendNearbyMessage` - Send a message to the abstract `Nearby` room, providing a location for the message.
- `SendMessageToPlayer` - Send a direct message to another `PlayerIdentity`.
- `SendMessageToCharacter` - Send a direct message to another `PlayerCharacter` in the same Realm.

    :::tip
    This requires a `PlayerCharacter.id` and **will not** accept a `PlayerCharacter.name`. Clients can fetch an ID by calling `URedwoodClientGameSubsystem::GetCharacterData` using the exact `name` (case-insensitive). Character data will not be returned from that function if the calling player doesn't own the character, but the ID and name will be.
    :::
