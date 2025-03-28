-- Fix status_updates table
alter table public.status_updates add column if not exists likes integer default 0;

-- Update foreign key relationship
alter table public.status_updates 
  drop constraint if exists status_updates_user_id_fkey,
  add constraint status_updates_user_id_fkey 
  foreign key (user_id) 
  references public.profiles(id) 
  on delete cascade;

-- Ensure RLS policies are correct
create policy if not exists "Users can view all status updates"
  on public.status_updates for select
  using (true);

create policy if not exists "Users can create their own status updates"
  on public.status_updates for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can delete their own status updates"
  on public.status_updates for delete
  using (auth.uid() = user_id);