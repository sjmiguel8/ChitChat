-- Create migrations table
create table if not exists public._migrations (
    id bigint primary key generated always as identity,
    name text not null unique,
    executed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create helper function for running SQL
create or replace function run_sql(query text)
returns void as $$
begin
    execute query;
end;
$$ language plpgsql security definer;