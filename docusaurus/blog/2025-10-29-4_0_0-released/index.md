---
slug: 4_0_0-released
title: Version 4.0.0 Released
authors: [mike]
tags: [release, news]
---

## Major Features

- [**Guilds & Alliances**](/docs/features/social/guilds-alliances) are a group management system you can use in game logic to determine membership
- Players can now create ephemeral [**Parties**](/docs/features/social/parties) to stay together in queuing and matchmaking
- We now deploy a [**Text Chat**](/docs/features/social/text-chat) server with Redwood with several room types
- You can automatically synchronize GAS abilities, effects, and attributes with [**GAS Persistence**](/docs/features/data/game/gas)
- SendGrid no longer offers a free tier, so we added the [**ZeptoMail**](/docs/features/transactional-email/zeptomail) email provider
- HCP Vault was discontinued so we added [**many more secrets providers**](/docs/features/secrets/overview)
- We _finally_ support more than DigitalOcean hosting by supporting [**deploying to any Kubernetes cluster**](/docs/deploying-to-kubernetes/deploying-remotely#creating-a-kubernetes-cluster)

<!-- truncate -->

## Minor Features

- Added a maintenance mode for realms
- `PlayerIdentity` now has an optional `data` column which is available in `URedwoodCharacterComponent::PlayerData` if you have data that stays the same for all realms/characters
- Added an optional persisted `URedwoodCharacterComponent::AbilitySystem` field if you want to manually persist ability details without using GAS persistence
- Added an optional persisted `URedwoodCharacterComponent::Progress` field if you want to store character progression
- Added the flag in the `<realm-instance-config>.game-servers.local.log-to-terminal` flag which defaults to `false`
- Allow Docker Desktop to be used in the `local` Kubernetes cloud provider
- Updated pulumi
- Updated TypeScript

## Bug Fixes

- **MAJOR BUG FIX**: We fixed Kubernetes deployments which had image pull errors due to Bitnami, a large Docker image & Helm chart provider, [moving non-latest images to a legacy account](https://github.com/bitnami/charts/issues/35164). We'll be considering how best to provide Redis and Postgres images in future releases
- **MAJOR BUG FIX**: We fixed several errors in the Redwood plugins that would cause UObjects to get garbage collected too early
- We fixed several security vulnerabilities introduced in dependencies, including all `High` and `Critical` ones
- Reduced frequency of over-reported `Invalid zone shard...` errors
- Third party licenses are now included
- Fixed PIE & World Partition errors for UE 5.6+ by adding the `-pieviaconsole` arg to all `local` UE game servers (so you don't need to manually add it)

## Breaking Changes

As applicable, we provided Core Redirects so you can open Blueprint classes that inherited from the old names, but C++ classes will not compile until you update the names yourself.

- We upgraded from Yarn v1 to v4, which you should be able to retrieve with the command `corepack enable` in the `RedwoodBackend` directory
- `idem` matchmaking provider was removed as the service was discontinued
- `hcp-vault` secrets provider was removed as the service was discontinued
- `digitalocean` cloud provider was removed in favor of the agnostic `custom` provider
- `URedwoodClientInterface::ListServers` was renamed to `URedwoodClientInterface::ListProxies`
- `URedwoodClientInterface::CreateServer` was renamed to `URedwoodClientInterface::CreateProxy`
- `URedwoodClientInterface::JoinServerInstance` was renamed to `URedwoodClientInterface::JoinProxyWithSingleInstance`
- `URedwoodClientInterface::StopServer` was renamed to `URedwoodClientInterface::StopProxy`
- `URedwoodClientGameSubsystem::ListServers` was renamed to `URedwoodClientGameSubsystem::ListProxies`
- `URedwoodClientGameSubsystem::CreateServer` was renamed to `URedwoodClientGameSubsystem::CreateProxy`
- `URedwoodClientGameSubsystem::JoinServerInstance` was renamed to `URedwoodClientGameSubsystem::JoinProxyWithSingleInstance`
- `URedwoodClientGameSubsystem::StopServer` was renamed to `URedwoodClientGameSubsystem::StopProxy`
- `FRedwoodCreateServerInput` was renamed to `FRedwoodCreateProxyInput`
- `FRedwoodListServersOutput` was renamed to `FRedwoodListProxiesOutput`
- `FRedwoodListProxiesOutput::Servers` was renamed to `FRedwoodListProxiesOutput::Proxies`
- `FRedwoodCreateServerOutput` was renamed to `FRedwoodCreateProxyOutput`
- `FRedwoodCreateProxyOutput::ServerReference` was renamed to `FRedwoodCreateProxyOutput::ProxyReference`
- `FRedwoodFriend` was renamed to `FRedwoodPlayer`
- `FRedwoodPlayer::State` was renamed to `FRedwoodPlayer::FriendshipState`
- `FRedwoodListFriendsOutput` was renamed to `FRedwoodListPlayersOutput`

## EULA Changes

Starting in 4.0 we'll be adding the below information to our analytics collected from the backend:
- The Unreal Engine version you're using. This will help us make the decision whether or not to upgrade the version we test on (currently 5.4).
- The [basename](https://nodejs.org/api/path.html#pathbasenamepath-suffix) of the value of the `game-servers.local.project` config variable from each of your [realm instance configs](https://redwoodmmo.com/docs/configuration/realm-instance-config) to help us better identify unique projects (or simply, the filename of your `uproject`).

You can read the full details of the changes in Section 17(b) in the [EULA](https://redwoodmmo.com/eula).

