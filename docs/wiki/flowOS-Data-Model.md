# flowOS: Data model

The platform's own tables and database functions, in Supabase's `public` schema. Each app documents its own tables: see [Ledger data model](Ledger-Data-Model) and [Roster data model](Roster-Data-Model).

Every table has row-level security (RLS) on, with policies scoped to `auth.uid()`, so users only ever reach their own rows.

## Tables

| Table               | Purpose                                                                               | Who can access                            |
| ------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------- |
| `profiles`          | One row per user: display name, avatar URL. Created by a trigger when a user signs up | The user reads and updates their own      |
| `installed_apps`    | Which apps are in each user's sidebar, with their position                            | The user reads and changes their own      |
| `app_storage`       | Per-user, per-app key/value store behind `useAppStorage`                              | The user reads and changes their own      |
| `password_failures` | Wrong passwords entered when signing devices out, for the 5-in-15-minutes limit       | Nobody directly; only the functions below |

`profiles` is created by `handle_new_user()`, a trigger on `auth.users`, using the display name given at sign-up or the part of the email before `@`.

## Signed-in sessions

Supabase Auth keeps one row per signed-in device in `auth.sessions`, which the API doesn't expose. These functions give each user safe access to their own rows. All are `security definer` and callable by signed-in users only.

| Function                                  | Returns | Does                                                                                      |
| ----------------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `list_my_sessions()`                      | rows    | Your sessions: id, user agent, IP, created, last active, and whether it's the current one |
| `revoke_my_session(session_id, password)` | status  | Signs out one of your **other** sessions                                                  |
| `revoke_all_my_sessions(password)`        | status  | Signs out **every** session, the current one included                                     |

Both revoke functions check the password first with the internal `check_my_password()`, which callers can't run directly. They return `ok`, `wrong_password` or `too_many_attempts` (5 wrong passwords in 15 minutes) instead of raising an error, so failed attempts are still recorded.

Deleting a session also deletes its refresh tokens, so that device can't renew its login. The access token it already holds keeps working until it expires (one hour by default).

Migrations: `20261019000000_my_sessions.sql`, `20261019010000_my_sessions_password.sql`, `20261019020000_my_sessions_revoke_all.sql`.

## Types

After changing the schema, regenerate `src/models/database.ts`:

```sh
supabase gen types typescript
```
