import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const snapshotPath = resolve(
  root,
  'spec/05-verificacao/ativacao-painel-admin-joao-vitor/initial-editorial-snapshot-joao-v1.json',
);
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
const compactSnapshot = JSON.stringify(snapshot).replaceAll("'", "''");
const snapshotHash = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');

const editorialSqlPath = resolve(root, 'supabase/setup_editorial_joao_vitor.sql');

// Storage buckets and policies for public media (curricula, project-images, skill-icons)
const storageHeaderSql = `
-- =====================================================================
-- SETUP EDITORIAL CMS & STORAGE — JOÃO VITOR DIAS FERNANDES
-- =====================================================================
-- 0. Buckets de Storage e Políticas para Upload de Currículos e Imagens

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('project-images', 'project-images', true, 1048576, array['image/png', 'image/jpeg']),
  ('skill-icons', 'skill-icons', true, 1048576, array['image/png', 'image/jpeg', 'image/svg+xml']),
  ('curricula', 'curricula', true, 52428800, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('project-images', 'skill-icons', 'curricula'));

drop policy if exists storage_admin_insert on storage.objects;
create policy storage_admin_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('project-images', 'skill-icons', 'curricula')
    and exists (
      select 1 from public.portfolio_admins
      where user_id = (select auth.uid())
    )
  );

drop policy if exists storage_admin_update on storage.objects;
create policy storage_admin_update
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('project-images', 'skill-icons', 'curricula')
    and exists (
      select 1 from public.portfolio_admins
      where user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id in ('project-images', 'skill-icons', 'curricula')
    and exists (
      select 1 from public.portfolio_admins
      where user_id = (select auth.uid())
    )
  );

grant delete on storage.objects to authenticated;

drop policy if exists storage_admin_delete on storage.objects;
create policy storage_admin_delete
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('project-images', 'skill-icons', 'curricula')
    and exists (
      select 1 from public.portfolio_admins
      where user_id = (select auth.uid())
    )
  );

-- Políticas em portfolio_files para currículos
alter table public.portfolio_files enable row level security;

drop policy if exists portfolio_files_public_read on public.portfolio_files;
create policy portfolio_files_public_read
  on public.portfolio_files for select
  to anon, authenticated
  using (true);

drop policy if exists portfolio_files_admin_insert on public.portfolio_files;
create policy portfolio_files_admin_insert
  on public.portfolio_files for insert
  to authenticated
  with check (exists (
    select 1 from public.portfolio_admins
    where user_id = (select auth.uid())
  ));

drop policy if exists portfolio_files_admin_update on public.portfolio_files;
create policy portfolio_files_admin_update
  on public.portfolio_files for update
  to authenticated
  using (exists (
    select 1 from public.portfolio_admins
    where user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.portfolio_admins
    where user_id = (select auth.uid())
  ));

drop policy if exists portfolio_files_admin_delete on public.portfolio_files;
create policy portfolio_files_admin_delete
  on public.portfolio_files for delete
  to authenticated
  using (exists (
    select 1 from public.portfolio_admins
    where user_id = (select auth.uid())
  ));

-- RPCs de substituição de mídias no catálogo público
create or replace function public.replace_portfolio_curriculum(
  p_locale text,
  p_storage_path text,
  p_original_name text,
  p_mime_type text,
  p_size_bytes bigint
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_storage_path text;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null or not exists (select 1 from public.portfolio_admins where user_id = v_user_id) then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select storage_path into previous_storage_path
  from public.portfolio_files
  where file_type = 'curriculum' and locale = p_locale;

  if previous_storage_path is null then
    insert into public.portfolio_files (file_type, locale, storage_path, original_name, mime_type, size_bytes)
    values ('curriculum', p_locale, p_storage_path, p_original_name, p_mime_type, p_size_bytes);
    return p_storage_path;
  else
    update public.portfolio_files
    set storage_path = p_storage_path,
        original_name = p_original_name,
        mime_type = p_mime_type,
        size_bytes = p_size_bytes,
        updated_at = now()
    where file_type = 'curriculum' and locale = p_locale;
    return previous_storage_path;
  end if;
end;
$$;

revoke execute on function public.replace_portfolio_curriculum(text, text, text, text, bigint) from public, anon;
grant execute on function public.replace_portfolio_curriculum(text, text, text, text, bigint) to authenticated;

create or replace function public.replace_portfolio_project_image(
  p_image_id uuid,
  p_storage_path text,
  p_original_name text,
  p_mime_type text,
  p_size_bytes bigint
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_storage_path text;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null or not exists (select 1 from public.portfolio_admins where user_id = v_user_id) then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select storage_path into previous_storage_path
  from public.portfolio_project_images
  where id = p_image_id;

  if previous_storage_path is null then
    raise exception 'Project image not found';
  end if;

  update public.portfolio_project_images
  set storage_path = p_storage_path,
      original_name = p_original_name,
      mime_type = p_mime_type,
      size_bytes = p_size_bytes
  where id = p_image_id;

  return previous_storage_path;
end;
$$;

revoke execute on function public.replace_portfolio_project_image(uuid, text, text, text, bigint) from public, anon;
grant execute on function public.replace_portfolio_project_image(uuid, text, text, text, bigint) to authenticated;
`;

