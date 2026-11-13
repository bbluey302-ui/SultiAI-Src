-- ============================================================================
-- GCash receipt storage
-- ============================================================================
-- Receipts are private. Learners may only write/read inside their own uid
-- folder; the admin console uses the service role and mints short-lived
-- signed URLs when reviewing a top-up request.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ai-receipts',
  'ai-receipts',
  false,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ai_receipts_insert_own" on storage.objects;
create policy "ai_receipts_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ai-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ai_receipts_read_own" on storage.objects;
create policy "ai_receipts_read_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ai-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ai_receipts_delete_own" on storage.objects;
create policy "ai_receipts_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ai-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
