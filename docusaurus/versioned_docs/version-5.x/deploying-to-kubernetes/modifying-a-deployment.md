---
sidebar_position: 5
---

# Modifying a Deployment

All of the `yarn deploy` options are listed in [Deploying Locally](./deploying-locally.md#deploy-options), or you can run `yarn deploy --help`.

## Upgrading a Deployment

Running a rolling update to an existing Pulumi deployment just requires you to run the `deploy` command again. Pulumi will determine the necessary differences and apply the update:

```bash
yarn deploy <config-environment>
```

A few things to keep in mind:

- **Configuration changes** are applied by updating each service's ConfigMap. Like the Dev Initiator, the services only read their configuration on startup, so if a deploy only changed configuration, restart the affected pods (e.g. `kubectl rollout restart deployment -n realm-default`) to make sure they pick it up.
- **New code or a new game server build** requires new Docker images. For environments that inherit from `staging` or `production`, [build and push the images](./deploying-remotely.md#building-and-pushing-docker-images) with a new tag and update the `image-tag` variables first.
- **Database schema changes** (e.g. after upgrading Redwood) are migrated during the deploy. You'll be asked to confirm because **all services are taken down during the migration**; pass `--migrate-db-without-confirmation` to skip the prompt in automated pipelines.

## Canceling a Stuck Deployment

If a deploy was interrupted (e.g. you closed the terminal or lost your connection), Pulumi may keep the stack locked. Cancel the in-progress update with:

```bash
yarn deploy <config-environment> --cancel
```

## Removing a Deployment

If you want to stop and remove all resources made by a Pulumi deployment, run:

```bash
yarn deploy <config-environment> --destroy
```

This deletes everything Redwood created in the cluster, including any in-cluster databases (which aren't persisted by default). External managed databases aren't touched.

To also remove the stack from Pulumi's state after destroying it, run:

```bash
yarn deploy <config-environment> --remove
```
