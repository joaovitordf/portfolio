-- Keep publication retention compatible with Supabase's safe-update guard.
-- The previous trigger updated every publication without a WHERE clause.

create or replace function portfolio_editorial.enforce_publication_retention()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  with keep as materialized (
    select candidate.id
    from portfolio_editorial.publications candidate
    cross join portfolio_editorial.site_state s
    order by (candidate.id = s.active_publication_id) desc, candidate.sequence desc
    limit 10
  )
  update portfolio_editorial.publications p
  set retained = (p.id in (select id from keep))
  where p.retained is distinct from (p.id in (select id from keep));

  return new;
end
$$;

