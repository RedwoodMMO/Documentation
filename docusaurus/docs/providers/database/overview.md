---
sidebar_position: 1
sidebar_label: Overview
---

# Database Providers

Redwood uses the [Prisma](https://www.prisma.io/) framework to define database schemas, migrations, and Node.js interactions. Redwood is designed to be used in a relational database with some game-data fields being stored as JSON objects for flexibility. While Primsa [supports several databases](https://www.prisma.io/docs/orm/reference/supported-databases), Redwood currently only supports:
- **SQLite** - Used in development and testing without Kubernetes for quick iteration
- **PostgreSQL** - Used in development and production Kubernetes environments

While you shouldn't have a need to configure when each is used since the `kubernetes` config environment switches it for you, you can change the provider with the `persistence.database.provider` config variable to `sqlite` (default) or `postgresql`.

SQLite configuration is self-maintained. It has no passwords, and `director-dev.db` and `realm-dev.db` files are created to store the data if you need to manually browse the contents. The files are created in `RedwoodBackend` when you run the `dev-initiator`.

:::note
Prisma doesn't currently support `Json` fields for SQLite databases. For each `Json` field defined in the `RedwoodBackend/packages/persistence/prisma/**/prisma.schema` files, a set of middleware functions need to be added in `RedwoodBackend/packages/persistence/src/connect.ts` for the calls to either `new DirectorClientDev` or `new RealmClientDev` depending on which schema you're modifying. There are plenty of examples already there for you to reference if you need to add an additional `Json` field.
:::

## PostgreSQL Configuration

:::warning
We're currently refactoring how configuration works for internal, external, and deployment access across multiple realms. Stay tuned for updated documentation!
:::
