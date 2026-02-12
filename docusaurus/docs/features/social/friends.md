---
sidebar_position: 1
---

# Friends

Redwood comes with a Friends system, which allows you to make friend requests, respond to friend requests, and block players. This system may seem simple, but it'll be useful for future features such as chat and parties. The Friends system also includes tracking the online state of your friends.

The friends system is hosted within the [Director](../../architecture/overview.md#director) rather than the Realm, which means your friends are the same no matter which Realm you're connected to. Friends are made with `PlayerIdentity` rather than `PlayerCharacter`, so you your friend is accessible from the same username regardless of which character they're playing as currently.

:::info
The RPG Template (as of 3.1) comes with a great example of the friends system. The template shows the friend UI widget via an interactable in the village zone (mainly to keep the template simpler), but you could program this UI to work in the title screen and HUD too.
:::

:::tip
If you want to let players to add a Friend (which requires a `PlayerIdentity` ID) with a `PlayerCharacter` name, you can use the `URedwoodClientGameSubsystem::GetCharacterData` with the character name (exact but case-insensitive). The returned object will include the associated `PlayerId` (and omitting the sensitive character data) that can be used for Friends.
:::

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
