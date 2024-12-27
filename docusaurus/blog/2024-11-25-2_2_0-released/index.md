---
slug: 2_2_0-released
title: Version 2.2.0 Released
date: 2024-11-25T10:23
authors: [mike]
tags: [release, news]
---

There were several changes in this release, including support for UE 5.5.

See the [GitHub release notes](https://github.com/RedwoodMMO/RedwoodPlugins/releases/tag/2.2.0) or click **Read More** below for details.

<!-- truncate -->

## Unreal plugin changes

- Added functions for Blob/SaveGame support
- Fixed issue with Instanced Dungeons not being able to return to the overworld
- Removed "EngineVersion" from uplugins (including dependencies) to support future engine versions

## Unreal gameplay template changes

- **Blank**:
	- Changed `DefaultBuildSettings` and `IncludeOrderVersion` to use their respective `Latest` settings in each `Source/*.Target.cs` files to support future engine versions
- **Match**:
	- Changed `DefaultBuildSettings` and `IncludeOrderVersion` to use their respective `Latest` settings in each `Source/*.Target.cs` files to support future engine versions
- **RPG**
	- Changed `DefaultBuildSettings` and `IncludeOrderVersion` to use their respective `Latest` settings in each `Source/*.Target.cs` files to support future engine versions
	- Added some environment for the instanced dungeon instead of the default level
	- Fixed issue with Instanced Dungeons not being able to return to the overworld
	- We accidentally included `Content/Developers/seese` which can be deleted (will be removed in the next release)

## Backend changes

- Fixed logging verbosity when you enable `logging.log-file.enabled`
- Added support for [blob storage](https://redwoodmmo.com/docs/features/blob-storage)
- Added an opt-out Kubernetes dependency SeaweedFS which provides S3 storage; read more [here](https://redwoodmmo.com/docs/providers/blobs/overview#seaweedfs)
- Initial implementation of custom probes for Kubernetes health checks
- Fixed issue with Instanced Dungeons not being able to return to the overworld

## Misc changes

[World Data](https://redwoodmmo.com/docs/features/world-data) and [Persistent Items](https://redwoodmmo.com/docs/features/persistent-items) now have docs and are officially released!

We did an initial license check of the backend and verified that all dependencies have a license that allows commercial use without needing to disclose source. Many of the licenses do require license discloser/disclaimer, which we'll be adding in the next release. In the meantime, the licenses used by the dependencies include:

  "MIT",
  "Apache-2.0",
  "ISC",
  "BSD-3-Clause",
  "BSD-2-Clause",
  "0BSD",
  "Unlicense",
  "BlueOak-1.0.0",
  "CC-BY-4.0",
  "CC-BY-3.0",
  "CC0-1.0",
  "Python-2.0",
