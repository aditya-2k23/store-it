# Storey — Database Schema Reference

> **Source of truth** for the Supabase PostgreSQL schema.
> Update this file whenever a migration is applied. Include the date, a short description, and what changed.

## Changelog

| Date    | Version | Description                                                                                                                                                             |
| ------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-06 | v1.0    | Initial schema — users, workspaces, workspace_members, folders, files, file_versions, direct_file_shares, public_file_links, favorite_files, ai_metadata, activity_logs |
| 2025-06 | v1.1    | Workspace system — renamed role `member` → `editor` in workspace_members; added `slug` column to workspaces; added `workspace_invitations` table                        |
| 2026-06 | v1.2    | Workspace Identity — added `expected_members`, `icon`, and `theme_color` to workspaces                                                                                  |

---

## Design Decisions

- **File-level sharing only** — no folder-level sharing at launch. `direct_file_shares` operates on `files` only.
- **Private R2 storage** — `storage_key` and `thumbnail_key` are R2 object paths. Signed URLs are generated per-request and never stored.
- **Clerk for auth, Supabase for data** — Clerk handles authentication. User records are synced to Supabase via webhooks. Workspaces are fully Supabase-native and decoupled from Clerk Organizations.
- **Personal workspace** — one auto-created per user on first login (`type = 'personal'`). Cannot be deleted.
- **Team workspaces** — user-created, max 5 per user (`type = 'team'`). Enforced server-side.
- **Active workspace** — tracked via an httpOnly cookie `storey-active-workspace` containing the workspace UUID.
- **Roles** — `owner > admin > editor > viewer`. Owner is immutable via role change; must transfer ownership to leave.
- **Invite links** — token-based, 7-day expiry, single-use. No email sent (phase 1). URL: `/invite/[slug]/[token]`.
- **storage_used** — maintained on `workspaces` via a Postgres trigger that fires on file insert/delete.
- **Full-text search** — `search_tsv` tsvector + GIN index on `files` and `folders`.
- **AI embeddings** — untyped `vector` column in `ai_metadata` with `embedding_model` text column to avoid hardcoding dimensions (Gemini models).
- **Activity log actions** — dot-namespaced plain text (e.g. `file.upload`, `workspace.member.invite`) — not an enum, to allow new event types without migrations.
- **Workspace Identity** — workspaces optionally store `icon` (emoji or lucide) and `theme_color` to provide customizable avatars, along with `expected_members` to track team size intent.

---

## Tables

### `users`

Synced from Clerk via webhooks. One row per Clerk user.

| Column       | Type        | Constraints                   | Notes                                 |
| ------------ | ----------- | ----------------------------- | ------------------------------------- |
| `id`         | uuid        | PK, default gen_random_uuid() | Internal Supabase user ID             |
| `clerk_id`   | text        | NOT NULL, UNIQUE              | Clerk's user ID (e.g. `user_2abc...`) |
| `email`      | text        | NOT NULL, UNIQUE              | Primary email from Clerk              |
| `full_name`  | text        | nullable                      | First + last name from Clerk          |
| `avatar_url` | text        | nullable                      | Profile image URL from Clerk          |
| `username`   | text        | nullable                      | Username from Clerk                   |
| `plan`       | text        | NOT NULL, default `'free'`    | CHECK: `free \| pro \| team`          |
| `created_at` | timestamptz | NOT NULL, default now()       |                                       |
| `updated_at` | timestamptz | NOT NULL, default now()       |                                       |

**Indexes:** `users_clerk_id_key` (unique), `users_email_key` (unique)

---

### `workspaces`

A workspace is the top-level container for files and members.

