---
sidebar_position: 1
---

# Friends

Redwood comes with a Friends system, which allows players to make friend requests, respond to friend requests, and block players. The Friends system also includes tracking the online state of your friends (whether they're online, and which server they're playing on).

The Friends system is hosted within the [Director](../../architecture/overview.md#director) rather than the Realm, which means your friends are the same no matter which Realm you're connected to. Friends are made between `PlayerIdentity` accounts rather than `PlayerCharacter`s, so your friend is the same person regardless of which character they're currently playing. (If you want a character-based list instead, see [Realm Contacts](./realm-contacts.md).)

Because friends live in the Director, the whole system works as soon as the player has logged in; they don't need to be connected to a realm or a game server. You can build your friends UI in the main menu, in an in-game HUD, or both.

## Unreal Functions

The functions for the Friends system are available on the client subsystem (`URedwoodClientGameSubsystem`). Each has a matching Blueprint async node of the same name:

| Function | What it does |
| --- | --- |
| `SearchForPlayers(UsernameOrNickname, bIncludePartialMatches, OnOutput)` | Find players by username (what they log in with) or nickname (defaults to the username; [Steam](../authentication/steam.md) and [Epic](../authentication/epic.md) set it to the player's Steam/Epic display name). Returns `FRedwoodPlayer` structs with each player's `PlayerId`. |
| `ListFriends(Filter, OnOutput)` | Lists your relationships; the `ERedwoodFriendListType` filter selects all relationships, only accepted friends, pending requests, blocked players, etc. |
| `RequestFriend(OtherPlayerId, OnOutput)` | Send a friend request |
| `RespondToFriendRequest(OtherPlayerId, bAccept, OnOutput)` | Accept or deny a friend request, or rescind a request you sent; denying allows them to send another request |
| `RemoveFriend(OtherPlayerId, OnOutput)` | Remove an existing friend |
| `SetPlayerBlocked(OtherPlayerId, bBlocked, OnOutput)` | Block (or unblock) a player, which stops their friend requests and [text chat DMs](./text-chat.md#blocking) |

Each `FRedwoodPlayer` has a `FriendshipState` (`Active`, `PendingReceived`, `PendingSent`, `Blocked`, etc.) describing your relationship with that player.

There are no events for friend requests in 5.0; refresh your list with **List Friends** when the UI opens (and periodically while it's open, if you want it to stay current).

:::caution Known issue (5.0.0)
**List Friends** only works with the `All` filter; every other filter fails backend validation. List `All` and filter the results yourself on each player's `FriendshipState`.
:::

:::tip
If you want to let players add a friend (which requires a `PlayerIdentity` ID) by typing a `PlayerCharacter` name, use **Get Character Data** (`GetCharacterData`) with the character name (exact, but case-insensitive). The returned character includes the associated `PlayerId` (with the character's private data omitted), which you can pass to **Request Friend**.
:::

### A simple friends screen

1. When the screen opens, call **List Friends** with the `All` filter and sort the results by `FriendshipState` into sections: friends (`Active`), incoming requests (`PendingReceived`), outgoing requests (`PendingSent`), and blocked (`Blocked`).
1. For incoming requests, show **Accept** and **Deny** buttons that call **Respond to Friend Request** with `bAccept` set accordingly, then refresh the list.
1. For an "Add friend" box, call **Search for Players** with the entered text (optionally with partial matches), show the results, and call **Request Friend** with the chosen player's `PlayerId`.
1. Add **Remove** and **Block** buttons to friends that call **Remove Friend** and **Set Player Blocked**.

## Online State

Players can see the online state of _accepted_ friends. This state is only filled in for friends in the `ListFriends` response. The `FRedwoodPlayer` struct has two booleans, `bOnline` and `bPlaying`:

- `bOnline` means they're logged in to the Director.
- `bPlaying` can only be true if `bOnline` is true. `bPlaying == true` means they're in a game server and the `OnlineStateRealm` variable is valid.
- `bPlaying == false && bOnline == true` means they're not in a game server but are connected to the Director (likely just sitting in the main menu/title screen).

The `OnlineStateRealm` variable includes their current location: `RealmName`, `ProxyId`, `ZoneName`, `ShardName`, and `CharacterId` (the `PlayerCharacter` that they're currently playing as). You could use `ProxyId` to let players join their friend's server with **Join Proxy with Single Instance** or **Join Queue** (see [Joining a Server](../../getting-started/building-the-main-menu.md#5-join-a-server)).
