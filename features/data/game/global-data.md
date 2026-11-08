---
sidebar_position: 4
---

# Global Data

Global Data is a way to have game data at a level higher than GameServerProxies, such as a message of the day, live event settings, or tuning values you want to change without a new build.
- The Director and each Realm have their own Global Data object.
- This object is versioned along with a description.
- Each version can be archived by system admins (`PlayerIdentity.role == 100`).
- System admins can get a history of the versions of data.
- Anyone can get the most recent non-archived version.

## Administration

There are API methods for admins to get, list, create, and archive versions; admins call these on the Director Frontend or Realm Frontend respectively:

**Director:**

- `director:global-data:get:latest`
- `director:global-data:get:history`
- `director:global-data:create`
- `director:global-data:archive`

**Realm:**

- `realm:global-data:get:latest`
- `realm:global-data:get:history`
- `realm:global-data:create`
- `realm:global-data:archive`

:::warning
There are currently no Unreal plugin functions or CLI commands for the admin methods; neither is a great fit for editing JSON. In the meantime, you can implement your own [CLI](../../cli.md) commands (see `packages/cli/src/commands` in the backend for reference, which connect and log in as the admin user) or manually insert rows into the database.
:::

## Unreal Functions

The Unreal plugin has `URedwoodClientGameSubsystem::GetDirectorGlobalData` and `URedwoodClientGameSubsystem::GetRealmGlobalData` (and the **Get Director Global Data** and **Get Realm Global Data** async nodes) for clients to fetch the latest non-archived version.

You'll get a `USIOJsonObject` with the JSON data that you'll need to deserialize. The `SIOJson` module (part of the `SocketIOClient` plugin that ships with Redwood) has several utility functions in `SIOJLibrary.h` and `SIOJsonObject.h`, including **Json Object to Struct** (`USIOJLibrary::JsonObjectToStruct`) to deserialize it into a matching `USTRUCT` or Blueprint struct.

:::caution Known issue (5.0.0)
The **Get Director Global Data** and **Get Realm Global Data** functions don't send the required request payload, so they never receive a response (the async nodes never fire). Until this is fixed, Global Data can't be fetched from the Unreal plugin.
:::
