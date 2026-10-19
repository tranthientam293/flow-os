# flowOS

**flowOS** is a personal workspace that hosts small utility apps, like a mini app store for one publisher. You sign in once, install the apps you want from the App Store, and open them from your sidebar. Every app runs as your signed-in account, so there's no separate login per app.

Live site: [flow-os-project.vercel.app](https://flow-os-project.vercel.app) · Source: [tranthientam293/flow-os](https://github.com/tranthientam293/flow-os)

## Apps

| App              | Version | What it does                                                                                               |
| ---------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| [Ledger](Ledger) | 0.27.8  | Daily expense tracker: write down what you spend and see where your money goes                             |
| [Roster](Roster) | 2.44.0  | Schedules for a center and its trainers: owners set up branches and trainers, trainers book their sessions |

## Using flowOS

- [User guide](flowOS-User-Guide): signing up, the Overview, the App Store, settings and signed-in sessions.

## Building on flowOS

| Page                                    | What it covers                                                         |
| --------------------------------------- | ---------------------------------------------------------------------- |
| [Architecture](flowOS-Architecture)     | Stack, folder layout, data flow, coding conventions                    |
| [Building an app](flowOS-Building-Apps) | The app contract, the platform SDK, app data, adding and removing apps |
| [Data model](flowOS-Data-Model)         | Platform tables, row-level security, database functions                |
| [Deployment](flowOS-Deployment)         | Environments, Vercel deploys, database migrations, this wiki           |

## About this wiki

These pages are kept in the repository under `docs/` and published here by the **Sync wiki** workflow. Edit them in the repository, not here: the next sync overwrites changes made in the wiki.
