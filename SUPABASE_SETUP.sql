-- NA Plumber Service: one-time Supabase setup
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- This file contains no secret keys.

-- Make sure all booking fields exist.
alter table public.bookings add column if not exists customer_name text;
alter table public.bookings add column if not exists phone text;
alter table public.bookings add column if not exists service text;
alter table public.bookings add column if not exists address text;
alter table public.bookings add column if not exists problem text;
alter table public.bookings add column if not exists booking_date date;
alter table public.bookings add column if not exists booking_time time;
alter table public.bookings add column if not exists status text default 'Pending';
alter table public.bookings add column if not exists map_location text;

-- Enable Row Level Security.
alter table public.bookings enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.bookings to anon, authenticated;
grant select, update on table public.bookings to authenticated;

drop policy if exists "Allow public booking insert" on public.bookings;
drop policy if exists "Owner can read bookings" on public.bookings;
drop policy if exists "Owner can update bookings" on public.bookings;

-- Public customers can create bookings. This also covers a browser that still has
-- the owner's Supabase login session active, which otherwise uses the authenticated role.
create policy "Allow public booking insert"
on public.bookings
for insert
to anon, authenticated
with check (true);

-- Only the owner account can read the bookings dashboard.
create policy "Owner can read bookings"
on public.bookings
for select
to authenticated
using (
  auth.jwt() ->> 'email' = 'naplumberservicehyderabad@gmail.com'
);

-- Only the owner account can change booking status.
create policy "Owner can update bookings"
on public.bookings
for update
to authenticated
using (
  auth.jwt() ->> 'email' = 'naplumberservicehyderabad@gmail.com'
)
with check (
  auth.jwt() ->> 'email' = 'naplumberservicehyderabad@gmail.com'
);
