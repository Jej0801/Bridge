-- Bridge storage bucket setup for photos

-- Create the photos bucket
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true);

-- Allow authenticated users to upload photos to their couple's folder
create policy "Users can upload to their couple folder"
on storage.objects for insert
with check (
  bucket_id = 'photos'
  and auth.uid()::text is not null
  and (storage.foldername(name))[1] in ('couples', 'memories')
);

-- Allow authenticated users to read all photos in their couple's folders
create policy "Users can read couple photos"
on storage.objects for select
using (
  bucket_id = 'photos'
  and auth.uid()::text is not null
);

-- Allow users to update their couple photos
create policy "Users can update couple photos"
on storage.objects for update
using (
  bucket_id = 'photos'
  and auth.uid()::text is not null
  and (storage.foldername(name))[1] in ('couples', 'memories')
);

-- Allow users to delete their couple photos
create policy "Users can delete couple photos"
on storage.objects for delete
using (
  bucket_id = 'photos'
  and auth.uid()::text is not null
  and (storage.foldername(name))[1] in ('couples', 'memories')
);
