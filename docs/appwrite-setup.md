# Appwrite setup

The extension expects an Appwrite project with a specific schema. Create
this once before installing the extension.

The project ID for the default setup is **`work-tracker`** (fra region).

## Quick setup (with the Appwrite CLI)

```powershell
# 1. Sign in once
appwrite login

# 2. Switch to the project
appwrite client --project-id work-tracker

# 3. Run the idempotent setup script
pwsh ./appwrite/setup.ps1
```

The script:

- Creates database `work-tracker`
- Creates 4 tables (`projects`, `heartbeats`, `daily_summaries`, `goals`)
- Adds every column and index
- Enables email/password auth

All operations are idempotent: re-running the script after a fresh login
adds only what's missing.

## Manual setup

### 1. Create project

1. Sign in to https://cloud.appwrite.io/
2. Click **Create Project**, name it `Work Tracker`
3. Note the **Project ID** — you'll need it in extension settings

### 2. Enable Auth

In the project console:

1. Go to **Auth → Settings**
2. Enable **Email/Password** provider

### 3. Create database + tables

1. Go to **Databases → Create Database**
2. Database ID: `work-tracker`
3. Create four tables with **row-level security** enabled:

### `projects`

| Column       | Type        | Required | Notes            |
| ------------ | ----------- | -------- | ---------------- |
| `userId`     | string(36)  | yes      | index `idx_user` |
| `name`       | string(128) | yes      |                  |
| `path`       | string(512) | yes      |                  |
| `color`      | string(16)  | yes      | hex              |
| `isHidden`   | boolean     | yes      |                  |
| `isArchived` | boolean     | yes      |                  |

Indexes: `idx_user` (key, userId), `idx_user_name` (unique, userId + name)

### `heartbeats`

| Column            | Type        | Required |
| ----------------- | ----------- | -------- |
| `userId`          | string(36)  | yes      |
| `projectId`       | string(36)  | yes      |
| `projectName`     | string(128) | yes      |
| `entity`          | string(512) | yes      |
| `language`        | string(64)  | yes      |
| `branch`          | string(128) | no       |
| `category`        | string(32)  | yes      |
| `timestamp`       | datetime    | yes      |
| `durationSeconds` | float       | yes      |
| `isWrite`         | boolean     | yes      |
| `linesAdded`      | integer     | yes      |
| `linesRemoved`    | integer     | yes      |
| `machineId`       | string(64)  | yes      |
| `editor`          | string(64)  | yes      |

Indexes: `idx_user` (key), `idx_project` (key), `idx_timestamp` (key desc),
`idx_user_timestamp` (key userId asc + timestamp desc)

### `daily_summaries`

| Column         | Type        | Required |
| -------------- | ----------- | -------- |
| `userId`       | string(36)  | yes      |
| `date`         | string(10)  | yes      |
| `projectId`    | string(36)  | yes      |
| `projectName`  | string(128) | yes      |
| `language`     | string(64)  | yes      |
| `totalSeconds` | float       | yes      |
| `linesAdded`   | integer     | yes      |
| `linesRemoved` | integer     | yes      |
| `sessions`     | integer     | yes      |

Indexes: `idx_user_date` (key, userId asc + date desc), `idx_user`, `idx_date`

### `goals`

| Column      | Type        | Required |
| ----------- | ----------- | -------- |
| `userId`    | string(36)  | yes      |
| `title`     | string(128) | yes      |
| `delta`     | string(8)   | yes      |
| `seconds`   | integer     | yes      |
| `languages` | string(512) | no       |
| `projects`  | string(512) | no       |
| `isEnabled` | boolean     | yes      |
| `createdAt` | datetime    | yes      |

Indexes: `idx_user`

### Row permissions

With row-level security enabled, the extension sets per-row permissions
when creating each document:

```
read    = user:<userId>
update  = user:<userId>
delete  = user:<userId>
```

So each user can only see / modify their own data.

## 4. Set extension settings

In VS Code:

```jsonc
{
  "workTracker.appwriteEndpoint": "https://cloud.appwrite.io/v1",
  "workTracker.appwriteProjectId": "work-tracker",
}
```

## 5. Sign in

Run `Work Tracker: Sign In` from the Command Palette and create an
account. Heartbeats start flowing on the next active coding session.
