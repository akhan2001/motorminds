create or replace function get_shop_id_for_current_user()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return (
    select shop_id
    from shop_users
    where user_id = auth.uid()
    limit 1
  );
end;
$$; 