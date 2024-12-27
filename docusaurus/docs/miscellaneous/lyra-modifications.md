---
sidebar_position: 2
sidebar_label: Lyra Modifications to the Match Template
---

# Lyra Modifications to the Match Template

The modifications we made to Lyra are mainly just how it integrates with the online services, but otherwise the gameplay remains unchanged. Below we've outlined the main areas that we made these modifications to.

## Frontend (aka Main Menu/Title Screen)

There are several modifications to the frontend widgets. Instead of modifying the original Blueprint widgets, we created duplicates in the `Content/Redwood/Frontend` folder to help us manage merging updates from Epic.

The starting game level should be the `Content/Redwood/Frontend/L_RW_LyraFrontEnd` level, which will create the `W_RW_LyraFrontEnd` widget via the modified `B_RW_LyraFrontEnd_Experience` frontend experience. The main `W_RW_LyraFrontEnd` widget then references and interacts with other modified widgets in the `Content/Redwood/Frontend` folder. Most of the changes are moving away from the Common OSS integration Lyra comes with in favor of using the Redwood SDK plugin directly. Redwood currently doesn't have an OSS (Online Subsystem) integration, but the plugin provides easy to use BP and C++ endpoints to interact with the backend.

## Game Mode/Map Assets

The Lyra project uses a `ULyraUserFacingExperienceDefinition` data asset to define experiences the player can choose. These coupled maps with game modes, which is applicable with the given maps, but we wanted to make sure Redwood was more flexible, allowing you to reuse maps for multiple game modes. These new `URedwoodGameModeAsset` and `URedwoodMapAsset` data assets are used in all Redwood projects, but we're calling them out here to let you know that the Lyra User Facing Experience data assets aren't used with Redwood.

You can read more about defining these assets [here](../configuration/game-modes-and-maps.md), but you can find the included assets at `Content/Redwood/DA_RW_*` which define 2 game modes and 2 maps.

## Reparented Classes

All Redwood games need to have their match game modes inherit from `ARedwoodGameModeBase` or `ARedwoodGameMode`. These classes inherit directly from the engine `AGameModeBase` and `AGameMode` classes respectively. This is necessary to initiate the connection with the [sidecar](../architecture/overview.md#sidecar) which acts like a proxy to the Realm Backend. These classes also handle player authentication and initial character data.

The Match template modifies `Plugins/ModularGameplayActors/Source/ModularGameplayActors/Public/ModularGameMode.h` and reparents those classes.

## Post-game teardown

Lyra has different phases (`LyraGamePhaseAbility`) which launch as the game mode moves through different phases. Primarily, there are `Phase_Warmup`, `Phase_Playing`, and `Phase_PostGame` Blueprints that define the functionality of these phases. Redwood duplicates the PostGame phase (see `/Plugins/GameFeatures/ShooterCore/Content/Redwood/Phase_RW_PostGame`) to determine whether the play another game with the current players or send the players back to the main screen and end the server.
