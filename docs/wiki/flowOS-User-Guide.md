# flowOS: User guide

## Signing up and in

- **Sign up** with your email, a password and, optionally, a display name. If email confirmation is turned on, flowOS asks you to check your inbox and follow the link first.
- **Sign in** with your email and password. If you opened a page while signed out, you land back on it after signing in.
- **Log out** from the account menu (top right).

## The workspace

Once signed in, flowOS shows a sidebar of your installed apps on the left (a menu button opens it on phones) and a top bar with your account menu.

| Page      | Address     | What it shows                                                                                                                         |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Overview  | `/`         | Your workspace: your user id (with a copy button), the backend status, installed apps, member since, a summary tile per installed app |
| App Store | `/store`    | Every app, by category (Productivity, Utilities, Developer), with search, Install and Uninstall                                       |
| Settings  | `/settings` | Profile, sessions, appearance                                                                                                         |

## Installing and opening apps

1. Open the **App Store**, find an app and click **Install**. It appears in your sidebar.
2. Click it in the sidebar or on its Overview tile. flowOS asks **Open <app>?**, then opens it full screen.
3. To come back, use the app's **Back to flowOS** action (each app has one, usually in its account menu or bottom bar). It asks for confirmation and returns you to the Overview; you stay signed in.

Uninstalling removes the app from your sidebar. Apps load only the first time you open them, so installing many doesn't slow flowOS down.

## Settings

### Profile

Your **display name** (shown across your workspace) and your sign-in **email** (read only for now).

### Sessions

Every device and browser where your account is signed in, in a table:

| Column  | Shows                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------- |
| Device  | Browser and operating system, e.g. `Chrome (Windows)`; the one you're using has a **Current** badge |
| IP      | The address it signed in from                                                                       |
| Created | When it signed in                                                                                   |
| Updated | When it was last active                                                                             |

- **Sign out one session:** hover its row (on touch screens the button is always shown), click **⋮**, then **Sign out**.
- **Sign out all devices:** **Sign out** in the row under the table. This signs out every session, including the one you're using, and takes you to the sign-in page.

Both ask for your **password**. After 5 wrong passwords in 15 minutes, you have to wait before trying again. A signed-out device can keep working for up to an hour, until its current login expires.

### Appearance

**Light**, **Dark** or **System** (follows your device).

## On phones

- The sidebar becomes a menu that slides in from the left.
- Dialogs open as bottom sheets that slide up from the bottom of the screen.
- Text fields use 16px text so iPhones don't zoom in when you tap them.
