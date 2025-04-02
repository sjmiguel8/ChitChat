-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    username text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Function to automatically create profile for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

-- Trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert profiles for existing users who don't have one
insert into public.profiles (id)
select id from auth.users
where id not in (select id from public.profiles);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Add RLS policies for profiles
create policy if not exists "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy if not exists "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create status_updates table
create table if not exists public.status_updates (
    id bigint primary key generated always as identity,
    content text not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    likes integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on status_updates
alter table public.status_updates enable row level security;

-- Add RLS policies for status_updates
create policy if not exists "Status updates are viewable by everyone"
  on public.status_updates for select
  using (true);

create policy if not exists "Users can create their own status updates"
  on public.status_updates for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update their own status updates"
  on public.status_updates for update
  using (auth.uid() = user_id);

create policy if not exists "Users can delete their own status updates"
  on public.status_updates for delete
  using (auth.uid() = user_id);

-- Add indexes
create index if not exists status_updates_user_id_idx on public.status_updates(user_id);
create index if not exists status_updates_created_at_idx on public.status_updates(created_at desc);