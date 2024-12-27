---
sidebar_position: 1
---

# Welcome to Redwood

Redwood is a self-hosted, source-available alternative to Epic Online Services, Steamworks, Azure Playfab, and other Game Backend as a Service (GBaaS) platforms.

Similar to GBaaS platforms, Redwood provides generic features that are common to most games, but by being able to customize how the backend works through **flexible configuration** or **modifying the source code directly**, small and large studios don't have to be constrained by a 3rd party service when their game inevitably has specific requirements.

By incorporating gold-standard Software as a Service (SaaS) principles along with years of Unreal scalable multiplayer experience, Redwood gives you a foundation that is easy to prototype on but will stay scalable as you get closer to release with the flexibility for you to mold it to your unique game.

## Backend Infrastructure

Redwood's backend infrastructure is built with flexibility in mind; it's designed to make it easy to switch hosting providers, payment providers, database backends, and more.

For example, switching from AWS to Azure is as simple as changing a few configuration parameters or leveraging one of Redwood's configuration presets. We also created the backend software to be understandable and flexible to quickly add new features. The backend provides a plethora of configuration options so that it's flexible while supporting more complex environments.

Redwood's backend is completely written in NodeJS so you can quickly integrate most third party services with a free [NPM module](https://npmjs.com). While there are other options to implement a backend service, we believe that the NodeJS ecosystem provides ultimate flexibility for integrating services and technologies. It's easy to understand and approachable by many developers, so extending functionality for a new gameplay feature, such as a global trading marketplace that integrates with a mobile companion app, is within reach.

## Gameplay Templates

Redwood comes with high quality [gameplay templates](https://redwoodmmo.com/gameplay-templates) that you can use to quickly create a prototype for a number of genres or use as practical references on how to integrate with Redwood.

## Flexible Development Environments

You can develop and test Redwood locally using the Epic Games Launcher installs of Unreal Engine or your own fork of Unreal Engine. Redwood integration is a few UE plugins that can be compiled against any UE5 engine version. This local development environment enables quick iteration by using the uncooked data form Unreal.

When you're ready to test more production-like environments, Redwood makes it easy to work with local and cloud hosted Kubernetes environments.
