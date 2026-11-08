# Database

Redwood uses the [Prisma](https://www.prisma.io/) ORM to define database schemas and migrations and to access the databases from the Node.js services. Redwood is designed for a relational database, with game-data fields stored as JSON for flexibility. While Prisma [supports several databases](https://www.prisma.io/docs/orm/reference/supported-databases), Redwood currently supports:
- **SQLite** - Used in development and testing without Kubernetes, for quick iteration
- **PostgreSQL** - Used in Kubernetes environments, locally and in production

The Director and each Realm have their own database (or their own schema in a shared PostgreSQL database).

You shouldn't need to configure which one is used, since the `kubernetes` config environment switches it for you, but you can change it with the `persistence.database.provider` config variable: `sqlite` (default) or `postgresql`.

## SQLite

SQLite needs no configuration. When you run the [Dev Initiator](../../../getting-started/running-with-backend.md), it creates the database files in the `RedwoodBackend` folder and pushes the current schema to them (with `prisma db push`, so there are no migrations to run):

| Database | File | Config variable |
| --- | --- | --- |
| Director | `director-dev.db` | `director.development.db-file` |
| Each realm | `realm-<realm-key>-dev.db` (e.g. `realm-default-dev.db`) | `realm.instances.<realm-key>.development.db-file` |

You can open these files with any SQLite browser if you want to look at the data.

:::warning
By default, the Dev Initiator **deletes these files every time it starts** (`environment.clean-db-on-dev-initiator-start: true`), so you start each session with a clean slate: no accounts, characters, or proxies. Set it to `false` in your config environment if you want your data to survive restarts.
:::

:::note
Prisma doesn't support `Json` fields for SQLite. Redwood generates the SQLite schemas from the PostgreSQL schemas (`packages/persistence/prisma/{director,realm}/schema.prisma`) during `yarn`, converting `Json` fields to strings, and the database clients in `packages/persistence/src/connect.ts` convert those strings back to JSON. If you add a `Json` field to the schema (custom licenses), add the matching conversion there; there are plenty of examples to follow.
:::

## PostgreSQL

The Director and each realm have two sets of connection details:

- **`runtime-access`** is how the running services connect to the database. In Kubernetes this is usually an internal service hostname or your managed database's private network address.
- **`deployment-access`** is how the deployment scripts on your machine (or CI) connect to run migrations. By default it reuses the `runtime-access` values with `host: "localhost"` and `port: -1`, which means "port-forward to the PostgreSQL instance running in the cluster".

| Variable | Default | Meaning |
| --- | --- | --- |
| `director.persistence.database.runtime-access.host` / `port` | `127.0.0.1` / `5432` (the `kubernetes` env sets `postgresql.persistence.svc.cluster.local`) | Database server |
| `director.persistence.database.runtime-access.database` / `schema` | `redwood` / `director` | Database and schema |
| `director.persistence.database.runtime-access.user` / `password` | `redwood` / `redwood` | Credentials (the password supports the [secrets system](../../secrets/overview.md)) |
| `director.persistence.database.deployment-access.*` | `localhost`, `-1`, then the `runtime-access` values | Connection used by `yarn deploy` for migrations |
| `realm.instances.<realm-key>.persistence.database.runtime-access.*` | same as the Director, with schema `realm` | The realm's database |
| `realm.instances.<realm-key>.persistence.database.deployment-access.*` | same pattern | The realm's migration connection |

See the [Director](../../../configuration/reference/director.md) and [realm](../../../configuration/reference/realm.md) config references for details.

### In-cluster vs managed databases

By default, Redwood deploys a PostgreSQL instance into your Kubernetes cluster (the Bitnami `postgresql` Helm chart, configured under `deployment.dependencies.postgresql`). It's convenient for development, but its data **isn't persisted** if the pod restarts.

For production, use a managed database. Set `deployment.kubernetes.instances.<k8s-instance>.dependencies.postgresql.useExternalDb` to `true` (the `production` config environment already does this for `k8s-default`), and set both `runtime-access` and `deployment-access` for the Director and each realm to your managed database's details.

### Migrations

`yarn deploy` applies the Prisma migrations (`prisma migrate deploy`) for the Director and each deployed realm:

- With the in-cluster database, it port-forwards to the database and runs the migrations after deploying.
- With an external database, it checks for pending migrations first. If there are any, it tears down the running services, migrates, and then redeploys. It asks for confirmation unless you pass `-y` or `--migrate-db-without-confirmation`.
