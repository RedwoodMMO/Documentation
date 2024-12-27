---
sidebar_position: 4
sidebar_label: Game Modes and Maps
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Defining Game Modes and Maps for Redwood

Both Unreal and the Backend need to be configured with different information on what game modes and maps exist and correlated information. Without these being properly configured and synchronized, you may not be able to get the corresponding match to start.

## Unreal

Redwood defines two `UDataAsset` types that are **required** to be used for your game to work with Redwood:
- [`URedwoodGameModeAsset`](#game-mode-asset)
- [`URedwoodMapAsset`](#map-asset)

These serve a few functions:
- Provide synchronized IDs with the `game.profiles` backend configuration for Game Modes and Maps
- Link the ID with the respective Unreal asset
- Provide any user-friendly information for display
- Enable a standardized way for the Redwood server game subsystem to know how to change a map when the backend tells it to load a new mode/map

### Asset Manager Settings

All of our Gameplay Templates come preconfigured to package the predefined assets, but if you want to define these assets in a different directory or you're integrating Redwood to your existing project, you'll need to change the Asset Manager settings to ensure these assets are tagged and cooked properly.

1. In the Unreal Editor, navigate to `Edit > Project Settings...`
1. Find **Asset Manager** under the **Game** section in the side panel
1. Under **Primary Asset Types to Scan**, add a new entry:
    - Set **Primary Asset Type** to `RedwoodGameModeAsset`
    - Set **Asset Base Class** to `RedwoodGameModeAsset`
    - Add an entry to the **Directories** and set it to where your data assets are located
    - Under **Rules** set the **Cook Rule** to `Always Cook`
1. Under **Primary Asset Types to Scan**, add a new entry:
    - Set **Primary Asset Type** to `RedwoodMapAsset`
    - Set **Asset Base Class** to `RedwoodMapAsset`
    - Add an entry to the **Directories** and set it to where your data assets are located
    - Under **Rules** set the **Cook Rule** to `Always Cook`

![Data Assets Asset Manager settings](/img/data-asset-manager.jpg)

### Game Mode Asset

An instance of `URedwoodGameModeAsset` should exist for each game mode you'd like to use in matchmaking as well as lobbies (regardless if they're started by the user or the backend).

- `Redwood Id` should be lowercase with no spaces and should be unique to this game mode asset.
- The `Front End` variables do anything automatically, but you can use these in your main menu/frontend widgets for information to display to the user. See the **Match** template's `W_RW_HostSessionsScreen` and `W_RW_Matchmaking` widgets in `/Content/Redwood/Frontend/` for examples.
- `Game Mode Type` specifies which class the corresponding game mode inherits from (`GameModeBase` or `GameMode`).
- `Game Mode [Base] Class` is the class of the corresponding game mode

![Game Mode DataAsset](/img/data-asset-game-mode.jpg)

### Map Asset

An instance of `URedwoodMapAsset` should exist for each level/map you'd like to use in matchmaking as well as lobbies (regardless if they're started by the user or the backend).

- `Redwood Id` should be lowercase with no spaces and should be unique to this map asset.
- `Map Name` is a user friendly name that you can use in your widgets.
- `Map Id` is reference to the Unreal Persistent Level for this map.

![Map DataAsset](/img/data-asset-map.jpg)

## Backend

### Profiles

The Redwood Backend configures the Game Modes and Maps under the `game.profiles` config variable. This variable is an array of game modes. Each game mode can have 1 or more maps associated with it. You can associate a map with multiple game modes. Below are descriptions for each variable for each item in the array:

- `id` is a unique identifier that Redwood uses to keep track of each profile; it's also used as `Redwood Id` in the Unreal [Game Mode DataAsset](#game-mode-asset)
- `zones` is an object, containing a named object for each zone
  - `<zone-name>`
    - `maps` is an array of strings where each string associates with the corresponding `Redwood Id` variable you defined in the corresponding `URedwoodMapAsset`. A map will be randomly selected from this array.
