---
sidebar_position: 5
---

# GAS Integration

Redwood comes with a full persistence integration for Unreal's [Gameplay Ability System](https://dev.epicgames.com/documentation/unreal-engine/gameplay-ability-system-for-unreal-engine). It persists granted **UGameplayAbilities**, active **UGameplayEffects** (including their remaining duration and stack count), and **FGameplayAttributes**, storing them in the character's [`abilitySystem`](./player-data.md#abilitysystem) field.

## Setup

1. Enable the `RedwoodGAS` plugin (from the Redwood plugins download) in your project. It also enables Unreal's `GameplayAbilities` plugin.
1. If you're using C++, add `RedwoodGAS`, `GameplayAbilities`, `GameplayTags`, and `GameplayTasks` to your `*.Build.cs`.
1. Use `URedwoodAbilitySystemComponent` as your Ability System Component (ASC). If you have a custom `UAbilitySystemComponent` child class, change its parent class to `URedwoodAbilitySystemComponent`; otherwise, use `URedwoodAbilitySystemComponent` directly.
1. Put the ASC on your **Pawn** or your **Player State**. Those are the only supported owners, and either way the Player State must have a `URedwoodPlayerStateComponent` (part of the [standard setup](../../../getting-started/setting-up-unreal.md#player-state)).
1. **Enable replication on the ASC.** Unlike the engine's ASC, `URedwoodAbilitySystemComponent` isn't replicated by default. Call `SetIsReplicated(true)` and choose a replication mode (e.g. `Mixed`), as you normally would for GAS.
1. Create your Attribute Sets as default subobjects of the owning actor, so they already exist when Redwood restores attribute values.

:::warning
Don't also enable `bUseAbilitySystem` on the `URedwoodCharacterComponent`. That option is for custom (non-GAS) ability systems and writes to the same `abilitySystem` field.
:::

Saving and loading only happen on the server, through the same [persistence flow](./player-data.md#data-persistence) as the rest of the character's data.

:::info
Your game servers should have a synchronized UTC clock, which is handled by the OS. Popular OSes automatically synchronize their clock with an NTP server, so in most cases you don't need to do anything, but it's worth knowing in case you see odd behavior.

The game server uses `FDateTime::UtcNow().ToUnixTimestamp()` when saving and loading the ASC data to work out how long the player was offline (for periodic effects and remaining duration). Players may save on one server and load on a different one; if the clocks are significantly out of sync, players may notice irregular behavior.
:::

### Example character

Here's a minimal Character with a persisted ASC:

```cpp
// MyAbilityCharacter.h
#include "AbilitySystemInterface.h"
#include "RedwoodAbilitySystemComponent.h"
#include "MyAttributeSet.h"

UCLASS()
class AMyAbilityCharacter : public ACharacter, public IAbilitySystemInterface
{
  GENERATED_BODY()

public:
  AMyAbilityCharacter();

  virtual UAbilitySystemComponent* GetAbilitySystemComponent() const override
  {
    return AbilitySystem;
  }

protected:
  virtual void BeginPlay() override;

  UFUNCTION()
  void HandleControllerChanged(APawn* Pawn, AController* OldController, AController* NewController);

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
  URedwoodAbilitySystemComponent* AbilitySystem;

  UPROPERTY()
  UMyAttributeSet* Attributes;
};

// MyAbilityCharacter.cpp
AMyAbilityCharacter::AMyAbilityCharacter()
{
  AbilitySystem = CreateDefaultSubobject<URedwoodAbilitySystemComponent>(TEXT("AbilitySystem"));
  AbilitySystem->SetIsReplicated(true);
  AbilitySystem->SetReplicationMode(EGameplayEffectReplicationMode::Mixed);

  Attributes = CreateDefaultSubobject<UMyAttributeSet>(TEXT("Attributes"));
}

void AMyAbilityCharacter::BeginPlay()
{
  Super::BeginPlay();
  ReceiveControllerChangedDelegate.AddDynamic(this, &AMyAbilityCharacter::HandleControllerChanged);
}

void AMyAbilityCharacter::HandleControllerChanged(APawn* Pawn, AController* OldController, AController* NewController)
{
  AbilitySystem->InitAbilityActorInfo(this, this);
  SetOwner(NewController); // Mixed replication needs the owner chain to reach the controller
}
```

To see it working, create a Gameplay Effect with a **Duration** of 30 seconds and a **Period** of 1 second that adds `1` to one of your attributes. Apply it to yourself on the server, leave the server partway through, wait a bit, and join again. The effect is restored with the correct remaining time, and the attribute reflects the periods that elapsed while you were offline (see [offline behavior](#controlling-offline-behavior-of-gameplay-effect) to change that).

## Triggering Saving

You can call `URedwoodAbilitySystemComponent::MarkDirty()` to queue a save for the next save interval, but the ASC already calls it automatically when:
- A Gameplay Effect is applied
- A Gameplay Effect is removed
- A Gameplay Effect's stack count changes
- A Gameplay Ability is given
- A Gameplay Ability is removed

:::info
We currently don't automatically call `MarkDirty()` when attributes change. We're still evaluating whether this is viable, valuable, and not excessive. Let us know if you have an opinion on the matter! In the meantime, call `MarkDirty()` yourself after attribute changes you want saved.
:::

:::warning
Saved effects and abilities are restored by class path. If you rename or delete a Gameplay Effect or Gameplay Ability class that players have saved, add a [Core Redirect](https://dev.epicgames.com/documentation/unreal-engine/core-redirects-in-unreal-engine) for it (or exclude it from persistence), otherwise loading that character can fail.

Also watch out for abilities you grant by default when a character spawns: persisted abilities are granted again on load, so either exclude your default abilities from persistence (see below) or only grant them when the character doesn't already have them.
:::

## Blacklists & Whitelists

You can configure the ASC to include/exclude Abilities, Effects, and Attributes.

Each of these has a `<Type>InclusionMode` property on `URedwoodAbilitySystemComponent` (`AbilityInclusionMode`, `EffectInclusionMode`, and `AttributeInclusionMode`), which can be `ERedwoodASCInclusionMode::Blacklist` (the default) or `ERedwoodASCInclusionMode::Whitelist`.

Based on the `<Type>InclusionMode` setting, the corresponding `<Type>InclusionArray` is treated as a blacklist or whitelist respectively. These arrays are empty by default, and given the default blacklist setting, everything is persisted by default. Classes are matched exactly (subclasses of a listed class aren't matched).

:::note
The inclusion settings are only applied when saving. When loading, the saved values are applied regardless of the inclusion settings.
:::

## Controlling Offline Behavior of Gameplay Effect

We've added two `UGameplayEffectComponent` classes to help you control what happens to specific `UGameplayEffect` classes while the player is offline. Add them to the effect's **Components** list.

### URedwoodKeepRemainingTimeGameplayEffectComponent

By adding this component, Redwood persists the remaining time of this effect as if no time passed while the player was offline. **Adding this component also implies [skipping offline periods](#uredwoodskipofflineperiodsgameplayeffectcomponent)**.

In the editor UI, this component shows up as **Redwood: Keep Remaining Time**.

For example:

- Without this component, if this effect is persisted with 1.5 hours left, the player logs out, 2 hours pass, and the player logs back in, the effect will no longer be active.
- With this component, if this effect is persisted with 1.5 hours left, the player logs out, 2 hours pass, and the player logs back in, the effect will be active for another 1.5 hours.

### URedwoodSkipOfflinePeriodsGameplayEffectComponent

By adding this component, Redwood skips executing the effect's periods for the time the player was offline. **You don't need to add this component if you already added URedwoodKeepRemainingTimeGameplayEffectComponent**.

In the editor UI, this component shows up as **Redwood: Skip Offline Periods**.

For example:

- Without this component, if this effect has a period of 1 minute, the player logs out, 3.5 minutes pass, and the player logs back in, the effect will execute 3 times immediately.
- With this component, if this effect has a period of 1 minute, the player logs out, 3.5 minutes pass, and the player logs back in, the effect will execute 0 times immediately.

## Save Frequency

By default, the Redwood ASC is saved as frequently as other persisted data (every **0.5 seconds** if there are changes, set by `DatabasePersistenceInterval` on your `ARedwoodGameMode` or `ARedwoodGameModeBase`). Since GAS data may change very frequently, the ASC has an `UpdateIntervals` property meant to save less often: it's a multiplier of `DatabasePersistenceInterval`. For example, with a `DatabasePersistenceInterval` of `0.5` seconds and `UpdateIntervals` set to `3`, the ASC would save at most every `1.5` seconds. Keeping it at `0` adds no extra delay.

:::caution Known issue (5.0.0)
`UpdateIntervals` only delays saves after a period with no changes; an ASC that changes constantly (e.g. from a long-running periodic effect) is still saved every `DatabasePersistenceInterval`. If you need to reduce GAS save traffic, increase `DatabasePersistenceInterval` instead.
:::
