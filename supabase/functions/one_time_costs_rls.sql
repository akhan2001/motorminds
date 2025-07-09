-- Enable RLS
alter table public.one_time_costs enable row level security;

-- Create policy for SELECT
drop policy if exists "Allow select for own shop" on public.one_time_costs;
create policy "Allow select for own shop"
on public.one_time_costs
for select
using (shop_id = (select get_shop_id_for_current_user()));

-- Create policy for INSERT
drop policy if exists "Allow insert for own shop" on public.one_time_costs;
create policy "Allow insert for own shop"
on public.one_time_costs
for insert
with check (shop_id = (select get_shop_id_for_current_user()));

-- Create policy for UPDATE
drop policy if exists "Allow update for own shop" on public.one_time_costs;
create policy "Allow update for own shop"
on public.one_time_costs
for update
using (shop_id = (select get_shop_id_for_current_user()));

-- Create policy for DELETE
drop policy if exists "Allow delete for own shop" on public.one_time_costs;
create policy "Allow delete for own shop"
on public.one_time_costs
for delete
using (shop_id = (select get_shop_id_for_current_user())); 