| Column             | Type        | Constraints                   | Notes                                                                          |
| ------------------ | ----------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `id`               | uuid        | PK, default gen_random_uuid() |                                                                                |
| `name`             | text        | NOT NULL                      | Display name                                                                   |
| `slug`             | text        | UNIQUE, nullable              | URL-safe identifier. Auto-generated from name. Used in invite URLs. Added v1.1 |
| `expected_members` | text        | nullable                      | Stores internal buckets: `just_me`, `2_to_5`, `6_to_20`, `20_plus`             |
| `icon`             | text        | nullable                      | Stores icon identifier e.g. `emoji:🚀` or `lucide:briefcase`                   |
| `theme_color`      | text        | nullable                      | Hex color code for the workspace avatar                                        |
| `type`             | text        | NOT NULL                      | CHECK: `personal \| team`                                                      |
| `owner_id`         | uuid        | FK → users(id), nullable      | The user who owns/created this workspace                                       |
| `clerk_org_id`     | text        | UNIQUE, nullable              | Reserved for future Clerk Org sync. Not used as SOT.                           |
| `storage_limit`    | bigint      | NOT NULL, default 2147483648  | 2 GB in bytes                                                                  |
| `storage_used`     | bigint      | NOT NULL, default 0           | Maintained by trigger on files insert/delete                                   |
| `created_at`       | timestamptz | NOT NULL, default now()       |                                                                                |
| `updated_at`       | timestamptz | NOT NULL, default now()       |                                                                                |

**Relationships:** `owner_id` → `users(id)`

**Business rules:**

- `type = 'personal'` — one per user, auto-created, cannot be deleted
- `type = 'team'` — max 5 per user (enforced server-side), user-created

---

### `workspace_members`

Junction table — which users belong to which workspaces and at what role.

| Column         | Type        | Constraints                   | Notes                                                                                   |
| -------------- | ----------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| `id`           | uuid        | PK, default gen_random_uuid() |                                                                                         |
| `workspace_id` | uuid        | NOT NULL, FK → workspaces(id) |                                                                                         |
| `user_id`      | uuid        | NOT NULL, FK → users(id)      |                                                                                         |
| `role`         | text        | NOT NULL                      | CHECK: `owner \| admin \| editor \| viewer` — changed from `member` to `editor` in v1.1 |
| `joined_at`    | timestamptz | NOT NULL, default now()       |                                                                                         |

**Relationships:** `workspace_id` → `workspaces(id)`, `user_id` → `users(id)`

**Unique constraint:** `(workspace_id, user_id)` — one membership record per user per workspace

**Role permission matrix:**

| Action                    | owner          | admin            | editor | viewer |
| ------------------------- | -------------- | ---------------- | ------ | ------ |
| View all workspace files  | ✓              | ✓                | ✓      | ✓      |
| Upload files              | ✓              | ✓                | ✓      | —      |
| Rename / delete own files | ✓              | ✓                | ✓      | —      |
| Delete others' files      | ✓              | ✓                | —      | —      |
| Generate invite link      | ✓              | ✓                | —      | —      |
| Change member roles       | ✓              | below admin only | —      | —      |
| Remove members            | ✓              | non-owner only   | —      | —      |
| Rename workspace          | ✓              | —                | —      | —      |
| Delete workspace          | ✓              | —                | —      | —      |
| Leave workspace           | transfer first | ✓                | ✓      | ✓      |

---

### `workspace_invitations`

Tracks invite links for team workspaces. Added in v1.1.

| Column         | Type        | Constraints                                                   | Notes                                                            |
| -------------- | ----------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `id`           | uuid        | PK, default gen_random_uuid()                                 |                                                                  |
| `workspace_id` | uuid        | NOT NULL, FK → workspaces(id) ON DELETE CASCADE               |                                                                  |
| `invited_by`   | uuid        | NOT NULL, FK → users(id)                                      | The owner/admin who created the invite                           |
| `role`         | text        | NOT NULL, default `'editor'`                                  | CHECK: `admin \| editor \| viewer` — role granted to the invitee |
| `token`        | text        | NOT NULL, UNIQUE, default encode(gen_random_bytes(32), 'hex') | Used in the invite URL: `/invite/[slug]/[token]`                 |
| `status`       | text        | NOT NULL, default `'pending'`                                 | CHECK: `pending \| accepted \| revoked`                          |
| `expires_at`   | timestamptz | NOT NULL, default now() + interval '7 days'                   | Tokens expire after 7 days                                       |
| `created_at`   | timestamptz | NOT NULL, default now()                                       |                                                                  |

