-- Create profiles table first
create table if not exists public.profiles (
  id uuid references auth.users(id) primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create profiles policies
DO $$ BEGIN
CREATE POLICY IF NOT EXISTS "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING ( true );

CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );

CREATE POLICY IF NOT EXISTS "Users can delete their own profile"
  ON profiles FOR DELETE
  USING ( auth.uid() = id );
END $$;

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
