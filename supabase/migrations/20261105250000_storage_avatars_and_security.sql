-- Migration: 20261105250000_storage_avatars_and_security.sql
-- Prompt 6: Armazenamento seguro de avatars no Supabase Storage (limite 2MB, JPG/PNG/WebP, isolamento por auth.uid())

-- 1. Criar bucket avatars se não existir
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- Limite estrito de 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 2. Políticas RLS para storage.objects no bucket avatars
-- Leitura pública / acessível para os avatares carregados
drop policy if exists "avatars_select_policy" on storage.objects;
create policy "avatars_select_policy" on storage.objects
  for select using (bucket_id = 'avatars');

-- Upload próprio restrito à pasta com o ID do próprio usuário autenticado
drop policy if exists "avatars_insert_own_folder" on storage.objects;
create policy "avatars_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Atualização própria restrita à pasta do próprio usuário autenticado
drop policy if exists "avatars_update_own_folder" on storage.objects;
create policy "avatars_update_own_folder" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Exclusão própria restrita à pasta do próprio usuário autenticado
drop policy if exists "avatars_delete_own_folder" on storage.objects;
create policy "avatars_delete_own_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