// List of migrations in order from 20260926093000 onwards (skipping 20260926103000 which imported Marcos's snapshot)
const migrationFiles = [
  '20260926093000_create_private_editorial_schema.sql',
  '20260926100000_create_private_editorial_media_flow.sql',
  // initial snapshot import inserted here dynamically with João's data
  '20260926110000_create_atomic_editorial_commands.sql',
  '20260926113000_validate_editorial_publication.sql',
  '20260926120000_publish_editorial_draft.sql',
  '20260926123000_create_versioned_public_reader.sql',
  '20260926130000_discard_editorial_draft.sql',
  '20260926133000_create_editorial_history.sql',
  '20260926140000_read_draft_and_manage_technologies.sql',
  '20260926143000_create_draft_section_order.sql',
  '20260926200000_fix_editorial_curriculum_limit.sql',
  '20260927001500_fix_legacy_curriculum_limit.sql',
  '20260927003000_add_editorial_locale_lifecycle.sql',
  '20260927004000_add_editorial_media_association.sql',
  '20260927120000_shared_skill_catalog.sql',
  '20260927133000_centralize_skill_catalog_management.sql',
  '20260927134500_publish_shared_skill_catalog.sql',
  '20260927135000_sync_skill_catalog_labels.sql',
  '20260927141000_grant_editorial_storage_finalize_access.sql',
];

function sanitizeMigration(sql) {
  let res = sql;

  // Schema creation idempotency
  res = res.replace(/create schema portfolio_editorial/gi, 'create schema if not exists portfolio_editorial');

  // Table creation idempotency
  res = res.replace(/create table portfolio_editorial\./gi, 'create table if not exists portfolio_editorial.');
  res = res.replace(/create table if not exists if not exists/gi, 'create table if not exists');

  // Index creation idempotency
  res = res.replace(/create index /gi, 'create index if not exists ');
  res = res.replace(/create index if not exists if not exists/gi, 'create index if not exists');

  // Safe drop constraint
  res = res.replace(/drop constraint (?:if exists )?([a-zA-Z0-9_]+);/gi, 'drop constraint if exists $1;');

  // Policy creation idempotency: drop before create without duplicating
  res = res.replace(/(?:drop policy if exists\s+[a-zA-Z0-9_]+\s+on\s+[a-zA-Z0-9_.]+;\s*)?create policy\s+([a-zA-Z0-9_]+)\s+on\s+([a-zA-Z0-9_.]+)/gi, 'drop policy if exists $1 on $2;\ncreate policy $1 on $2');

  // Specific table insert idempotencies
  res = res.replace('insert into portfolio_editorial.draft (id) values (1);', 'insert into portfolio_editorial.draft (id) values (1) on conflict (id) do nothing;');
  res = res.replace("values (1, 'pt-BR', 'Português', 'ltr', 'active', 0);", "values (1, 'pt-BR', 'Português', 'ltr', 'active', 0) on conflict (draft_id, code) do nothing;");
  res = res.replace('insert into portfolio_editorial.site_state (id) values (1);', 'insert into portfolio_editorial.site_state (id) values (1) on conflict (id) do nothing;');

  // Safe add constraint draft_base_publication_fk
  res = res.replace(
    'add constraint draft_base_publication_fk',
    'drop constraint if exists draft_base_publication_fk;\n  alter table portfolio_editorial.draft add constraint draft_base_publication_fk'
  );

  // Drop triggers if exist before creating (avoid duplicate drop trigger)
  const triggers = [
    ['protect_default_locale', 'portfolio_editorial.draft_locales'],
    ['protect_publication_payload', 'portfolio_editorial.publications'],
    ['validate_media_reference', 'portfolio_editorial.draft_media_refs'],
    ['track_publication_access', 'portfolio_editorial.site_state'],
    ['enforce_publication_retention', 'portfolio_editorial.site_state'],
    ['sync_draft_sections', 'portfolio_editorial.draft'],
    ['sync_skill_catalog_label', 'portfolio_editorial.technologies'],
  ];

  for (const [trig, tbl] of triggers) {
    const rx = new RegExp(`(?:drop trigger if exists\\s+${trig}\\s+on\\s+${tbl.replace('.', '\\.')};\\s*)?create trigger\\s+${trig}`, 'gi');
    res = res.replace(rx, `drop trigger if exists ${trig} on ${tbl};\ncreate trigger ${trig}`);
  }

  return res;
}

