---
sidebar_position: 4
---

# Parties

Redwood comes with a Parties system to allow players to temporarily be grouped together. Players in a party do not need to be friends or common guild/alliance members. Party information is not stored in the database and will not persist; treat parties as ephemeral constructs. Once all players leave a party, the party and its associated data are deleted.

Parties exist in Realms, not in the Director, so players must be [connected to a Realm](../../getting-started/building-the-main-menu.md#3-connect-to-a-realm) **and have a selected character** before they can use the Parties system.

## Config

Parties are configured per realm in the [Realm Instance Config](../../configuration/realm-instance-config.md) (see the [realm config reference](../../configuration/reference/realm.md) for details):

```yaml
parties:
  enabled: true

  # how many players can be in a party
  max-size: 4

  # max number of invites a player can have pending
  max-invites: 3

  # which PlayerCharacter fields are included in the party info
  # for each of the members
  included-character-fields:
    - "characterCreatorData"
    - "metadata"
    # - "equippedInventory"
    # - "nonequippedInventory"
    # - "progress"
    # - "data"
    # - "abilitySystem"
```

`included-character-fields` controls which of each member's [character data](../data/game/player-data.md#playercharacter) every party member can see, e.g. to show the other members' characters in your main menu. Only include what's safe to share.

## Title Screen

When players are in the title screen (aka main menu, sometimes called the lobby), Redwood synchronizes the party without the need for a game server. Players can create, invite, join, and leave parties from the main menu and receive the selected characters of the other party members.

A typical main menu party flow:

1. After [selecting a character](../../getting-started/building-the-main-menu.md#4-pick-or-create-a-character), bind the subsystem's `OnPartyInvited`, `OnPartyUpdated`, and `OnPartyKicked` events.
1. Call **Get or Create Party** with `bCreateIfNotInParty` set to `false` to see if the player is already in a party (e.g. when they come back from a match). If the returned party's `bValid` is `false`, they're not in one.
1. To invite someone, call **Get or Create Party** with `bCreateIfNotInParty` set to `true` (this makes the player the leader of a new party), then **Invite to Party** with the target's **player** ID (e.g. from your [friends list](./friends.md)).
1. When `OnPartyInvited` fires on the invited player's client, show the invite (it includes `FromPlayerName`) and call **Respond to Party Invite** with the invite's `Id` and `bAccept`. Players can also see their pending invites with **List Party Invites**.
1. Whenever `OnPartyUpdated` fires, redraw your party UI from the provided `FRedwoodParty` (or from **Get Cached Party**). Each `FRedwoodPartyMember` has the member's `PlayerId`, `Nickname`, the server instance they're on (if any), and their selected `Character` (with the fields from `included-character-fields`).
1. When the leader is ready, they start [matchmaking](#matchmaking) or [queue](#queuing) for the whole party.

If a member changes their selected character with **Set Selected Character** while in a party, the party is updated with the new character.

:::note
When a player's realm connection drops, the backend removes them from their party. Calling **Initialize Realm Connection** again while already connected also counts as a new session and removes them from their party.
:::

## Ticketing

Redwood has some logic to allow players in parties to be ticketed as a group instead of individuals.

### Matchmaking

If a player is in a party, only the party leader may call **Join Matchmaking**; the whole party is matched together and sent to the same server. Party members must leave the party to queue for solo matchmaking.

### Queuing

**Join Queue** has a `bTransferWholeParty` input; if this is set to `true` **and** the calling player is the party leader, the whole party is queued for the same proxy, zone, and shard.

Players may individually queue into different proxies/zones without the other party members. The queuing system tries to put players into a shard of the requested zone that other party members are already in.

## Party Leader

- There is always 1 party leader.
- If the party leader leaves, the member that has been in the party longest is selected as the new party leader.
- If the party leader leaves and there are no other members, the party is deleted.
- Party leaders may give up the leadership to another member but stay in the party.

## Party Data

The `FRedwoodParty` type supports two variables for party data that the leader can update with **Set Party Data**:

- `FString LootType` - Any string which you can use to represent how loot is handled for the party. It's up to your game server logic to read this to handle loot distribution; this field is just for convenience.
- `USIOJsonObject* Data` - Any other abstract data as a JSON object (you can use **Struct to Json Object** / **Json Object to Struct** to convert structs to a JSON object and back).

:::caution Known issue (5.0.0)
The **Set Party Data** Blueprint node is mislabeled as **Respond to Party Invite** in the node menu, so there are two nodes with that name. The one with the **Loot Type** and **Party Data** inputs is Set Party Data.
:::

## Emotes

Players can send emotes to the rest of the party through Redwood. Emotes are represented by any string. You can technically use this for any other type of message, but the original design is to have an emotes enum that you convert to/from strings and use with the `SendEmoteToParty` function and the `OnPartyEmoteReceived` event. You don't need to be in a game server to send/receive emotes.

## Unreal Reference

Everything below is on the client subsystem (`URedwoodClientGameSubsystem`); the functions have matching Blueprint async nodes.

### Events

| Event | When it fires |
| --- | --- |
| `OnPartyInvited` | The current player is invited to a party (`FRedwoodPartyInvite` with the party's `Id`, `FromPlayerId`, and `FromPlayerName`) |
| `OnPartyUpdated` | The current player's party changes (party leader, membership, member character changes, or party data) |
| `OnPartyKicked` | The current player is kicked from their party |
| `OnPartyEmoteReceived` | A member of the party sends an emote (`PlayerId` and `Emote`) |

### Functions

| Function | What it does |
| --- | --- |
| `GetCachedParty()` | Returns the last party details the client received without fetching them (`bValid` is `false` if not in a party) |
| `GetOrCreateParty(bCreateIfNotInParty)` | Get the current player's party, optionally creating one if they don't have one |
| `LeaveParty()` | Leave the current player's party |
| `InviteToParty(TargetPlayerId)` | (Leader) Invite a player to the party |
| `ListPartyInvites()` | List the current player's pending party invites |
| `RespondToPartyInvite(PartyId, bAccept)` | Accept or decline a party invite (pass the invite's `Id`) |
| `PromoteToPartyLeader(TargetPlayerId)` | (Leader) Give the party leader role to another member; leave the target empty to automatically pick a new leader |
| `KickFromParty(TargetPlayerId)` | (Leader) Remove a player from the party |
| `SetPartyData(LootType, PartyData)` | (Leader) Update the party's data |
| `SendEmoteToParty(Emote)` | Send an emote to the entire party |
