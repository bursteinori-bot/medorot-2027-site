-- Medorot 2027: database schema (Neon Postgres, connected through Vercel).
-- The public never talks to the database directly: submissions go through the site's server functions
-- (api/applications/*). Admin access (next phase) goes through server functions with signed-in admin sessions.

create extension if not exists pgcrypto;

-- ───────────────────────── admin users and sessions ─────────────────────────
create type admin_role as enum ('admin', 'editor', 'reviewer');

create table admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  display_name  text,
  password_hash text,                                  -- scrypt; null until the invite is accepted
  role          admin_role not null default 'reviewer',
  can_publish   boolean not null default false,        -- editors publish only when granted
  invited_by    uuid references admin_users (id),
  invite_token  text unique,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

create table admin_sessions (
  token_hash text primary key,                         -- sha256 of the cookie value
  user_id    uuid not null references admin_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- ───────────────────────── applications ─────────────────────────
create type application_status as enum ('draft', 'new', 'in_review', 'shortlisted', 'accepted', 'rejected', 'needs_info');

create table applications (
  id                   uuid primary key,               -- = the browser's idempotency key: a retry finds its own record
  status               application_status not null default 'draft',
  answers              jsonb not null,                 -- the applicant's original answers, never edited
  -- copies of the answers used for search, filters and sorting
  name                 text not null,
  email                text not null,
  phone                text not null,
  age                  int,
  city                 text,
  identity             text,
  project              text not null,
  disciplines          text[] not null default '{}',
  location             text,
  stage                text,
  ip_hash              text,
  created_at           timestamptz not null default now(),
  submitted_at         timestamptz,
  updated_at           timestamptz not null default now(),
  notification_sent_at timestamptz,
  notification_error   text
);
create index applications_status_idx on applications (status);
create index applications_submitted_idx on applications (submitted_at desc);

-- attachments live in the database (private by construction); large videos are submitted as links
create table application_files (
  application_id uuid not null references applications (id) on delete cascade,
  position       int not null,
  original_name  text not null,
  size_bytes     int not null,
  mime_type      text,
  data           bytea,                                -- null until the upload arrives
  uploaded_at    timestamptz,
  primary key (application_id, position)
);

create table application_notes (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications (id) on delete cascade,
  author_id      uuid references admin_users (id),
  body           text not null check (length(body) between 1 and 10000),
  created_at     timestamptz not null default now()
);

-- an admin's correction is recorded beside the original answer, never over it
create table application_corrections (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications (id) on delete cascade,
  field          text not null,
  old_value      jsonb,
  new_value      jsonb,
  reason         text,
  author_id      uuid references admin_users (id),
  created_at     timestamptz not null default now()
);

create table application_status_history (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications (id) on delete cascade,
  from_status    application_status,
  to_status      application_status not null,
  changed_by     uuid references admin_users (id),
  changed_at     timestamptz not null default now()
);

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger applications_touch before update on applications for each row execute function touch_updated_at();

-- every status change is logged; the acting admin is passed per transaction with set_config('app.admin_id', …)
create or replace function log_status_change() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into application_status_history (application_id, from_status, to_status, changed_by)
    values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status, nullif(current_setting('app.admin_id', true), '')::uuid);
  end if;
  return null;
end $$;
create trigger applications_status_log after insert or update on applications for each row execute function log_status_change();

-- the original answers can't be overwritten once submitted
create or replace function guard_answers() returns trigger language plpgsql as $$
begin
  if old.status <> 'draft' and (new.answers is distinct from old.answers or new.email is distinct from old.email or new.name is distinct from old.name) then
    raise exception 'original answers cannot be changed after submission; record a correction instead';
  end if;
  return new;
end $$;
create trigger applications_guard before update on applications for each row execute function guard_answers();

-- simple per-IP rate limiting for the public form
create table submission_attempts (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);
create index submission_attempts_idx on submission_attempts (ip_hash, created_at desc);

-- ───────────────────────── website content (CMS) ─────────────────────────
create type content_status as enum ('draft', 'published', 'archived');

create table site_content_versions (
  id           uuid primary key default gen_random_uuid(),
  content      jsonb not null,
  status       content_status not null default 'draft',
  note         text,
  created_by   uuid references admin_users (id),
  created_at   timestamptz not null default now(),
  published_by uuid references admin_users (id),
  published_at timestamptz
);
create unique index site_content_one_published on site_content_versions ((true)) where status = 'published';

create table media_assets (
  id          uuid primary key default gen_random_uuid(),
  file_name   text not null,
  mime_type   text not null,
  data        bytea not null,
  alt         text not null default '',
  caption     text,
  section     text,                                    -- e.g. "spaces/hall"
  sort_order  int not null default 0,
  created_by  uuid references admin_users (id),
  created_at  timestamptz not null default now()
);

create table schema_migrations (name text primary key, applied_at timestamptz not null default now());
