---
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Modifying a Deployment

:::info
`yarn deploy` has more options than what is documented on this site, check out `yarn deploy --help` to see them all.
:::

## Removing a Deployment

If you want to stop and remove all resources made by a Pulumi deployment, run:

    ```bash
    yarn deploy <config-environment> --destroy
    ```

## Upgrading a Deployment

Running a rolling update to an existing Pulumi deployment just requires you to run the `deploy` command again. Pulumi will determine the necessary differences and apply the update.
