---
slug: 2_0_0-released
title: Version 2.0.0 Released
authors: [mike]
tags: [release, news]
---

:::note
The backend didn't change except for the version number; we've updated the zip regardless.
:::

## `ARedwoodCharacter` has been replaced with `URedwoodCharacterComponent`

This **breaking change** changes how player character data is set up. Long story short, to support pawns that inherit from `APawn` instead of `ACharacter`, the data persistence happens in an Actor Component instead of an Actor. This supports using Redwood with the UE Mover plugin, the marketplace GMCv2 plugin, and other scenarios that don't use `UCharacterMovementComponent`.

See the [GitHub release notes](https://github.com/RedwoodMMO/RedwoodPlugins/releases/tag/2.0.0) or click **Read More** below.

<!-- truncate -->

You can attach this component to any pawn that inherits directly or indirectly from `APawn`. By default, the data for the character is stored in the pawn actor class, but you can create a child class of `URedwoodCharacterComponent` and store the data in the component by disabling `URedwoodCharacterComponent::bStoreDataInActor`.

The **RPG Template** has been updated with these changes and is a great example to reference how to set things up; the [associated docs](https://redwoodmmo.com/docs/features/player-data#unreal-setup) have also been updated.