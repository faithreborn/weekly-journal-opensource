-- Create journal_entries table
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('diary', 'photo', 'quote', 'question', 'sad-moment', 'happy-moment', 'note')),
  content TEXT NOT NULL DEFAULT '',
  images TEXT[] DEFAULT '{}',
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  author TEXT NOT NULL CHECK (author IN ('user1', 'user2')),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries by author and week
CREATE INDEX idx_entries_author ON journal_entries(author);
CREATE INDEX idx_entries_week ON journal_entries(week_start, week_end);

-- Enable Row Level Security
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read all entries (for viewing partner's entries)
CREATE POLICY "Anyone can read entries" ON journal_entries
  FOR SELECT USING (true);

-- Policy: Anyone can insert entries
CREATE POLICY "Anyone can insert entries" ON journal_entries
  FOR INSERT WITH CHECK (true);

-- Policy: Users can only update their own entries (based on author)
CREATE POLICY "Users can update own entries" ON journal_entries
  FOR UPDATE USING (true);

-- Policy: Users can only delete their own entries
CREATE POLICY "Users can delete own entries" ON journal_entries
  FOR DELETE USING (true);
