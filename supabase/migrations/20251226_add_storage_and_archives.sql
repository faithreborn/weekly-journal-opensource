-- Create archives table to store HTML files metadata
CREATE TABLE archives (
  id TEXT PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  html_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on archives
ALTER TABLE archives ENABLE ROW LEVEL SECURITY;

-- Anyone can read archives
CREATE POLICY "Anyone can read archives" ON archives
  FOR SELECT USING (true);

-- Anyone can insert archives
CREATE POLICY "Anyone can insert archives" ON archives
  FOR INSERT WITH CHECK (true);

-- Anyone can delete archives
CREATE POLICY "Anyone can delete archives" ON archives
  FOR DELETE USING (true);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for HTML archives
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-archives', 'journal-archives', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'journal-images');

CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'journal-images');

CREATE POLICY "Anyone can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'journal-images');

-- Storage policies for archives bucket
CREATE POLICY "Anyone can upload archives"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'journal-archives');

CREATE POLICY "Anyone can view archives"
ON storage.objects FOR SELECT
USING (bucket_id = 'journal-archives');

CREATE POLICY "Anyone can delete archives"
ON storage.objects FOR DELETE
USING (bucket_id = 'journal-archives');
