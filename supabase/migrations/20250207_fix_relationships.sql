-- Drop and recreate tables to fix relationships
drop table if exists public.posts;
drop table if exists public.forums;
drop table if exists public.status_updates;
drop table if exists public.conversations;

-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create forums table
create table if not exists public.forums (
    id bigint primary key generated always as identity,
    name varchar(100) not null,
    description text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references public.profiles(id) on delete cascade not null,
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

-- Create status_updates table
create table if not exists public.status_updates (
    id bigint primary key generated always as identity,
    content text not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    likes integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create conversations table
create table if not exists public.conversations (
    id bigint primary key generated always as identity,
    participant1_id uuid references public.profiles(id) on delete cascade not null,
    participant2_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(participant1_id, participant2_id)
);

-- Create messages table
create table if not exists public.messages (
    id bigint primary key generated always as identity,
    conversation_id bigint references public.conversations(id) on delete cascade not null,
    sender_id uuid references public.profiles(id) on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.forums enable row level security;
alter table public.posts enable row level security;
alter table public.status_updates enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- RLS Policies for forums
create policy "Forums are viewable by everyone"
    on public.forums for select using (true);
create policy "Authenticated users can create forums"
    on public.forums for insert
    to authenticated
    with check (auth.uid() = created_by);
create policy "Users can update their own forums"
    on public.forums for update
    to authenticated
    using (auth.uid() = created_by);
create policy "Users can delete their own forums"
    on public.forums for delete
    to authenticated
    using (auth.uid() = created_by);

-- RLS Policies for posts
create policy "Posts are viewable by everyone"
    on public.posts for select using (true);
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

-- RLS Policies for status updates
create policy "Status updates are viewable by everyone"
    on public.status_updates for select using (true);
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

-- RLS Policies for conversations
create policy "Users can view their own conversations"
    on public.conversations for select
    to authenticated
    using (auth.uid() = participant1_id or auth.uid() = participant2_id);
create policy "Authenticated users can create conversations"
    on public.conversations for insert
    to authenticated
    with check (auth.uid() = participant1_id or auth.uid() = participant2_id);

-- RLS Policies for messages
create policy "Users can view messages in their conversations"
    on public.messages for select
    to authenticated
    using (
        exists (
            select 1 from public.conversations
            where id = conversation_id
            and (participant1_id = auth.uid() or participant2_id = auth.uid())
        )
    );
create policy "Users can send messages in their conversations"
    on public.messages for insert
    to authenticated
    with check (
        exists (
            select 1 from public.conversations
            where id = conversation_id
            and (participant1_id = auth.uid() or participant2_id = auth.uid())
        )
        and auth.uid() = sender_id
    );

-- Indexes
create index if not exists forums_created_by_idx on public.forums(created_by);
create index if not exists forums_created_at_idx on public.forums(created_at desc);
create index if not exists posts_forum_id_idx on public.posts(forum_id);
create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists status_updates_user_id_idx on public.status_updates(user_id);
create index if not exists status_updates_created_at_idx on public.status_updates(created_at desc);
create index if not exists conversations_participant1_idx on public.conversations(participant1_id);
create index if not exists conversations_participant2_idx on public.conversations(participant2_id);
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_created_at_idx on public.messages(created_at desc);
