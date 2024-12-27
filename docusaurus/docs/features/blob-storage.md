---
sidebar_position: 10
---

# Blob & Document Storage

Redwood supports traditional blob storage; blobs are just files/documents with any structure/format. If you want to simply persist USaveGames or any other larger files (i.e. larger images, documents, videos, etc.; think megabytes in size), this storage mechanism is better than using the database.

## Unreal Interface

There are a few easy-to-use functions in the `URedwoodServerGameSubsystem` to read/write data to the blob storage, including Blueprint-friendly latent nodes.

- `GetBlob` - Read a blob from storage; returns a byte array
- `PutBlob` - Write a blob to storage; takes a byte array
- `GetSaveGame` - Read a `USaveGame` from the storage
- `PutSaveGame` - Write a `USaveGame` to the storage

You don't have to do anything special with your SaveGame classes; they will be serialized and deserialized automatically.

## Providers

Redwood supports multiple blob storage providers; read more about them [here](../providers/blobs/overview.md).
