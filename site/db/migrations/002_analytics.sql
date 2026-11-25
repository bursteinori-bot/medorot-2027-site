-- Anonymous usage statistics. No cookies, no IP addresses, no personal data: a visitor is a hash of
-- (IP + browser + date + secret), so the same person can't be followed from one day to the next.
create table analytics_events (
  id            bigint generated always as identity primary key,
  at            timestamptz not null default now(),
  visitor       text not null,                         -- daily-rotating anonymous hash
  session       text not null,                         -- random per browser tab
  type          text not null check (type in ('pageview', 'event')),
  name          text not null,                         -- section for page views, event name otherwise
  referrer_host text,                                  -- e.g. instagram.com (host only, never the full URL)
  device        text,                                  -- mobile / tablet / desktop
  country       text,                                  -- ISO code from the edge network
  city          text,
  props         jsonb
);
create index analytics_events_at_idx on analytics_events (at desc);
create index analytics_events_name_idx on analytics_events (type, name, at desc);
create index analytics_events_session_idx on analytics_events (session, at);
