---
sidebar_label: CLI
---

# CLI (Command Line Interface)

Redwood comes with some simple CLI tools to perform administrative tasks. You will need to [install Node.js and yarn](../getting-started/prerequisites.md#nodejs) to use the CLI.

You can see the available commands by running `yarn cli --help` and getting the associated options with `yarn cli <command> --help`.

## Default Admin User

The CLI authenticates with the backend using the Default Admin User which is configured in `config/node/default/admin/_index.yaml`. This user is created when first deployed to an environment (in both the Dev Initiator and in Kubernetes environments). Each CLI command will take a `-e, --env` option which specifies the config env to use (which is how it finds the admin credentials).

:::danger
You need to change the password of your Default admin user before deploying to production! Create a file in your config env folder `config/node/your-game/admin/_index.yaml` with:

```yaml
default-user:
  password: "new password" # This can be a secret in the secrets provider
```
:::

You can create more admin accounts using the `create-admin` CLI command, but the CLI tools will still use the `admin.default-user` config variables for authentication.
