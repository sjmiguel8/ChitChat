-- Enable RLS on profiles table
alter table public.profiles enable row level security;

-- Allow users to read any profile
create policy "Profiles are viewable by everyone"
    on public.profiles for select
    using (true);

-- Allow users to insert their own profile
create policy "Users can create their own profile"
    on public.profiles for insert
    to authenticated
    with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update their own profile"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id);

-- Allow users to delete their own profile
create policy "Users can delete their own profile"
    on public.profiles for delete
    to authenticated
    using (auth.uid() = id);