let fullSql = storageHeaderSql + '\n\n';

// 1. Initial schema & media flow
const part1 = sanitizeMigration(await readFile(resolve(root, 'supabase/migrations', migrationFiles[0]), 'utf8'));
const part2 = sanitizeMigration(await readFile(resolve(root, 'supabase/migrations', migrationFiles[1]), 'utf8'));

fullSql += `-- Migration: ${migrationFiles[0]}\n` + part1 + '\n\n';
fullSql += `-- Migration: ${migrationFiles[1]}\n` + part2 + '\n\n';

// 2. Snapshot import for João Vitor
fullSql += `-- Importação do snapshot inicial editorial de João Vitor
do $$ declare payload jsonb := '${compactSnapshot}'::jsonb; begin
insert into portfolio_editorial.draft_locales(draft_id,code,label,direction,status,position) values (1,'en','English','ltr','active',1) on conflict(draft_id,code) do update set label=excluded.label,status=excluded.status,position=excluded.position;
insert into portfolio_editorial.draft_entities(draft_id,id,kind,parent_id,position,data) select 1,e.key,e.value->>'kind',nullif(e.value->>'parentId',''),(e.value->>'position')::int,e.value->'data' from jsonb_each(payload->'entities') e on conflict(draft_id,id) do update set kind=excluded.kind,parent_id=excluded.parent_id,position=excluded.position,data=excluded.data;
insert into portfolio_editorial.draft_translations(draft_id,entity_id,locale_code,fields) select 1,e.key,l.key,l.value->e.key from jsonb_each(payload->'entities') e cross join jsonb_each(payload->'translations') l on conflict(draft_id,entity_id,locale_code) do update set fields=excluded.fields;
insert into portfolio_editorial.technologies(id,label,aliases,bundled_asset) select t.key,t.value->>'label',array(select jsonb_array_elements_text(t.value->'aliases')),case when t.value ? 'iconMediaId' then payload->'media'->(t.value->>'iconMediaId')->>'assetPath' end from jsonb_each(payload->'technologies') t on conflict(id) do update set label=excluded.label,aliases=excluded.aliases,bundled_asset=excluded.bundled_asset;
insert into portfolio_editorial.publications(id,format_version,snapshot,hash,source_revision) values ('${snapshot.publicationId}',1,payload,'${snapshotHash}',0) on conflict(id) do nothing;
update portfolio_editorial.draft set base_publication_id='${snapshot.publicationId}',updated_at=now() where id=1;
update portfolio_editorial.site_state set active_publication_id='${snapshot.publicationId}',updated_at=now() where id=1;
end $$;\n\n`;

// 3. Append remaining migrations
for (let i = 2; i < migrationFiles.length; i++) {
  const content = sanitizeMigration(await readFile(resolve(root, 'supabase/migrations', migrationFiles[i]), 'utf8'));
  fullSql += `-- Migration: ${migrationFiles[i]}\n` + content + '\n\n';
}

// 4. Security fix for portfolio_admins
fullSql += `-- Segurança: revogar leitura anônima de portfolio_admins
revoke select on public.portfolio_admins from anon;
`;

await writeFile(editorialSqlPath, fullSql, 'utf8');
console.log('Script SQL montado com sucesso em:', editorialSqlPath);
console.log('Tamanho total:', fullSql.length, 'bytes');
