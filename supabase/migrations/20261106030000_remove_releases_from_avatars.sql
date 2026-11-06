-- Migration: 20261106030000_remove_releases_from_avatars.sql
-- Remover política avatars_select_releases_anon e restringir avatars_select_own_folder estritamente à dona da pasta (auth.uid())

-- 1. Remover a política de acesso anônimo a releases no bucket avatars
drop policy if exists "avatars_select_releases_anon" on storage.objects;
drop policy if exists "avatars_select_all" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;

-- 2. Atualizar avatars_select_own_folder removendo qualquer referência à pasta releases
drop policy if exists "avatars_select_own_folder" on storage.objects;
create policy "avatars_select_own_folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
