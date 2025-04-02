create table if not exists public.replies (
    id bigint primary key generated always as identity,
    content text not null,
    post_id bigint references public.posts(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.replies enable row level security;

-- Add RLS policies
create policy "Replies are viewable by everyone"
  on public.replies for select
  using (true);

create policy "Authenticated users can create replies"
  on public.replies for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own replies"
  on public.replies for update
  using (auth.uid() = user_id);

create policy "Users can delete their own replies"
  on public.replies for delete
  using (auth.uid() = user_id);
