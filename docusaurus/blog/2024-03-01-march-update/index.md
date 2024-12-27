---
slug: march-2024-update
title: March 2024 Development Update
authors: [mike]
tags: [development update, news]
---

Hey! I just wanted provide an update on Redwood development! You can expect monthly updates going forward, regardless of the progress. If you want to get notified of these updates, [subscribe to our newsletter](https://redwoodmmo.com/#signup).

<!--truncate-->

## Contracting Work

Since the release of Redwood in January, I've been handling a large influx of bespoke contract work which has consumed 50-75% of my time. This contract work doesn't usually progress Redwood development, but since I'm full-time and self-funded it's necessary to keep the lights on long-term. It usually comes in waves, and it's looking like this last wave is dying down and focused Redwood development can continue!

## Core Maturation

The current main task has been maturing the Shooter template. This template was scrapped together quickly and the DX (Developer Experience) just wasn't great. The changes that have been supporting this are:
- **Separated Redwood Blueprints** instead of modifying the Lyra ones directly to help integrate Lyra updates and show you what was changed.
- **The UE interface to the Redwood Backend for clients is now a Subsystem** instead of a inheritable PlayerController.
- **New title screen widgets that are cohesive with the Lyra template.**
- **Added Lobby support.** Before only matchmaking was supported but now you can have players create and join public/private servers; stay tuned for a more detailed description of this new feature.
- **Added automated testing for the Backend services.** By testing the Backend services directly in NodeJS, development is 5-10x faster.
- **The Backend services now use a logging framework** to appropriately separate log levels instead of writing directly to stdout.
- Lots of small refactors to improve the DX of using and extending the Backend services.

The common theme here is core maturation. It's a slew of improvements I've been considering doing for awhile now but never took the time to do it chasing more short-term goals. It's time to pay back some of that technical debt to prepare for expanding the framework.

## Looking Ahead

After this core maturation work is complete, **I'll be focusing on player counts >100 (with a goal of 1000 without sharding)** and filling in more of the missing documentation. We'll be streaming some of this development on [Twitch](https://www.twitch.tv/incantagames) and [YouTube](https://www.youtube.com/@incantagames), so follow/subscribe if you're interested watching that development!
