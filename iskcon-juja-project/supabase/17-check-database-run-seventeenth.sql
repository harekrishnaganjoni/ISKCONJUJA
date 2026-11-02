-- ISKCON JUJA: read-only check (changes nothing). Paste into the Supabase SQL Editor, Run, and send me the result.
select 'table' as kind, table_schema || '.' || table_name as name from information_schema.tables
 where table_schema not in ('pg_catalog','information_schema','auth','storage','realtime','vault','extensions','graphql','graphql_public','pgsodium','supabase_migrations','net','cron','pgbouncer')
union all
select 'function', n.nspname || '.' || p.proname || ' = ' || left(regexp_replace(pg_get_functiondef(p.oid), '\s+', ' ', 'g'), 300)
 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('is_admin','is_member')
order by 1, 2;
