# Game Data

Redwood provides several kinds of auto-synced game data. The included Unreal plugins receive the JSON data from the backend and deserialize it into your Blueprint or C++ structs (and serialize it back when you save).

| Data | Scope | Docs |
| --- | --- | --- |
| Player data | Each player character (stats, inventory, progress, location) | [Player Data](./player-data.md) |
| World data | Every server in a GameServerProxy | [World Data](./world-data.md) |
| Zone data | Every server in one zone of a GameServerProxy | [Zone Data](./zone-data.md) |
| Global data | Read-only data for a whole realm or the Director | [Global Data](./global-data.md) |
| Ability System | Gameplay Ability System state for each character | [GAS Integration](./gas.md) |

For actors that should be synchronized between servers (and optionally saved), see [Sync Items](../../sync-items.md).

Redwood also supports generic [blob/document storage](../storage/blob-storage.md) if you're interested in storing images, PDFs, SaveGames, etc.
