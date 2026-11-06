-- Migration: 20261106040000_lock_releases_bucket.sql
-- Bucket "releases": leitura pública (download do APK), mas escrita SOMENTE via service_role
-- (script de release local). Impede que qualquer portador da chave anon substitua o APK.

drop policy if exists "releases_insert_all" on storage.objects;
drop policy if exists "releases_update_all" on storage.objects;

-- Mantém apenas a leitura pública para download
drop policy if exists "releases_select_all" on storage.objects;
create policy "releases_select_all" on storage.objects
  for select to public
  using (bucket_id = 'releases');
