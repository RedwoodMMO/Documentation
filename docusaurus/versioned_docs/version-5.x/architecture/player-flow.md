---
sidebar_position: 3
---

# Player Flow

This is what a typical player flow might look like from launching the game client to getting into a game session.

1. Automatically connects the client to the Redwood Director Frontend service (using SocketIO)
1. Player registers an account (Director Frontend, saves data to the Director database)
1. Player logs into their account (Director Frontend, fetches data from the Director database)
1. Player requests for a list of Realms and chooses one to connect to by sending a message to the Director Frontend. The Director then sends a token to both the Realm and the player so the player can connect to the Realm without reauthenticating. The player then opens a new SocketIO connection with the selected Realm Frontend.
1. Player creates a character (Realm Frontend, saved to the Realm database; with customizable, non-structured character data [e.g. `name`])
1. Player can edit a character's data (Realm Frontend, fetched from the Realm database)
1. Player creates a matchmaking ticket to request to join a match (this ticket is created by the Realm Frontend, but that ticket gets registered by the Match Function and the Realm Backend for processing)
1. Updates on the player's ticket are sent to the player (the Realm Backend sends a message over Redis for the Realm Frontend which then forwards it to the player)
1. When the match is found, the Unreal widget itself handles that update to run the `open <server string>` console command with additional parameters for the server to verify authenticity of the incoming player (the Realm Backend creates a token for the Realm Frontend to send to the player; this token is saved to the Realm database)
1. When the Unreal game server gets the player's login attempt, it sends that token to the Sidecar, which requests the Realm Backend if the token is valid for the given player identity/character. If it's valid the Realm Backend also sends the player character's data and invalidates the token to prevent replay attacks.
1. The player client gets all of the data from replication in Unreal, including their own character data. It's safe to assume that, by default, all of the data the client receives after joining an Unreal game session comes from replication rather than from the Redwood backend.

    :::note
    Some future or DIY Redwood backend features like a global marketplace and global chat might have the client get the information directly from the Redwood backend. However, try to see if it makes sense (both from an architecture and performance perspective) to do have this data go through the Realm Backend>Sidecar>game server>replication path as it can help with development by using stubbed data without connecting to an actual Redwood backend.
    :::
