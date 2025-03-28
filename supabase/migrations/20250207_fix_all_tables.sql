-- Drop existing tables if they exist to start fresh
drop table if exists public.posts cascade;
drop table if exists public.forums cascade;
drop table if exists public.profiles cascade;

-- Create profiles table first (since other tables reference it)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create forums table
create table if not exists public.forums (
    id bigint primary key generated always as identity,
    name text not null,
    description text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create posts table
create table if not exists public.posts (
    id bigint primary key generated always as identity,
    content text not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    forum_id bigint references public.forums(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.forums enable row level security;
alter table public.posts enable row level security;

-- Set up RLS policies
DO $$ BEGIN
    -- Profiles policies
    create policy "Public profiles are viewable by everyone" 
        on profiles for select using (true);
    
    create policy "Users can create their own profile" 
        on profiles for insert with check (auth.uid() = id);
    
    create policy "Users can update their own profile" 
        on profiles for update using (auth.uid() = id);

    -- Forums policies
    create policy "Forums are viewable by everyone" 
        on forums for select using (true);
    
    create policy "Authenticated users can create forums" 
        on forums for insert to authenticated with check (true);
    
    create policy "Users can update own forums" 
        on forums for update using (auth.uid() = created_by);

    -- Posts policies
    create policy "Posts are viewable by everyone" 
        on posts for select using (true);
    
    create policy "Authenticated users can create posts" 
        on posts for insert to authenticated with check (auth.uid() = user_id);
    
    create policy "Users can update own posts" 
        on posts for update using (auth.uid() = user_id);
    
    create policy "Users can delete own posts" 
        on posts for delete using (auth.uid() = user_id);
END $$;

-- Create trigger for new user profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, full_name, avatar_url)
    values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
