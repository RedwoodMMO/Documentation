---
sidebar_position: 3
---

# Guilds & Alliances

Redwood comes with a Guilds & Alliances system, which groups players and gives your game logic a way to act on guild and/or alliance membership (guild tags on nameplates, guild chat, faction rules, and so on). Guilds are groups of players; alliances are groups of guilds.

The guilds & alliances system is hosted within the [Director](../../architecture/overview.md#director) rather than the Realm. With that said, there are two modes of operating guilds & alliances:

- The default is to use the `PlayerIdentity`, which means your guilds/alliances are the same no matter which Realm you're connected to or which character you're using. In this mode, the guild functions work as soon as the player is logged in (e.g. from the main menu).
- You can set the config var `game.guilds.scoped-to-realm: true` to use the `PlayerCharacter` instead. This makes guilds & alliances "scoped" to the Realm (but still hosted in the Director for simplicity); this means **Realm A** and **Realm B** could have completely different guilds with the same name. Guild members use the `PlayerCharacter` ID, so different characters for the same player have different guild memberships. In this mode, the Director needs to know which character the player is playing, so guild and alliance functions only work **while the player is connected to a game server** (otherwise they fail with `Player is not in a realm.`).

You cannot mix these two modes.

## Config

You can override any of the guild/alliance config in your config env's `game.yaml` (the full list with descriptions is in the [game config reference](../../configuration/reference/game.md)):

``` yaml
guilds:
  # Whether any of the guild features are enabled.
  enabled: true

  # By default, guilds and alliances are global to all realms (aka scoped to the Director)
  # If you want guilds and alliances to be specific to each realm, set this to true.
  # The data for guilds will still be stored in the Director database, but
  # they will be unique per realm and membership will use PlayerCharacter IDs
  # instead of PlayerIdentity IDs.
  scoped-to-realm: false

  # Allow players to create guilds; set to false if your game
  # either has no guilds or if you want to manage guilds
  # yourself.
  # If set to false, guild creation will need to be done with
  # an admin account using the normal API.
  allow-guild-creation: true

  # The maximum number of guilds a player can be part of.
  max-guilds-per-player: 1

  # Tags are short-handed representations of the guild.
  # e.g. "[TAG] Character Name"
  tags:
    allow:
      casing:
        force: "upper" # false | "upper" | "lower"
        lower: false # ignored if force-casing is set to "upper"
        upper: false # ignored if force-casing is set to "lower"

      numbers: true

      # set to false to disable special characters; setting to true does nothing; provide an array of allowed special characters
      special:
        - "_"

    length:
      min: 2 # must be set to >= 1
      max: 4 # must be set to <= 10 and >= min

  alliances:
    # Whether any of the alliance features are enabled.
    enabled: true

    # Allow guilds to create alliances; set to false if your game
    # either has no alliances or if you want to manage alliances
    # yourself (i.e. the game only has 3 overall factions).
    # If set to false, alliance creation will need to be done with
    # an admin account using the normal API.
    # Alliance updates and any admin actions in alliances will need to be done
    # with an admin account as well.
    allow-alliance-creation: true

    # Increase this number if you want to allow guilds to be in
    # multiple alliances.
    max-alliances-per-guild: 1
```

:::note
If you turn off `allow-guild-creation` or `allow-alliance-creation`, guilds and alliances must be created by a Redwood admin account (see [`create-admin`](../cli.md#create-admin)) calling the normal API, e.g. by logging in to your game (or a small internal tool built with the plugin) as an admin and calling **Create Guild**. There's no CLI command or dashboard for this in 5.0.
:::

:::warning
If `guilds.enabled` (or `guilds.alliances.enabled`) is `false`, the Director doesn't register the guild (or alliance) API at all, so calling those functions from the client never gets a response. Don't show guild UI when it's disabled.
:::

## Unreal Functions

The functions for the Guilds & Alliances system are available on the client subsystem (`URedwoodClientGameSubsystem`). Each has a matching Blueprint async node of the same name (e.g. **Create Guild**). In the descriptions below, "(Guild admin)" means the current player must be an admin of that guild, not a Redwood admin account.

### Guilds

| Function | What it does |
| --- | --- |
| `ListGuilds(bOnlyPlayersGuilds)` | List the public (aka `listed`) guilds, or only the current player's guilds |
| `SearchForGuilds(SearchText, bIncludePartialMatches)` | Search for a public guild by its name |
| `GetGuild(GuildId)` | Get a guild's details (and the current player's membership state in it) by ID |
| `GetSelectedGuild()` | Get the current player's [selected guild](#the-selected-guild) |
| `SetSelectedGuild(GuildId)` | Set the current player's selected guild |
| `JoinGuild(GuildId)` | Join a guild if it's public or the current player has been invited |
| `InviteToGuild(GuildId, TargetPlayerId)` | Invite a player to a guild (who can invite depends on the guild's `InviteType`) |
| `LeaveGuild(GuildId)` | Leave a guild |
| `ListGuildMembers(GuildId, State)` | List the members of a guild (filtered by membership state) if the current player is in it, or if the guild is `listed` and has `bMembershipPublic` set to `true` |
| `CreateGuild(GuildName, GuildTag, InviteType, bListed, bMembershipPublic)` | Create a new guild and become its first admin |
| `UpdateGuild(GuildId, ...)` | (Guild admin) Update a guild's details |
| `KickPlayerFromGuild(GuildId, TargetPlayerId)` | (Guild admin) Remove a player from a guild |
| `BanPlayerFromGuild(GuildId, TargetPlayerId)` | (Guild admin) Remove and/or ban a player from a guild |
| `UnbanPlayerFromGuild(GuildId, TargetPlayerId)` | (Guild admin) Unban a player from a guild; this does not add/invite them |
| `PromotePlayerToGuildAdmin(GuildId, TargetPlayerId)` | (Guild admin) Promote an existing guild member to be a guild admin |
| `DemotePlayerFromGuildAdmin(GuildId, TargetPlayerId)` | (Guild admin) Demote a guild admin to a normal guild member |

A guild's `InviteType` (`ERedwoodGuildInviteType`) controls how players get in: `Public` (anyone can join), `Admin` (only guild admins can invite), or `Member` (any member can invite). Membership states (`ERedwoodGuildAndAllianceMemberState`) are `None`, `Invited`, `Member`, `Banned`, and `Admin`.

In scoped-to-realm mode, `TargetPlayerId` is a character ID (`PlayerCharacter`) rather than a player ID.

### Alliances

| Function | What it does |
| --- | --- |
| `ListAlliances(GuildIdFilter)` | List all alliances, or only the alliances a guild is part of (with that guild's state in each) |
| `SearchForAlliances(SearchText, bIncludePartialMatches)` | Search for an alliance by its name |
| `CanAdminAlliance(AllianceId)` | Whether the current player can administrate an alliance (an empty error means yes) |
| `CreateAlliance(AllianceName, GuildId, bInviteOnly)` | Create a new alliance with an initial guild (the player must be an admin of that guild) |
| `UpdateAlliance(AllianceId, AllianceName, bInviteOnly)` | (Alliance admin) Update an alliance's details |
| `KickGuildFromAlliance(AllianceId, GuildId)` | (Alliance admin) Remove a guild from an alliance |
| `BanGuildFromAlliance(AllianceId, GuildId)` | (Alliance admin) Remove and/or ban a guild from an alliance |
| `UnbanGuildFromAlliance(AllianceId, GuildId)` | (Alliance admin) Unban a guild from an alliance; this does not add/invite them |
| `ListAllianceGuilds(AllianceId, State)` | List the guilds in an alliance |
| `JoinAlliance(AllianceId, GuildId)` | Join a public alliance or one the guild has been invited to (the player must be an admin of that guild) |
| `LeaveAlliance(AllianceId, GuildId)` | Leave an alliance (the player must be an admin of that guild) |
| `InviteGuildToAlliance(AllianceId, GuildId)` | (Alliance admin) Invite a guild to an alliance |

:::caution Known issue (5.0.0)
**Ban Guild From Alliance** sends the wrong field name and fails backend validation. The **Unban Guild From Alliance** Blueprint node passes its two IDs to the backend in swapped order, so it also fails; call `UnbanGuildFromAlliance(AllianceId, GuildId)` from C++ instead.
:::

### A simple guild flow

1. **Create:** a player fills out a form and you call **Create Guild**. The output includes the new `GuildId`; the player is now the guild's admin. Call **Set Selected Guild** with it so the tag shows up in game.
1. **Invite:** the admin finds a player (e.g. with **Search for Players** from the [Friends](./friends.md) system) and calls **Invite to Guild**.
1. **Join:** the invited player sees the guild in **List Guilds** (with `bOnlyPlayersGuilds` set to `true`, their invites are included with the `Invited` state) or via **Get Guild**, and calls **Join Guild**.
1. **Manage:** show **List Guild Members** for the roster, with kick/ban/promote/demote buttons for admins.

## The Selected Guild

Players can be in multiple guilds (if `max-guilds-per-player` allows), but they have one **selected guild**, which is the one your game shows and uses. The selected guild flows into gameplay automatically:

- On the game server, `URedwoodPlayerStateComponent::RedwoodPlayer` has `bSelectedGuildValid` and `SelectedGuild` (an `FRedwoodGuildInfo`).
- The `URedwoodCharacterComponent` on the player's pawn replicates `RedwoodNameTag` (the selected guild's tag, or empty) to everyone, and `bSelectedGuildValid`/`SelectedGuild` to the owning player only.
- Redwood sets the player's name (`APlayerState::SetPlayerName`) to `[TAG] Nickname` when they have a selected guild with a tag.

If a guild has a [text chat](./text-chat.md) room, pass the guild's ID to **Join Room** with the `Guild` room type.
