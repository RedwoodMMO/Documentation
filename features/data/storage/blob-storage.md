# Blob & Document Storage

Redwood supports traditional blob storage; blobs are just files/documents with any structure/format. If you want to simply persist USaveGames or any other larger files (i.e. larger images, documents, videos, etc.), this storage mechanism is a better fit than the database.

## Unreal Interface

There are a few easy-to-use functions in the `URedwoodServerGameSubsystem` to read/write data to the blob storage, including Blueprint-friendly async nodes (**Get Blob**, **Put Blob**, **Get SaveGame**, and **Put SaveGame**):

- `GetBlob` - Read a blob from storage; returns a byte array
- `PutBlob` - Write a blob to storage; takes a byte array
- `GetSaveGame` - Read a `USaveGame` from the storage
- `PutSaveGame` - Write a `USaveGame` to the storage

You don't have to do anything special with your SaveGame classes; they're serialized and deserialized automatically.

Each blob is identified by a key you choose (e.g. `characters/<character-id>/journal.sav`). Keys can contain letters, numbers, `_`, `-`, `.`, and `/`.

:::note
These functions are **server-only**; they go through the game server's [sidecar](../../../architecture/overview.md#sidecar), so clients can't read or write blobs directly. If clients need the data, send it to them through replication or RPCs.
:::

:::caution Known issue (5.0.0)
The blob functions require the backend. Calling them in PIE with **Use Backend in PIE** disabled (see [Running without the Backend](../../../getting-started/running-without-backend.md)) can crash the editor, so guard those calls with `URedwoodCommonGameSubsystem::ShouldUseBackend`.
:::

## Providers

Redwood's blob providers are:
- **Stub** - Used in development when running the [Dev Initiator](../../../getting-started/running-with-backend.md); this stores blobs as files on the local filesystem (in `./blobs/` inside the backend folder by default).
- **S3** - Used in [Kubernetes environments](../../../deploying-to-kubernetes/prerequisites.md); you can use any S3-compatible API service, such as AWS S3, DigitalOcean Spaces, or Cloudflare R2.
- **None** - Disables blob storage; blob requests fail with "Blobs are not enabled".

### Configuration

The blob storage configuration is in the [Realm Instance Config](../../../configuration/realm-instance-config.md) under `persistence.blobs` (see the [realm config reference](../../../configuration/reference/realm.md) for every variable). The `stub` provider is the default when running the Dev Initiator, and the `kubernetes` config environment switches it to `s3`.

| Variable | Default | Meaning |
| --- | --- | --- |
| `persistence.blobs.provider` | `stub` | `none`, `stub`, or `s3` |
| `persistence.blobs.max-key-bytes` | `255` | Maximum length of a blob key; longer keys are rejected |
| `persistence.blobs.max-blob-bytes` | `10485760` (10 MiB) | Maximum size of a single blob; larger writes are rejected |
| `persistence.blobs.stub.base-dir` | `./blobs/` | Where the `stub` provider stores files (relative to the backend folder) |
| `persistence.blobs.s3.bucket` | `mybucket` | The S3 bucket |
| `persistence.blobs.s3.connection.*` | the in-cluster SeaweedFS | `endpoint`, `region`, `force-path-style`, and `credentials` (`access-key-id` and `secret-access-key`, which support the [secrets system](../../secrets/overview.md)) |

If you choose to use a different S3 provider than the included [SeaweedFS](#seaweedfs) (recommended in production), you'll need to configure the `persistence.blobs.s3` variables.

:::warning
Blob keys are written at the root of the bucket. If several realms share a bucket, include something unique to the realm in your keys (or give each realm its own bucket) so they don't overwrite each other.
:::

#### SeaweedFS

Redwood deploys an S3 provider ([SeaweedFS](https://github.com/seaweedfs/seaweedfs)) for you by default when running in Kubernetes. If you don't want to use blobs, set `persistence.blobs.provider` to `none` in your Realm Instance Config and `deployment.kubernetes.instances.<your k8s instance (i.e. k8s-default)>.dependencies.seaweedfs.enabled` to `false` to disable the feature altogether.

:::warning
It's **highly recommended** to use a managed S3 service like AWS S3, DigitalOcean Spaces, or Cloudflare R2 in production. SeaweedFS can be used in production, but ensure that it's properly configured and maintained.
:::
