-- Create profiles table if not exists
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    username text unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create forums table
create table if not exists public.forums (
    id bigint primary key generated always as identity,
    name varchar(100) not null,
    description text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references public.profiles(id) on delete set null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create posts table
create table if not exists public.posts (
    id bigint primary key generated always as identity,
    content text not null,
    forum_id bigint references public.forums(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update or create status_updates table
drop table if exists public.status_updates;
create table public.status_updates (
    id bigint primary key generated always as identity,
    content text not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies

-- Profiles policies
alter table public.profiles enable row level security;

-- Forums policies
alter table public.forums enable row level security;

create policy "Forums are viewable by everyone"
    on public.forums for select
    using (true);

create policy "Authenticated users can create forums"
    on public.forums for insert
    to authenticated
    with check (true);

create policy "Users can update their own forums"
    on public.forums for update
    to authenticated
    using (auth.uid() = created_by);

create policy "Users can delete their own forums"
    on public.forums for delete
    to authenticated
    using (auth.uid() = created_by);

-- Posts policies
alter table public.posts enable row level security;

create policy "Posts are viewable by everyone"
    on public.posts for select
    using (true);

create policy "Authenticated users can create posts"
    on public.posts for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own posts"
    on public.posts for update
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can delete their own posts"
    on public.posts for delete
    to authenticated
    using (auth.uid() = user_id);

-- Status updates policies
alter table public.status_updates enable row level security;

create policy "Status updates are viewable by everyone"
    on public.status_updates for select
    using (true);

create policy "Authenticated users can create status updates"
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

-- Create functions and triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger handle_forums_updated_at
    before update on public.forums
    for each row
    execute procedure public.handle_updated_at();

create trigger handle_posts_updated_at
    before update on public.posts
    for each row
    execute procedure public.handle_updated_at();

create trigger handle_status_updates_updated_at
    before update on public.status_updates
    for each row
    execute procedure public.handle_updated_at();

-- Create indexes
create index if not exists forums_created_by_idx on public.forums(created_by);
create index if not exists forums_created_at_idx on public.forums(created_at desc);
create index if not exists posts_forum_id_idx on public.posts(forum_id);
create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists status_updates_user_id_idx on public.status_updates(user_id);
create index if not exists status_updates_created_at_idx on public.status_updates(created_at desc);
