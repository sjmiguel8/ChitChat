-- Create status_updates table
create table if not exists public.status_updates (
    id bigint primary key generated always as identity,
    content text not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.status_updates enable row level security;

-- RLS policies
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

-- Create trigger for updated_at
create trigger handle_status_updates_updated_at
    before update on public.status_updates
    for each row
    execute procedure public.handle_updated_at();

-- Create indexes
create index if not exists status_updates_user_id_idx on public.status_updates(user_id);
create index if not exists status_updates_created_at_idx on public.status_updates(created_at desc);
