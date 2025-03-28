-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    username text unique,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update forums table with proper foreign key
alter table public.forums add column if not exists user_id uuid references public.profiles(id) on delete set null;

-- Create status_updates table
create table if not exists public.status_updates (
    id bigint primary key generated always as identity,
    content text not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    likes integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create conversations table
create table if not exists public.conversations (
    id bigint primary key generated always as identity,
    participant1_id uuid references public.profiles(id) on delete cascade not null,
    participant2_id uuid references public.profiles(id) on delete cascade not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.profiles enable row level security;
alter table public.status_updates enable row level security;
alter table public.conversations enable row level security;

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

create policy "Users can insert their own status updates"
    on public.status_updates for insert
    with check (auth.uid() = user_id);

create policy "Users can update own status updates"
    on public.status_updates for update
    using (auth.uid() = user_id);

-- Conversations policies
create policy "Users can view their own conversations"
    on public.conversations for select
    using (auth.uid() = participant1_id or auth.uid() = participant2_id);

create policy "Users can insert conversations they're part of"
    on public.conversations for insert
    with check (auth.uid() in (participant1_id, participant2_id));