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

Redwood currently blob providers are:
- **Stub** - Used in development when running the [Dev Initiator](../../../getting-started/running-with-backend.md); this stores blobs as files on the local filesystem.
- **S3** - Used in [Kubernetes environnments](../../../deploying-to-kubernetes/prerequisites.md); you can use any S3-compatible API service, such as AWS S3 and DigitalOcean Spaces.

### Configuration

You can find the blob storage configuration located in the [Realm Instance Config](../../../configuration/realm-instance-config.md) under `persistence.blobs`. The `stub` provider is enabled by default when running the Dev Initiator, and `s3` is used by default when running in Kubernetes.

If you choose to use a different S3 provider than the included [SeaweedFS](#seaweedfs) (recommended in production), you will need to configure the various `persistence.blobs.s3` variables. See the default Realm Instance Config for more details on each of the available variables.

#### SeaweedFS

Redwood will deploy an S3 provider for you by default when running in Kubernetes. If you don't want to use blobs, make sure you set `persistence.blobs.provider` to `none` in your Realm Instance Config and `deployment.kubernetes.instances.<your k8s instance (i.e. k8s-default)>.dependencies.seaweedfs.enabled` to `false` to disable the feature altogether.

:::warning
It's **highly recommended** for you to use a managed S3 service like AWS S3, DigitalOcean Spaces, or Cloudflare R2 in production. SeaweedFS can be used in production, but ensure that it's properly configured and maintained.
:::
