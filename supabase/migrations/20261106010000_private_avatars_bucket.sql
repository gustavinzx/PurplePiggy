-- Migration: 20261106010000_private_avatars_bucket.sql
-- Tornar o bucket "avatars" privado (public=false), remover select aberto e isolar leitura/escrita por auth.uid()

-- 1. Tornar o bucket avatars privado
update storage.buckets
set public = false
where id = 'avatars';

-- 2. Remover a política de select aberta anterior
drop policy if exists "avatars_select_policy" on storage.objects;

-- 3. Criar política de select restrita para a dona da pasta (auth.uid()) e pasta releases
drop policy if exists "avatars_select_own_folder" on storage.objects;
create policy "avatars_select_own_folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (storage.foldername(name))[1] = 'releases'
    )
  );

-- Garantir que releases continue legível publicamente para download do APK
drop policy if exists "avatars_select_releases_anon" on storage.objects;
create policy "avatars_select_releases_anon" on storage.objects
  for select to anon
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'releases'
  );

-- 4. Garantir que políticas de insert, update e delete continuem estritamente restritas à dona da pasta
drop policy if exists "avatars_insert_own_folder" on storage.objects;
create policy "avatars_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own_folder" on storage.objects;
create policy "avatars_update_own_folder" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own_folder" on storage.objects;
create policy "avatars_delete_own_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
