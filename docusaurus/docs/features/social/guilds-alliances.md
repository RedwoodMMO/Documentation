---
sidebar_position: 3
---

# Guilds & Alliances

Redwood comes with a Guilds & Alliances system which are meant to group players and provide a mechanism to enable your custom game logic which leverages guild and/or alliance membership.

The guilds & alliances system is hosted within the [Director](../../architecture/overview.md#director) rather than the Realm. With that said, there are two modes of operating guilds & alliances:

- The default is to use the `PlayerIdentity`, which means your guilds/alliances are the same no matter which Realm you're connected to or the character you're using.
- You can set the config var `game.guilds.scoped-to-realm: true` to use the `PlayerCharacter` instead. This will make guilds & alliances "scoped" to the Realm (but still hosted in the Director for simplicity); this means **Realm A** and **Realm B** could have completely different guilds with the same name. Guild members use the `PlayerCharacter` ID, so different characters for the same player would have different guild memberships. In this mode, guilds & alliances can only be retrieved after calling `URedwoodClientGameSubsystem::SetSelectedCharacter` in the main menu or after the player connects to a game server.

You cannot mix these two modes.

:::info
The RPG Template (as of 4.0) comes with a great example of the guilds & alliances system.
:::

## Config

You can override any of the guild/alliance config in `game.yaml`:

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
  # an admin account (via the CLI, dashboard, or using the normal API).
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
    # an admin account (via the CLI, dashboard, or using the normal API).
    # Alliance updates and any admin actions in alliances will need to be done
    # with an admin account as well.
    allow-alliance-creation: true

    # Increase this number if you want to allow guilds to be in
    # multiple alliances.
    max-alliances-per-guild: 1
```

## Unreal Functions

The main functions for the Guilds & Alliances system are available via the `URedwoodClientGameSubsystem` in the plugin:

### Guilds

- `ListGuilds` - List the public (aka `listed`) guilds or the current player's guilds
- `SearchForGuilds` - Search for a public guild by its name
- `GetGuild` - Get a guild's details by providing its ID
- `GetSelectedGuild` - Get the current player's selected guild
- `SetSelectedGuild` - Set the current player's selected guild
- `JoinGuild` - Current player joins a guild if the guild is public or the current player is already invited
- `InviteToGuild` - Invite a player to a guild
- `LeaveGuild` - Current player leaves a guild
- `ListGuildMembers` - List the members of a guild if the current player is in it or if the guild is `listed`/public and has `membershipPublic` set to `true`
- `CreateGuild` - Create a new guild and become its first admin
- `UpdateGuild` - (Admin) Update a guild's details
- `KickPlayerFromGuild` (Admin) Remove a player from a guild
- `BanPlayerFromGuild` (Admin) Remove and/or ban a player from a guild
- `UnbanPlayerFromGuild` (Admin) Unban a player from a guild; this does not add/invite them
- `PromotePlayerToGuildAdmin` (Admin) Promote an existing guild member to be a guild admin
- `DemotePlayerFromGuildAdmin` (Admin) Demote a guild admin to a normal guild member

### Alliances

- `ListAlliances` - List all alliances
- `SearchForAlliances` - Search for an alliance by its name
- `CanAdminAlliance` - Whether the current player can administrate an alliance
- `CreateAlliance` - Create a new alliance with an initial guild (must be an admin of that guild)
- `UpdateAlliance` - (Admin) Update an alliance's details
- `KickGuildFromAlliance` - (Admin) Remove a guild from an alliance
- `BanGuildFromAlliance` - (Admin) Remove and/or ban a guild from an alliance
- `UnbanGuildFromAlliance` - (Admin) Unban a guild from an alliance; this does not add/invite them
- `ListAllianceGuilds` - List the guilds in an alliance
- `JoinAlliance` - Join a public alliance or one that you've been invited to (must be an admin of that guild)
- `LeaveAlliance` - Leave an alliance (must be an admin of that guild)
- `InviteGuildToAlliance` - (Admin) Invite a guild to an alliance
