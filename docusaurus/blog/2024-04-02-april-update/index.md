---
slug: april-2024-update
title: April 2024 Development Update
authors: [mike]
tags: [development update, news]
---

Happy April! March has been busy with some huge news, adding support for multiple realms, preparing for the re-release of the Shooter Template, and getting ready for iterative testing on large player counts! If you want to get notified of these updates, [subscribe to our newsletter](https://redwoodmmo.com/#signup).

<!--truncate-->

## Big News Coming Soon

We received some awesome news and have been spending some time adjusting due to that. Stay tuned for another update in the coming weeks once we get the go ahead to share the news with you!

## Multiple Realm Support

As part of our effort to better support MMORPG titles, Redwood is going through another mini-refactor to support multiple realms. Redwood was designed with multiple realms in mind, but up to this point most of the development has gone towards supporting "Single Realm" titles (generally ephemeral, match-based, low player count games). We think these changes help titles that only need a single realm by enabling them to leverage multiple realms for blue/green and rolling deployment strategies instead of solely relying on in-place deployments.

Part of this change is moving away from the `single-realm` config variable which changed the architecture of Redwood originally meant to simplify things for these games. However, I've found that it actually adds confusion during configuration, debugging, and reading documentation so this config variable is being removed in favor for all Redwood titles to support multiple realms even only 1 is needed. We'll update the documentation once this refactor is released.

## Shooter Template Re-release

Per our Core Maturation efforts from last month, we've wrapped up getting the Shooter Template ready for release. We'll send an email when this release goes out later this month, but here are a few things to look forward to:

- The Redwood-specific adjustments to Lyra are easier to follow and more polished
- We'll be relaunching our live demo of the Shooter Template

## Larger Player Counts

The multiple realm support delayed the vertical scaling efforts we discussed last update, but we've been able to bootstrap a testing environment that will enable us to quickly benchmark various CPU and network improvements we're planning to enable large player counts. We're hoping to focus on this effort in the next couple weeks.
