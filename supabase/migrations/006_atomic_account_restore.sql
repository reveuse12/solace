-- Restore user-owned rows as one transaction. No security-definer privileges or RLS bypass.
create or replace function public.restore_account_backup(backup jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id text := auth.jwt()->>'sub';
  table_name text;
  allowed text[] := array['profiles','desires','intentions','reflections','visualizations','listening_progress','favorites','reminders'];
  rows jsonb;
  columns_sql text;
  update_sql text;
  conflict_sql text;
  total bigint := 0;
begin
  if owner_id is null or owner_id = '' then raise exception 'Authentication required' using errcode = '28000'; end if;
  if jsonb_typeof(backup) is distinct from 'object' then raise exception 'Invalid backup'; end if;
  -- Validate every section before applying anything. Any subsequent error rolls everything back.
  foreach table_name in array allowed loop
    if backup ? table_name then
      if jsonb_typeof(backup->table_name) is distinct from 'array' then raise exception 'Invalid backup section'; end if;
      if jsonb_array_length(backup->table_name) > 10000 then raise exception 'Backup section too large'; end if;
      total := total + jsonb_array_length(backup->table_name);
      if exists (select 1 from jsonb_array_elements(backup->table_name) as r(value) where jsonb_typeof(value) <> 'object') then raise exception 'Invalid backup record'; end if;
    end if;
  end loop;
  if total = 0 or total > 50000 then raise exception 'Invalid backup size'; end if;
  foreach table_name in array allowed loop
    if not (backup ? table_name) or jsonb_array_length(backup->table_name) = 0 then continue; end if;
    select jsonb_agg(
      jsonb_build_object('id', gen_random_uuid(), 'created_at', now(), 'updated_at', now(),
        'status', 'active', 'completed', false, 'position_seconds', 0, 'enabled', true,
        'days', jsonb_build_array(0,1,2,3,4,5,6), 'timezone', 'UTC', 'label', 'Daily practice')
      || value || jsonb_build_object('clerk_user_id', owner_id)
    ) into rows from jsonb_array_elements(backup->table_name) as r(value);
    select string_agg(format('%I', attname), ', ' order by attnum),
      string_agg(format('%1$I = excluded.%1$I', attname), ', ' order by attnum)
        filter (where attname <> 'clerk_user_id' and attname <> 'id' and attname <> 'audio_key')
    into columns_sql, update_sql
    from pg_catalog.pg_attribute
    where attrelid = ('public.' || table_name)::regclass and attnum > 0 and not attisdropped and attgenerated = '';
    conflict_sql := case when table_name = 'profiles' then 'clerk_user_id'
      when table_name in ('favorites','listening_progress') then 'clerk_user_id, audio_key' else 'id' end;
    -- Table and column identifiers come from the fixed allowlist/catalog, never from the backup.
    execute format('insert into public.%1$I (%2$s) select %2$s from jsonb_populate_recordset(null::public.%1$I, $1) on conflict (%3$s) do update set %4$s',
      table_name, columns_sql, conflict_sql, update_sql) using rows;
  end loop;
  return jsonb_build_object('restored', true, 'records', total);
end;
$$;
revoke all on function public.restore_account_backup(jsonb) from public;
grant execute on function public.restore_account_backup(jsonb) to authenticated;
notify pgrst, 'reload schema';
