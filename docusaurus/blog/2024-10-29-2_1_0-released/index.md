---
slug: 2_1_0-released
title: Version 2.1.0 Released
authors: [mike]
tags: [release, news]
---

There were several changes in this release, including improvements to the Unreal plugin, the Kubernetes deployments, and the backend.

See the [GitHub release notes](https://github.com/RedwoodMMO/RedwoodPlugins/releases/tag/2.1.0) or click **Read More** below for details.

<!-- truncate -->

## Unreal plugin changes

- Adding an optional boolean to disable any of the `URedwoodCharacterComponent` persistence fields

## Unreal gameplay template changes

- **Blank**: No changes
- **Match**: No changes
- **RPG**
	- We removed `Content/Core/PersistentItems/Fence/B_FencePeristence` because it was no longer being used
	- We fixed the Packaging Settings in Project Settings to include the various RPG maps (it was still the same as the Blank template), see `Config/DefaultGame.ini`

## Generic backend changes

- Fixed an issue where some Powershell environments couldn't properly run `yarn` or `yarn install` (resulting in an error related to not finding modules `@redwoodmmo/*-db`)
- Changes the `yarn start:<service>` and `yarn debug:<service>` commands which you don't directly use to a single `yarn start [--debug] <service>` command; mainly just helps out my maintainability

## Kubernetes deployments changes

### Determined root cause for issues with using Agones with Rancher Desktop

We discovered issues with versions 1.15+ of Rancher Desktop that broke networking/connectivity functionality of Agones game servers. This is the default game server provider when you deploy to Kubernetes, locally or in the cloud.

Long story short, we're currently trying to prepare a forked release; in the meantime, we recommend waiting to release to Rancher Desktop. Other Kubernetes deployments remain unaffected. There _is_ an option for you to use version `1.14.2` of Rancher Desktop which has significant memory leak issues, but if you're so inclined to deal with those you can follow the [instructions on our docs](https://redwoodmmo.com/docs/deploying-to-kubernetes/prerequisites#rancher-desktop) to downgrade and set up 1.14.2 to use with Agones.

### Other Kubernetes changes

- Improved docker image cache sizes to save on disk space (only applicable for `kubernetes` deployments)
- Reduced the number of built docker images from 7 to 3, so most of the Redwood services share a single `core-runner` image (only applicable for `kubernetes` deployments, unless you have source code access, then it's only applicable for `staging` and `production` deployments). This also reduces disk sizes, but it operationally seems to make more sense in production then the prior setup
- Upgraded Agones from `1.40.0` to `1.44.0` (didn't really change any current behavior)
- Added better retry logic for deploying game servers to Agones (the default game server provider for `kubernetes` deployments) and increased the default Agones autoscaler to assess every 1 second instead of the default 30 seconds
- Added the ability to use Agones autoscalers other than the default `Buffer` one (only helpful for later stage projects looking to use something else; the default should work just fine)
- Fixed `yarn cli ...` commands for `kubernetes` deployment
- Fixed a soft-lock race condition in `kubernetes` deployments where services would keep trying to reauth when they connected too early
- Added a missing DB migration that was necessary for `kubernetes` deployments

## Misc changes

- Added automated tests in GitHub for the backend. We've had automated tests that we used for Test Driven Development, but they weren't running in a Continuous Integration perspective, causing some bugs to creep up. These tests are now being ran every time we push to GitHub; if you don't have source code access you won't see these being ran, but feel more confident they're being ran! Hopefully we'll add some sort of visibility so you can see the current build status publicly.
- Added automated release GitHub workflows so that we don't miss a step, ensuring a clean directory in our distributed ZIPs, and expediting the release process