**Relationships:** `workspace_id` → `workspaces(id)`, `invited_by` → `users(id)`

**Business rules:**

- Single-use: status becomes `accepted` on redemption
- Revocable by owner or admin: status becomes `revoked`
- No email is sent (phase 1) — inviter copies the URL and shares manually
- Invite URL format: `{NEXT_PUBLIC_APP_URL}/invite/[slug]/[token]`

---

### `folders`

Hierarchical folder structure within a workspace.

| Column             | Type        | Constraints                   | Notes                                                                    |
| ------------------ | ----------- | ----------------------------- | ------------------------------------------------------------------------ |
| `id`               | uuid        | PK, default gen_random_uuid() |                                                                          |
| `name`             | text        | NOT NULL                      |                                                                          |
| `parent_folder_id` | uuid        | nullable, FK → folders(id)    | null = root-level folder                                                 |
| `workspace_id`     | uuid        | NOT NULL, FK → workspaces(id) |                                                                          |
| `created_by`       | uuid        | nullable, FK → users(id)      |                                                                          |
| `path`             | text        | nullable                      | Materialized path for efficient subtree queries (e.g. `/root/subfolder`) |
| `depth`            | integer     | NOT NULL, default 0           | 0 = root level                                                           |
| `is_trashed`       | boolean     | NOT NULL, default false       |                                                                          |
| `trashed_at`       | timestamptz | nullable                      | When it was moved to trash                                               |
| `deleted_at`       | timestamptz | nullable                      | When it was permanently deleted                                          |
| `search_tsv`       | tsvector    | nullable                      | GIN-indexed for full-text search                                         |
| `created_at`       | timestamptz | NOT NULL, default now()       |                                                                          |
| `updated_at`       | timestamptz | NOT NULL, default now()       |                                                                          |

**Indexes:** GIN index on `search_tsv`

---

### `files`

Core file record. The actual binary is stored in Cloudflare R2; this row holds metadata.

| Column              | Type        | Constraints                   | Notes                                                                                                     |
| ------------------- | ----------- | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `id`                | uuid        | PK, default gen_random_uuid() |                                                                                                           |
| `name`              | text        | NOT NULL                      | Current display name (may differ from original after rename)                                              |
| `original_name`     | text        | NOT NULL                      | Name at upload time                                                                                       |
| `extension`         | text        | nullable                      | e.g. `pdf`, `png`                                                                                         |
| `mime_type`         | text        | nullable                      | e.g. `image/png`                                                                                          |
| `type`              | text        | NOT NULL                      | CHECK: `image \| video \| audio \| document \| archive \| code \| other`                                  |
| `size`              | bigint      | NOT NULL                      | File size in bytes                                                                                        |
| `storage_key`       | text        | NOT NULL                      | R2 object path. Never use as a public URL — always generate a signed URL.                                 |
| `thumbnail_key`     | text        | nullable                      | R2 object path for the thumbnail, if generated                                                            |
| `preview_status`    | text        | NOT NULL, default `'pending'` | CHECK: `pending \| processing \| completed \| failed \| not_applicable`                                   |
| `folder_id`         | uuid        | nullable, FK → folders(id)    | null = workspace root                                                                                     |
| `workspace_id`      | uuid        | NOT NULL, FK → workspaces(id) |                                                                                                           |
| `owner_id`          | uuid        | nullable, FK → users(id)      | The uploader                                                                                              |
| `is_trashed`        | boolean     | NOT NULL, default false       |                                                                                                           |
| `trashed_at`        | timestamptz | nullable                      |                                                                                                           |
| `deleted_at`        | timestamptz | nullable                      | Permanent deletion timestamp                                                                              |
| `last_accessed_at`  | timestamptz | nullable                      | Updated when a signed URL is generated                                                                    |
| `virus_scan_status` | text        | NOT NULL, default `'pending'` | CHECK: `pending \| scanning \| clean \| infected \| failed`. Always check before generating a signed URL. |
| `search_tsv`        | tsvector    | nullable                      | GIN-indexed for full-text search                                                                          |
| `created_at`        | timestamptz | NOT NULL, default now()       |                                                                                                           |
| `updated_at`        | timestamptz | NOT NULL, default now()       |                                                                                                           |

