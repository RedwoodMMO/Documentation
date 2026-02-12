---
sidebar_position: 4
---

# Global Data

Global Data is a method to have game data at a level higher than GameServerProxies.
- The Director and each Realm has its own Global Data object.
- This object is versioned along with a description.
- Each version is archivable by system admins (`PlayerIdentity.role == 100`).
- System admins can get a history of the versions of data.
- Anyone can get the most recent non-archived version.

## Administration

There are API methods for admins to list, create, and archive versions; the admin can call these on the Director or Realm Frontend services respectively:

**Director:**

- `director:global-data:get:latest`
- `director:global-data:get:history`
- `director:global-data:create`

**Realm:**

- `realm:global-data:get:latest`
- `realm:global-data:get:history`
- `realm:global-data:create`

:::warning
There are no Unreal plugin methods or CLI commands that expose these API methods. Neither of these interfaces/use cases really make a ton of sense. Ideally these would be exposed in an admin dashboard that provides a JSON editor (this is [on the roadmap](https://github.com/orgs/RedwoodMMO/projects/1/views/1?filterQuery=admin+dashboard)).

In the meantime, you can implement your own CLI commands (see `packages/cli/src/commands` for reference), manually insert rows into the database.
:::

## Unreal Functions

The Unreal plugin comes `URedwoodClientGameSubsystem::GetDirectorGlobalData` and `URedwoodClientGameSubsystem::GetRealmGlobalData` for anyone to fetch the latest non-archived global data version.

You will get `USIOJsonObject` objects for the JSON data; you will need to manually deserialize it. There are several utility functions (see `RedwoodPlugins/ThirdParty/SocketIOClient/Source/SIOJson/Public` in `SIOJLibrary.h` and `SIOJsonObject.h`) including a `JsonObjectToStruct` C++ and BP function to deserialize into a matching Unreal `USTRUCT`.
