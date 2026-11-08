---
sidebar_position: 8
---

# Saving Player Data

Players expect their progress to be there when they come back. Redwood stores each character's data in the realm's database and loads it onto the server whenever the character joins, so the same data follows them across matches, zones, shards, and server restarts.

This page sets up the recommended approach: the **Redwood Character Component**, which syncs a set of your own structs to and from the database. The [Player Data](../features/data/game/player-data.md) feature page goes deeper on each field, migrations, and alternatives.

The examples are in C++, but everything here works the same with Blueprint structs, variables, and functions on a Blueprint Pawn.

## How It Works

Each character (`PlayerCharacter` in the database) has a handful of JSON fields. You decide what goes in each one by defining a struct for it:

| Field | Variable name | Enabled by default | Typical contents | Typically replicated to |
| --- | --- | --- | --- | --- |
| `characterCreatorData` | `CharacterCreatorData` | Yes | Appearance and choices from your character creator (players can change this, so never trust it) | Everyone |
| `metadata` | `Metadata` | Yes | Server-managed public info: level, health, equipped gear visuals | Everyone |
| `equippedInventory` | `EquippedInventory` | Yes | What the character is carrying | Owner only |
| `nonequippedInventory` | `NonequippedInventory` | Yes | What the character has stored (e.g. a bank) | Owner only |
| `progress` | `Progress` | No | Quests, achievements, unlocks, skill trees | Your call |
| `data` | `Data` | Yes | Anything else private: settings, bookmarks, cooldowns | Owner only |
| `abilitySystem` | `AbilitySystem` | No | Custom ability system state (use the [GAS integration](../features/data/game/gas.md) if you use GAS) | Your call |

On the server:

1. When a player joins, Redwood loads their character's data and copies each enabled field into the matching struct variable on their Pawn.
1. When your gameplay code changes one of those variables, you call `Mark<Field>Dirty()` (e.g. `MarkMetadataDirty()`).
1. Every `DatabasePersistenceInterval` seconds (0.5 by default, set on your Redwood game mode), Redwood saves all dirty fields along with the character's current location. It also saves any remaining dirty fields when the player leaves.