**Indexes:** GIN index on `search_tsv`

**Important:** Never store a signed URL in this table. Generate it on-demand per request from `storage_key`.

---

### `file_versions`

Version history for a file. Each upload of a new version creates a row here.

| Column           | Type        | Constraints                   | Notes                                      |
| ---------------- | ----------- | ----------------------------- | ------------------------------------------ |
| `id`             | uuid        | PK, default gen_random_uuid() |                                            |
| `file_id`        | uuid        | NOT NULL, FK → files(id)      |                                            |
| `version_number` | integer     | NOT NULL                      | 1-based, monotonically increasing per file |
| `storage_key`    | text        | NOT NULL                      | R2 object path for this version            |
| `size`           | bigint      | NOT NULL                      |                                            |
| `mime_type`      | text        | nullable                      |                                            |
| `extension`      | text        | nullable                      |                                            |
| `checksum`       | text        | nullable                      | e.g. SHA-256 of the file content           |
| `uploaded_by`    | uuid        | nullable, FK → users(id)      |                                            |
| `created_at`     | timestamptz | NOT NULL, default now()       |                                            |

---

### `direct_file_shares`

File-level sharing with specific users by email. Supports pre-account shares (user may not exist yet).

| Column              | Type        | Constraints                   | Notes                                                                                  |
| ------------------- | ----------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `id`                | uuid        | PK, default gen_random_uuid() |                                                                                        |
| `file_id`           | uuid        | NOT NULL, FK → files(id)      |                                                                                        |
| `shared_by`         | uuid        | NOT NULL, FK → users(id)      |                                                                                        |
| `shared_with_email` | text        | NOT NULL                      | Email of the recipient. Intentionally not a FK to users to support pre-account shares. |
| `permission`        | text        | NOT NULL                      | CHECK: `view \| edit`                                                                  |
| `created_at`        | timestamptz | NOT NULL, default now()       |                                                                                        |
| `updated_at`        | timestamptz | NOT NULL, default now()       |                                                                                        |

**Note:** Folder-level sharing is not implemented. Shares are file-level only.

---

### `public_file_links`

Public, optionally password-protected shareable links for individual files.

| Column           | Type        | Constraints                   | Notes                             |
| ---------------- | ----------- | ----------------------------- | --------------------------------- |
| `id`             | uuid        | PK, default gen_random_uuid() |                                   |
| `file_id`        | uuid        | NOT NULL, FK → files(id)      |                                   |
| `token`          | text        | NOT NULL, UNIQUE              | Random URL-safe token             |
| `password_hash`  | text        | nullable                      | bcrypt hash if password-protected |
| `allow_download` | boolean     | NOT NULL, default true        |                                   |
| `expires_at`     | timestamptz | nullable                      | null = never expires              |
| `created_at`     | timestamptz | NOT NULL, default now()       |                                   |
| `updated_at`     | timestamptz | NOT NULL, default now()       |                                   |

---

### `favorite_files`

Per-user file favorites. Simple junction table.

| Column       | Type        | Constraints                   | Notes |
| ------------ | ----------- | ----------------------------- | ----- |
| `id`         | uuid        | PK, default gen_random_uuid() |       |
| `user_id`    | uuid        | NOT NULL, FK → users(id)      |       |
| `file_id`    | uuid        | NOT NULL, FK → files(id)      |       |
| `created_at` | timestamptz | NOT NULL, default now()       |       |

**Unique constraint:** `(user_id, file_id)`

---

### `ai_metadata`

