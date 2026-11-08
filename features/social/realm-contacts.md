---
sidebar_position: 2
---

# Realm Contacts

Realm Contacts are a way for a `PlayerCharacter` to favorite (or block) another `PlayerCharacter` in the same Realm. This can be useful if the player has a favorite character to trade with, or as an alternative to the [Friends](./friends.md) system that works with characters instead of player accounts.

How contacts differ from friends:

| | Friends | Realm Contacts |
| --- | --- | --- |
| Between | Player accounts (`PlayerIdentity`) | Characters (`PlayerCharacter`) |
| Stored in | The Director (shared by all realms) | The Realm (only within that realm) |
| Needs the other side to accept | Yes (a friend request) | No; it's a one-way list |
| Online state | Yes | No |

Contacts can also be used to block a target character, which also blocks [text chat DMs](./text-chat.md#blocking) from that character. Each contact can have a player-defined description (e.g. `Iron Buyer`); the API also returns the target character's actual name.

## Unreal

Contacts belong to the **selected character**, so the player must be connected to a realm and have called **Set Selected Character** (see [Building the Main Menu](../../getting-started/building-the-main-menu.md#4-pick-or-create-a-character)) first. They're available from the client subsystem (`URedwoodClientGameSubsystem`), both in the menu and while in game:

| Blueprint node | C++ | What it does |
| --- | --- | --- |
| **List Realm Contacts** | `ListRealmContacts(OnOutput)` | Returns an `FRedwoodListRealmContactsOutput` with `Contacts` and `BlockedContacts` arrays of `FRedwoodRealmContact` (`CharacterId`, `CharacterName`, and `Description`) |
| **Add Realm Contact** | `AddRealmContact(OtherCharacterId, bBlocked, OnOutput)` | Adds (or updates) a contact. Set `bBlocked` to `true` to block the character instead. |
| **Remove Realm Contact** | `RemoveRealmContact(OtherCharacterId, OnOutput)` | Removes the contact (and unblocks the character, if they were blocked) |

Contacts are identified by character **ID**. If the player types a character name, look it up first with **Get Character Data** (`GetCharacterData`), which accepts a character name (exact, case-insensitive) and returns the character's `Id` (without their private data).

:::caution Known issue (5.0.0)
The backend requires a `description` when adding a contact, but **Add Realm Contact** doesn't send one, so it currently fails with a validation error (`description is a required field`). **List Realm Contacts** and **Remove Realm Contact** work.
:::
