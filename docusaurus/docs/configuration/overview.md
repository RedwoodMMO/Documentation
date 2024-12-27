---
sidebar_position: 1
sidebar_label: Overview
---

# Configuration Overview

You'll find in the Redwood backend directory a folder named `config`. This contains Dockerfile implementations, but these don't need to be modified. The main folder is `config/node` where all the configuration exists for the NodeJS backend microservices. In this directory you'll find several folders; each of which represent a separate set of configuration values.

## Default Values

The `default` folder contains every configuration variable that exists, along with their default values. The only reason to change the contents of this folder are if you need to add additional variables or completely remove existing variables. If you need to change the value of a variable, you should do so by [creating your own config environment](#customization).

## Structure

If you look inside the `default` config environment, you'll see a set of YAML files and folders that contain more YAML files. While it's possible to use JSON to configure Redwood, this is undocumented and mostly unsupported. You can find documentation on the YAML syntax [here](https://docs.ansible.com/ansible/latest/reference_appendices/YAMLSyntax.html).

Variables in the NodeJS service are accessed using a call like this:

```typescript
const value: type = config.get<type>("path.to.variable");
```

Another segment of a variable "path" (i.e. `path` and `to` in the above example) can be constructed one of 3 ways:

- A subfolder with the name of the segment
- A YAML file with the basename of the segment
- A subobject (aka a "dictionary") within a YAML file

For example, let's examine the config variable `deployment.redwood.director.backend.replicas`:

1. Since subdirectories under `config/node` are considered to be the root of the configuration, we can ignore that part of the path.
1. `deployment` is a subfolder under `default` so it becomes the first segment of the variable path (`deployment`)
1. `redwood.yaml` is a YAML file so the basename `redwood` becomes the next segment (`deployment.redwood`)
1. Inside `redwood.yaml`, we'll see there is a subobject on line `4` named `director`, so that becomes the next segment (`deployment.redwood.director`)
1. On line `5`, `backend` is a suboject of `director`, so that becomes the next segment (`deployment.redwood.director.backend`)
1. Finally there is a key-value pair on line 6 named `replicas` which becomes the last segment (`deployment.redwood.director.backend.replicas`) with the default value of `1`

As another example, you can see that the default value of `persistence.director.host` is `"mongodb.persistence.svc.cluster.local"`.

### The \_index.yaml File

The only exception to the above is the `_index.yaml` and `index.yaml` files which do not add a segment to the variable path. We recommend prefixing the file name with the underscore to bring it to the top of file explorers, but omitting the underscore also works.

Contents of this file act as if they are in the scope of the parent directory. If we take a look at the `config/node/default/_index.yaml` file, you'll see that the `development` variable on line `25` has a variable path of `environment.development`. If we take a look at `config/node/default/deployment/_index.yaml`, `cloud` has a variable path of `deployment.cloud`.

## Customization

The `config/node/default` directory contains all of the possible config variables and their default values. If you want to change any of the values, you must do so in another config environment.

You only need to define the parts of the configuration that you would like to override. Consider that the files are defining overrides rather than merging onto the existing values, and we only need to specify what is being overridden.

:::warning
Arrays/lists do not get merged; your values will completely replace the default array values, so if you want to add one value to the default, you must copy the entire array.
:::

For example, let's take a look at the config variable `deployment.redwood.debug`. We can find a `deployment/redwood.yaml` file in both the `default` and `production` configuration environments/folders. `config/node/default/deployment/redwood.yaml` defines the default value of `deployment.redwood.debug` to be `true`, but **when, and only when, you're using the `production` environment** the value of `deployment.redwood.debug` is overridden to `false`.

Another example is `deployment.redwood.director.backend.command` which defaults to `["/bin/bash", "-lc", "yarn debug:director-backend"]`, but is overridden to `null` in the `production` environment.

Lastly, `deployment.redwood.director.backend.debug-port`, while not used in the code when `debug: false` is unchanged in the `production` environment and stays as the default `10100` value since it's not defined in `config/node/production/deployment/redwood.yaml.`

## Config Environment Inheritance

By default, a config environment in `config/node` (other than `default`) inherits the values defined in `default`. However, you can inherit from more environments for more complex configuration setups.

For example, we have a `staging` config environment that changes variables to values common to most production-like environments but targeting your local development Kuberentes cluster. We also provide a `production` environment that that is very similar to `staging` but only modifying a few flags for actual production environments. We didn't want to copy and paste all of the variables as that opens a potential for user error to change one but not the other.

To combat this, we added support for the `config/node/production/_config.json` file. This config file for the configuration environment (😅 stay with me here) will be used for any additional metadata about the configuration environment. Currently the only supported variable for this is `parentNames` which defines an array of other configuration environments to inherit from. If this file doesn't exist, it inherits only from `default`.

So looking at `config/node/production/_config.json` specifically, we see that `staging` is part of the `parentNames` array in `_config.json`. This means that the values in `production` will load in `default` values first, then override them with the values of `staging` (including any of it's parents), and then finally overriding them with the values defined in `production`.

For example, even though `production` doesn't specify an override for `environment.development`, it's still set to `false` in the `production` environment since it listed `staging` as a parent.

### Multiple Parents

You can have multiple parent environments by specifying more than one environment in `parentNames`. Inheritance happens in sequential order, first loading the `default` values, then the first child of `parentNames`, then the second child, and so forth before finally loading the current environment's overrides.

We don't have an example defined in the distributed configuration, but you will use it when you deploy to a cloud inheriting both from `production` and the config for your cloud provider. For example a `redwood-demo-production` environment's `_config.json` file might look like:

```json
{
  "parentNames": ["production", "cloud-do"]
}
```

This will read in `default`, then `production` (and its inherited environments), `cloud-do`, and then the current environment this is defined in.
