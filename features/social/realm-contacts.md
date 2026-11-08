---
sidebar_position: 2
---

# Realm Contacts

Realm Contacts are a method for a `PlayerCharacter` to favorite another `PlayerCharacter` in the same Realm. This can be useful if the player has a favorite character to trade with or as an alternative to the [Friends](./friends.md) system but for PlayerCharacters.

Contacts do not need to be accepted by the target character, but they be used to block a target character (including [text chat DMs](./text-chat.md#blocking)).

Contacts can also have a player-defined description (e.g. `Iron Buyer`); the API will also return the actual target character's name.

## Unreal Functions

The main functions for the Friend system are available via the `URedwoodClientGameSubsystem` in the plugin:

- `ListFriends`: Lists your friends; it takes a filter so you can show all relationships, just the pending invites, etc
- `RequestFriend`: Initiate a friend request
- `RemoveFriend`: Remove an existing friend
- `RespondToFriendRequest`: Accept/deny a friend request or rescind your previous request; denying will allow them to send another request
- `SetPlayerBlocked`: Blocks players from sending more friend requests

We've also provided a `SearchForPlayers` function where you can get the player ID used for requesting a friend. You can provide a username (what they use to login with) or nickname (defaults to the username, [Steam auth](../authentication/steam.md) will set this to their Steam alias)

## Online State

Players can see the online state of _accepted_ friends. This state is non-null only in the `ListFriends` response. The struct has two booleans `bOnline` and `bPlaying`. `bOnline` means that they have at least logged into the Director. `bPlaying` can only be true if `bOnline` is true. `bPlaying == true` means they're in a game server and the `OnlineStateRealm` variable is valid. `bPlaying == false && bOnline == true` means they're not in a game server but connected to the Director (likely just sitting in the main menu/title screen).

The `OnlineStateRealm` variable includes all of their current online status: `RealmName`, `ProxyId`, `ZoneName`, `ShardName`, and `CharacterId` (which is the `PlayerCharacter` that they're currently playing as).