- `max-players-per-shard` is the maximum amount of players for a single game server instance (aka shard). It also serves as the maximum number of players that are allowed for matchmaking to consider a full match.
- `num-players-to-add-shard` is the number of players per zone per shard to choose to add another shard for the zone. Not setting/setting to null will disable sharding.
- `num-minutes-to-destroy-empty-shard` Set this variable if you want empty shards to be destroyed after so many minutes of remaining empty. If you want to try to incentivize players to move from low-population shards to medium-population shards to be more efficient with server costs, you'll need to implement additional game and/or backend logic.
- `min-players-for-matchmaking` is the minimum number of players that are allowed for matchmaking to consider a potential shallow match.
- `matchmaking-zone-name` is an optional field that is required to enable matchmaking for this profile. Matchmaking requires a single-zone [`GameServerProxy`](../architecture/game-servers.md#gameserverproxy) so this field indicates which of the `zones` to use for matchmaking.
- `collection-ends-when-any-instance-ends` is a boolean that when `true` Redwood will shutdown all [`GameServerInstances`](../architecture/game-servers.md#gameserverinstance) in the associated [`GameServerCollection`](../architecture/game-servers.md#gameservercollection) if any of the `GameServerInstances` end.
- `data` is a key/value pair object where each pair will be passed to the map load URL as a parameter (e.g. &key=value). The value must be a string.

Here are some examples of `<config-environment>/game.yaml` for the **Match** and **RPG** templates:


<Tabs>
  <TabItem value="match" label="Match" default>
    ``` yaml
    profiles:
      - id: "elimination"

        zones:
          main:
            maps:
              - "expanse"

        max-players-per-instance: 16

        matchmaking-zone-name: "main"
        min-players-for-matchmaking: 1

        data:
          Experience: "B_ShooterGame_Elimination"

      - id: "control"

        zones:
          main:
            maps:
              - "convolution"

        max-players-per-instance: 16

        matchmaking-zone-name: "main"
        min-players-for-matchmaking: 1

        data:
          Experience: "B_LyraShooterGame_ControlPoints"
    ```
  </TabItem>
  <TabItem value="rpg" label="RPG">
    ``` yaml
    profiles:
      - id: "overworld"

        zones:
          variableCasing: "original"
          village:
            maps:
              - "overworld"
          outskirts:
            maps:
              - "overworld"
          mountain-pass:
            maps:
              - "overworld"
          forest:
            maps:
              - "overworld"
          mine:
            maps:
              - "mine"

        max-players-per-shard: 16

        num-players-to-add-shard: 50
        # num-minutes-to-destroy-empty-shard: 5
        collection-ends-when-any-instance-ends: false

        data:

      - id: "instanced-dungeon"

        zones:
          variableCasing: "original"
          main:
            maps:
              - "dungeon"

        max-players-per-shard: 16

        matchmaking-zone-name: "main"
        min-players-for-matchmaking: 1

        data:
    ```
  </TabItem>
</Tabs>

### Shard Names / Max Shards Per Zone

The `game.shard-names` is a list of names to use for shards. When a shard is created, it will pick the first name from this list that is not already in use. If no names are available, it will not be created, so make sure you have enough names for the max number of shards you want to support. Redefining this variable will override the whole list.

The configured **maximum shards per zone** is equal to the length of this array.

This is the default value of `game.shard-names`:

``` yaml
shard-names:
  - "Alpha"
  - "Bravo"
  - "Charlie"
  - "Delta"
  - "Echo"
  - "Foxtrot"
  - "Golf"
  - "Hotel"
  - "India"
  - "Juliet"
  - "Kilo"
  - "Lima"
  - "Mike"
  - "November"
  - "Oscar"
  - "Papa"
  - "Quebec"
  - "Romeo"
  - "Sierra"
  - "Tango"
  - "Uniform"
  - "Victor"
  - "Whiskey"
  - "Xray"
  - "Yankee"
  - "Zulu"
```
