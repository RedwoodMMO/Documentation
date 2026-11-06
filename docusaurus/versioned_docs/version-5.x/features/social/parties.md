---
sidebar_position: 4
---

# Parties

Redwood comes with a Parties system to allow players to temporarily be grouped together. Players in a party do not need to be friends or common guild/alliance members. Party information is not stored in the database and will not persist; treat them as ephemeral constructs. Once all players leave a party, the party and it's associated data will be deleted.

## Ticketing

Redwood has some logic to allow players in parties to be ticketed as a group instead of individuals.

### Matchmaking

If a player is in a party, only the party leader may call `JoinMatchmaking`. Party members must leave the party to queue for solo matchmaking.

### Queuing

The `JoinQueue` function has a `bTransferWholeParty` variable; if this is set to `true` **and** the calling player is the party leader, the whole party will be queued for the same proxy, zone, and shard.

Players may individually queue into different proxies/zones without the other party. The queuing system will try to put players into a shard of the requested zone if any party members are already in the zone.

## Title Screen

When players are in the title screen (aka main menu and sometimes called lobby), Redwood facilitates minimal synchronization of the party without the need of a game server. Players can call create/invite/join/etc party functions from the main menu and receive the backend data of the selected characters of other party members.

Parties exist in Realms, not in the Director, so you must connect to a Realm before able to interact with the Parties system.

:::info
The RPG template (as of 4.0) has a great example showing party interaction in the title screen.
:::

## Party Leader

- There is always 1 party leader.
- If the party leader leaves, the member that has been in the party longest is selected as the new party leader.
- If the party leader leaves and there are no other members, the party is deleted.
- Party leaders may give up the leadership to another member but stay in the party.

## Party Data

The `FRedwoodParty` type supports two variables for party data that the leader can update:

- `FString LootType` - Any string which you can represent how loot is handled for the party. It's up to your game server logic to read this to handle loot distribution; this field is just for convenience.
- `USIOJsonObject *Data` - Any other abstract data as a JSON object (you can use the SIO utilities to convert structs to a JSON object and vice versa).

## Emotes

Players can send emotes to the rest of the party through Redwood. Emotes are represented by any string. You theoretically can use this for any other type of message, but the original design is to have an emotes enum that you can convert to/from strings and use the `SendEmoteToParty` function and `OnPartyEmoteReceived` delegate. You don't need to be in a game server to send/receive emotes.

## Unreal Utilities

### Delegates

- `OnPartyInvited` - Called when the current player is invited to a party
- `OnPartyUpdated` - Called when the current player's current party changes (party leader, membership, member character changes)
- `OnPartyKicked` - Called when the current player is kicked from their current party
- `OnPartyEmoteReceived` - Called when a member of the party sends an emote to the party

### Functions

- `GetCachedParty` - Returns the last updated party details without fetching them
- `GetOrCreateParty` - Get the current player's party with an option to create one if they don't have one
- `LeaveParty` - Leave the current player's party
- `InviteToParty` - (Leader) Invite a player to the party
- `ListPartyInvites` - List the current player's invites to parties
- `RespondToPartyInvite` - Respond to a particular party invite for the current player
- `PromoteToPartyLeader` - (Leader) Give up the party leader role to another player; you can specify the target player ID or leave it empty to auto pick a party leader
- `KickFromParty` - (Leader) Remove a player from the party
- `SetPartyData` - (Leader) Update the current party's data
- `SendEmoteToParty` - Send an emote to the entire party
