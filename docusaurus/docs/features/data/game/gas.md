---
sidebar_position: 5
---

# GAS Integration

Redwood comes with a full persistence integration for Unreal's [Gameplay Ability System](https://dev.epicgames.com/documentation/unreal-engine/gameplay-ability-system-for-unreal-engine). This is useful for persisting granted **UGameplayAbilities**, active **UGameplayEffects**, and **FGameplayAttributes**.

## Setup

1. Enable the [`RedwoodGAS` plugin](https://github.com/RedwoodMMO/RedwoodPlugins/tree/main/RedwoodGAS) in your project
1. Add the `RedwoodGAS` module to your `*.Build.cs` if you're using it in C++
1. If you have a custom `UAbilitySystemComponent` child class, change its parent class to `URedwoodAbilitySystemComponent`. If you're using the base class, change your ASC's class to `URedwoodAbilitySystemComponent`.

:::info
Your different game servers should run on servers that have a synchronized UTC clock, which handled by the OS. Popular OS's will automatically synchronize their clock with a popular NTP server. In most cases, you shouldn't need to do anything to make sure this happens, but it should be noted in case you see odd issues.

The game server will use `FDateTime::UtcNow().ToUnixTimestamp()` during save/load of the ASC data for GameplayEffects to synchronize periodic effects and remaining duration. Players may save on one server and load on a different one; if the clocks are significantly desynced, players may noticed irregular behavior.
:::

## RPG Template

The RPG Template (as of 4.0) has a very rudimentary GAS implementation to demonstrate the GAS persistence.

1. Once you're in a game server, you can open the debugging overlay with the `\`` key
1. Press the `Numpad 3` key (not the normal 3) to show GAS information
1. You can press the normal `3` key to have the server apply the `Content/GAS/GE_Test` GameplayEffect to yourself
1. This effect will increment the `BaseAttributeSet.Time` attribute every second for 30 seconds
1. You can leave the server and come back to see the GAS system working (e.g. apply the effect, leave, wait some time, come back in, find that the effect is auto applied and started at the expected time as if you never left, and finishes at 30)

## Triggering Saving

You can call `URedwoodAbilitySystemComponent::MarkDirty()` to queue a save for the next save interval, but note that the ASC already automatically calls this function during these events:
- GameplayEffect applied
- GameplayEffect removed
- GameplayAbility given
- GameplayAbility removed

:::info
We currently don't automatically call `MarkDirty()` when any of the attributes change. We're still evaluating whether this is viable, valuable, and not excessive. Let us know if you have an opinion on the matter!
:::

## Blacklists & Whitelists

You can configure the ASC to include/exclude Abilities, Effects, and Attributes.

Each of these has a `<Type>InclusionMode` variable on `URedwoodAbilitySystemComponent` which can be `ERedwoodASCInclusionMode::Blacklist` (the default) or `ERedwoodASCInclusionMode::Whitelist`.

Based on the `<Type>InclusionMode` setting, the corresponding `<Type>InclusionArray` will be treated as a blacklist or whitelist respectively. These arrays are empty by default, and given the default blacklist setting, this means all classes will be persisted by default.

:::note
The inclusion settings are only applied during saving. During loading, the DB values are applied regardless of the inclusion settings.
:::

## Controlling Offline Behavior of Gameplay Effect

We've added two `UGameplayEffectComponent` classes to help you control the behavior of specific `UGameplayEffect` classes when the player is offline.

### URedwoodKeepRemainingTimeGameplayEffectComponent

By adding this component, Redwood will persist the remaining time of this effect as if no time passed. **Adding this component also implies [skipping offline periods](#uredwoodskipofflineperiodsgameplayeffectcomponent)**.

In the editor UI, this component shows up as **Redwood: Keep Remaining Time**.

For example:

- By not adding this component, if this effect gets persisted with 1.5 hours left, player logs out, 2 hours pass, and player logs back in, the effect will no longer be active.
- By adding this component, if this effect gets persisted with 1.5 hours left, player logs out, 2 hours pass, and player logs back in, the effect will will be active for another 1.5 hours.

### URedwoodSkipOfflinePeriodsGameplayEffectComponent

By adding this component, Redwood will skip executing periodic when the player logs back in for the simulated missed real time. **You do not need to add this component if you're already adding URedwoodKeepRemainingTimeGameplayEffectComponent**.

In the editor UI, this component shows up as **Redwood: Skip Offline Periods**.

For example:

- By not adding this component, if this effect has a period of 1 minute, the player logs out, 3.5 minutes pass, and player logs back in, the effect will be executed 3 times immediately.
- By not adding this component, if this effect has a period of 1 minute, the player logs out, 3.5 minutes pass, and player logs back in, the effect will be executed 0 times immediately.

## Save Frequency

By default, the Redwood ASC will persist as frequently as other persisted data (defaults to every **0.5 seconds** if there are changes, specified in `URedwoodGameMode(Base)::DatabasePersistenceInterval`). Since GAS data may change very frequently, you may configured the ASC to update less frequent by changing `URedwoodAbilitySystemComponent::UpdateIntervals` to a positive integer. This is a multiplier of the value specified in `URedwoodGameMode(Base)::DatabasePersistenceInterval`.

For example, if you have a `URedwoodGameMode(Base)::DatabasePersistenceInterval` of `0.5` seconds and you set this variable to `3`, this ASC will persist every `1.5` seconds (if there are changes). Keeping this set to `0` will not add any extra delays.