AI processing results per file. One-to-one with files.

| Column              | Type        | Constraints                      | Notes                                                                                  |
| ------------------- | ----------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| `id`                | uuid        | PK, default gen_random_uuid()    |                                                                                        |
| `file_id`           | uuid        | NOT NULL, UNIQUE, FK → files(id) | One-to-one                                                                             |
| `summary`           | text        | nullable                         | AI-generated document summary                                                          |
| `tags`              | text[]      | nullable                         | Auto-generated tags                                                                    |
| `embedding`         | vector      | nullable                         | pgvector embedding. Untyped to avoid hardcoding dimensions — varies by Gemini model.   |
| `embedding_model`   | text        | nullable                         | e.g. `text-embedding-004`. Stored alongside embedding to know which model produced it. |
| `processing_status` | text        | NOT NULL, default `'pending'`    | CHECK: `pending \| processing \| completed \| failed \| not_applicable`                |
| `error_message`     | text        | nullable                         | Populated if processing_status = 'failed'                                              |
| `processed_at`      | timestamptz | nullable                         | When processing completed                                                              |
| `created_at`        | timestamptz | NOT NULL, default now()          |                                                                                        |
| `updated_at`        | timestamptz | NOT NULL, default now()          |                                                                                        |

---

### `activity_logs`

Append-only audit log for user and workspace actions.

| Column         | Type        | Constraints                   | Notes                                                                                 |
| -------------- | ----------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `id`           | uuid        | PK, default gen_random_uuid() |                                                                                       |
| `user_id`      | uuid        | nullable, FK → users(id)      | null for system-generated events                                                      |
| `workspace_id` | uuid        | nullable, FK → workspaces(id) |                                                                                       |
| `file_id`      | uuid        | nullable, FK → files(id)      |                                                                                       |
| `folder_id`    | uuid        | nullable, FK → folders(id)    |                                                                                       |
| `action`       | text        | NOT NULL                      | Dot-namespaced string. Not an enum — new event types can be added without migrations. |
| `metadata`     | jsonb       | nullable                      | Arbitrary context (e.g. old name before rename, IP address)                           |
| `created_at`   | timestamptz | NOT NULL, default now()       |                                                                                       |

**Action naming convention:** `{domain}.{entity}.{verb}`

Examples:

- `file.upload`
- `file.rename`
- `file.delete`
- `file.trash`
- `file.restore`
- `file.share.create`
- `file.share.remove`
- `workspace.create`
- `workspace.rename`
- `workspace.delete`
- `workspace.member.invite`
- `workspace.member.join`
- `workspace.member.remove`
- `workspace.member.leave`
- `workspace.member.role_change`

---

## Relationships Overview

```
users
 ├── workspaces (owner_id)
 ├── workspace_members (user_id)
 ├── workspace_invitations (invited_by)
 ├── folders (created_by)
 ├── files (owner_id)
 ├── file_versions (uploaded_by)
 ├── direct_file_shares (shared_by)
 ├── favorite_files (user_id)
 └── activity_logs (user_id)

workspaces
 ├── workspace_members (workspace_id)
 ├── workspace_invitations (workspace_id, CASCADE DELETE)
 ├── folders (workspace_id)
 ├── files (workspace_id)
 └── activity_logs (workspace_id)

files
 ├── file_versions (file_id)
 ├── direct_file_shares (file_id)
 ├── public_file_links (file_id)
 ├── favorite_files (file_id)
 ├── ai_metadata (file_id, 1:1)
 └── activity_logs (file_id)

folders
 ├── folders (parent_folder_id, self-referential)
 ├── files (folder_id)
 └── activity_logs (folder_id)
```

---

## How to Keep This File Updated

When you run a migration:

1. Add a row to the **Changelog** table at the top with today's date, a version bump, and a short description.
2. Update the affected table section — add/remove/modify column rows.
3. Update the **Design Decisions** section if any architectural choice changed.
4. Update the **Relationships Overview** if a new FK was added or removed.
