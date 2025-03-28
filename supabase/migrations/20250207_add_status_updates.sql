-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    username text unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create status updates table with proper schema
drop table if exists public.status_updates;
create table public.status_updates (
    id bigint primary key generated always as identity,
    content text not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    likes integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.status_updates enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
    on public.profiles for select
    using (true);

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Status updates policies
create policy "Status updates are viewable by everyone"
    on public.status_updates for select
    using (true);

create policy "Users can create their own status updates"
    on public.status_updates for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own status updates"
    on public.status_updates for update
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can delete their own status updates"
    on public.status_updates for delete
    to authenticated
    using (auth.uid() = user_id);

-- Create triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger handle_status_updates_updated_at
    before update on public.status_updates
    for each row
    execute procedure public.handle_updated_at();

-- Create indexes
create index if not exists status_updates_user_id_idx on public.status_updates(user_id);
create index if not exists status_updates_created_at_idx on public.status_updates(created_at desc);
create index if not exists status_updates_likes_idx on public.status_updates(likes desc);
