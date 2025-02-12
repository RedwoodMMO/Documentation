---
slug: 3_0_1-released
title: Version 3.0.1 Released & RPG Template Demo
authors: [mike]
tags: [release, news]
---

We released a live playable demo of our RPG Template, so you can play with it before downloading the project yourself!

<div class="center">
  <a href="https://cdn.incanta.games/redwood/RedwoodRpgDemo.zip"><button>Download the RPG Template Demo Client</button></a>
</div>
<br/>

This coincides with the Redwood `3.0.1` release which fixes several bugs and is more robust 💪; checkout the full details below!

<!-- truncate -->

## Bug Fixes

- [RedwoodPlugins] Sync Items that are not marked to persist data will not send an initial persistence request
- [RedwoodPlugins (Content)] Prevent soft lock condition when using the Redwood plugin's Portal Spline; in some scenarios clients would no longer be able to move
- [Backend (Auth - Local)] Usernames are now case insensitive during registration/login
- [Backend] More robust sidecar/game server authentication with realm backend (aka more robust `create-proxy` outcome)
- [Backend (Ticketing)] Prevent processing queues for stopped/ended GameServerProxies
- [Backend (Deployment)] Fix `yarn docker` script used when deploying to remote environments
- [Backend (Deployment)] Fix issues preventing multiple realms in the same Kubernetes cluster
- [Backend (Deployment)] Fix issues with configuration being slightly corrupted for Kubernetes environments
- [Backend (CLI)] Fix connecting to backend with `yarn cli` commands when the backend is using TLS
- [Backend (Hathora)] Disable connecting to Redis for [Hathora](/docs/providers/game-server-hosting/hathora) game servers (which means sync items will not work for Hathora servers; persistence will still work)
- [Backend (Hathora)] Fix `yarn package:hathora` script

## New Features

- [Backend (Logging)] Starting the Dev Initiator and Kubernetes services will now always log the Redwood version you're using when they start
- [Backend (Logging)] Better error logging for auth errors for sidecars/game servers connecting to the realm backend