Redwood doesn't care what's inside your structs; it just serializes them to JSON. That means you can change them freely during development, and use [migrations](../features/data/game/player-data.md#changing-the-structures) once you have live players.

## 1. Create the Structs

Create a `USTRUCT` for each field you want to use. Every struct **must** have an integer property named `SchemaVersion` with a default of `0`; Redwood uses it to know which version of your struct the saved data is in.

```cpp
USTRUCT(BlueprintType)
struct FCharacterMetadata
{
  GENERATED_BODY()

  UPROPERTY(EditAnywhere, BlueprintReadWrite)
  int32 SchemaVersion = 0;

  UPROPERTY(EditAnywhere, BlueprintReadWrite)
  int32 Level = 1;

  UPROPERTY(EditAnywhere, BlueprintReadWrite)
  int32 Experience = 0;
};
```

Only `UPROPERTY` fields are saved. Pointers and object references can't be serialized and are ignored.

You can reuse one struct type for several fields (e.g. the same inventory struct for `EquippedInventory` and `NonequippedInventory`). If you don't need a field yet, you don't need a struct for it; you'll turn it off in the next step.

## 2. Add the Component and Variables

1. Add a `URedwoodCharacterComponent` to your Pawn or Character class.
1. For each field you **don't** use, set its `bUse<Field>` property to `false` (e.g. `bUseEquippedInventory`). Five fields are enabled by default: `CharacterCreatorData`, `Metadata`, `EquippedInventory`, `NonequippedInventory`, and `Data`.
1. On the Pawn (not the component), add a `UPROPERTY` for each field you **do** use, named exactly after the field (`CharacterCreatorData`, `Metadata`, `EquippedInventory`, `NonequippedInventory`, `Progress`, `Data`, or `AbilitySystem`), with your struct as its type. Redwood finds these by name through reflection, so they must be `UPROPERTY`s.

```cpp
// MyCharacter.h
#include "RedwoodCharacterComponent.h"

UCLASS()
class AMyCharacter : public ACharacter
{
  GENERATED_BODY()

public:
  AMyCharacter();

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
  URedwoodCharacterComponent* RedwoodCharacter;

  UPROPERTY(BlueprintReadWrite)
  FMyCharacterCreatorData CharacterCreatorData;

  UPROPERTY(BlueprintReadWrite)
  FCharacterMetadata Metadata;

  UPROPERTY(BlueprintReadWrite)
  FCharacterData Data;
};

// MyCharacter.cpp
AMyCharacter::AMyCharacter()
{
  RedwoodCharacter = CreateDefaultSubobject<URedwoodCharacterComponent>(TEXT("RedwoodCharacter"));

  // This example doesn't use inventories yet
  RedwoodCharacter->bUseEquippedInventory = false;
  RedwoodCharacter->bUseNonequippedInventory = false;
}
```

:::warning
Every enabled field needs its variable. If one is missing (or isn't a struct, or its struct has no `SchemaVersion`), Redwood can't load the character and **kicks the player** with "Could not load player character data". Check the server log for which variable it couldn't find.
:::

You can rename the variables Redwood looks for with the component's `<Field>VariableName` properties (e.g. `MetadataVariableName`). If you'd rather keep the variables on the component than on the Pawn, subclass the component, add the variables there, and set `bStoreDataInActor` to `false`.

:::note Characters that aren't Pawns
The component is designed to live on your Pawn, since that's what's relevant to nearby players. If you can't use the Pawn (e.g. players swap between several Pawns), you can put it on your Player State instead, next to the `URedwoodPlayerStateComponent`. In that case, set `bStoreDataInActor` to `false` and put the variables on a subclass of the component.
:::

## 3. Replicate the Variables

Redwood loads the data on the server; it doesn't replicate it for you. Mark each variable as replicated if clients need it, and make private fields owner-only so other players can't see (or mod their client to show) someone else's inventory:

```cpp
// MyCharacter.h
UPROPERTY(Replicated, BlueprintReadWrite)
FMyCharacterCreatorData CharacterCreatorData;

UPROPERTY(ReplicatedUsing = OnRep_Metadata, BlueprintReadWrite)
FCharacterMetadata Metadata;

UPROPERTY(Replicated, BlueprintReadWrite)
FCharacterData Data;

UFUNCTION()
void OnRep_Metadata(); // e.g. update the level shown over the player's head

// MyCharacter.cpp
#include "Net/UnrealNetwork.h"

void AMyCharacter::GetLifetimeReplicatedProps(
  TArray<FLifetimeProperty>& OutLifetimeProps) const
{
  Super::GetLifetimeReplicatedProps(OutLifetimeProps);
  DOREPLIFETIME(AMyCharacter, CharacterCreatorData);
  DOREPLIFETIME(AMyCharacter, Metadata);
  DOREPLIFETIME_CONDITION(AMyCharacter, Data, COND_OwnerOnly);
}
```

Use `COND_OwnerOnly` for `EquippedInventory`, `NonequippedInventory`, and `Data`.

To react when the data loads, bind the component's `OnRedwoodCharacterUpdated` event. It fires on the server after the data is applied and is also multicast to clients.

## 4. Save Changes

Whenever server code changes one of the variables, mark it dirty on the server:

```cpp
void AMyCharacter::AwardExperience(int32 Amount)
{
  check(HasAuthority());
  Metadata.Experience += Amount;
  RedwoodCharacter->MarkMetadataDirty();
}
```

There's a `Mark<Field>Dirty()` function for each field.

Redwood doesn't detect changes on its own, so if you forget to mark a field dirty, that change isn't saved at all (not even when the player leaves).

:::tip Choosing a save interval
`DatabasePersistenceInterval` on your Redwood game mode is the most data you could lose if a server crashes. Smaller is safer but means more database writes; Redwood saves each player's last location on every interval, so with many players you may want something like `5` seconds. Setting it to `0` disables periodic saves entirely (dirty data is then only saved when players leave).
:::

## 5. Initialize New Characters

A new character's fields start out empty. The first time it joins a server, Redwood fills each enabled field with your struct's default values and saves them, so the defaults in your struct are your new character's starting state (e.g. `Level = 1`).

If you need logic for that (e.g. starting gear based on the class picked in the character creator), add a `UFUNCTION()` to your Pawn named `<VariableName>_Creation` (e.g. `Metadata_Creation`) with no parameters and no return value. Redwood finds it by name and calls it right after applying the defaults, and you can modify the variable inside it.

```cpp
UFUNCTION()
void Metadata_Creation()
{
  Metadata.Level = 1;
  // e.g. starting stats based on the class in CharacterCreatorData
}
```

## 6. Try It

1. Start the Dev Initiator with `environment.clean-db-on-dev-initiator-start: false` (see [Running with the Backend](./running-with-backend.md#launching-the-backend)) so your data survives restarts.
1. Join a server, do something that changes your data and marks it dirty, and leave.
1. Join again. Your data (and location, for persistent worlds) should be restored.

## Beyond Character Data

Character data covers most games' needs, but Redwood has a few more places to keep data:

| Data | Use it for | Docs |
| --- | --- | --- |
| World data | State shared by every server of a GameServerProxy (e.g. a world event or day/night cycle) | [World Data](../features/data/game/world-data.md) |
| Zone data | State for a single zone of a world | [Zone Data](../features/data/game/zone-data.md) |
| Sync Items | Actors whose state is synchronized between servers and optionally saved (e.g. player-built structures or community chests) | [Sync Items](../features/sync-items.md) |
| Global data | Read-only config for clients (e.g. a message of the day) | [Global Data](../features/data/game/global-data.md) |
| Blob storage | Arbitrary files, like a `SaveGame` | [Blob Storage](../features/data/storage/blob-storage.md) |

:::success
Your characters now persist! Next, let's speed up iteration by **[running without the backend](./running-without-backend.md)**.
:::
