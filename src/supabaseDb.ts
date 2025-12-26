import { supabase } from './supabaseClient';
import type { JournalEntry, AuthorType } from './types';

export type { AuthorType };

export interface SupabaseEntry extends JournalEntry {
  week_start: string;
  week_end: string;
}

// Get actual author from localStorage
export const getActualAuthor = (): AuthorType | null => {
  return localStorage.getItem('journal_author') as AuthorType | null;
};

// Get entries for current user (by author)
export const getMyEntries = async (weekStart: string, weekEnd: string): Promise<JournalEntry[]> => {
  const author = getActualAuthor();
  if (!author) return [];

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('author', author)
    .eq('week_start', weekStart)
    .eq('week_end', weekEnd)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching entries:', error);
    return [];
  }

  return (data || []).map(entry => ({
    id: entry.id,
    type: entry.type,
    content: entry.content,
    images: entry.images || [],
    date: entry.date,
    author: entry.author,
  }));
};

// Get partner's entries (for viewing on Tuesday/Friday)
export const getPartnerEntries = async (weekStart: string, weekEnd: string): Promise<JournalEntry[]> => {
  const myAuthor = getActualAuthor();
  if (!myAuthor) return [];
  
  const partnerAuthor: AuthorType = myAuthor === 'user1' ? 'user2' : 'user1';
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('author', partnerAuthor)
    .eq('week_start', weekStart)
    .eq('week_end', weekEnd)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching partner entries:', error);
    return [];
  }

  return (data || []).map(entry => ({
    id: entry.id,
    type: entry.type,
    content: entry.content,
    images: entry.images || [],
    date: entry.date,
    author: entry.author,
  }));
};


// Add new entry
export const addEntry = async (entry: Omit<JournalEntry, 'id' | 'date' | 'author'>, weekStart: string, weekEnd: string): Promise<JournalEntry | null> => {
  const author = getActualAuthor();
  if (!author) return null;

  const newEntry = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
    ...entry,
    author,
    date: new Date().toISOString(),
    week_start: weekStart,
    week_end: weekEnd,
  };

  const { data, error } = await supabase
    .from('journal_entries')
    .insert(newEntry)
    .select()
    .single();

  if (error) {
    console.error('Error adding entry:', error);
    return null;
  }

  return {
    id: data.id,
    type: data.type,
    content: data.content,
    images: data.images || [],
    date: data.date,
    author: data.author,
  };
};

// Update entry
export const updateEntry = async (entry: JournalEntry): Promise<boolean> => {
  const { error } = await supabase
    .from('journal_entries')
    .update({
      type: entry.type,
      content: entry.content,
      images: entry.images,
    })
    .eq('id', entry.id);

  if (error) {
    console.error('Error updating entry:', error);
    return false;
  }

  return true;
};

// Delete entry
export const deleteEntry = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting entry:', error);
    return false;
  }

  return true;
};

// Clear all entries for a week (after archiving)
export const clearWeekEntries = async (weekStart: string, weekEnd: string): Promise<boolean> => {
  const author = getActualAuthor();
  if (!author) return false;

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('author', author)
    .eq('week_start', weekStart)
    .eq('week_end', weekEnd);

  if (error) {
    console.error('Error clearing entries:', error);
    return false;
  }

  return true;
};

// ============ STORAGE FUNCTIONS ============

// Upload image to Supabase Storage
export const uploadImage = async (file: File | Blob, fileName?: string): Promise<string | null> => {
  const name = fileName || `${Date.now()}_${Math.random().toString(36).slice(2, 9)}.jpg`;
  
  const { data, error } = await supabase.storage
    .from('journal-images')
    .upload(name, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('journal-images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

// Upload base64 image
export const uploadBase64Image = async (base64: string): Promise<string | null> => {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  
  // Convert to blob
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/jpeg' });

  return uploadImage(blob);
};

// Delete image from storage
export const deleteImage = async (url: string): Promise<boolean> => {
  // Extract file path from URL
  const path = url.split('/journal-images/')[1];
  if (!path) return false;

  const { error } = await supabase.storage
    .from('journal-images')
    .remove([path]);

  if (error) {
    console.error('Error deleting image:', error);
    return false;
  }

  return true;
};

// ============ ARCHIVE FUNCTIONS ============

export interface Archive {
  id: string;
  week_start: string;
  week_end: string;
  html_url: string;
  created_at: string;
}

// Save HTML archive to storage
export const saveArchive = async (htmlContent: string, weekStart: string, weekEnd: string): Promise<Archive | null> => {
  const id = `${weekStart}_${weekEnd}_${Date.now()}`;
  const fileName = `${id}.html`;

  // Upload HTML file
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('journal-archives')
    .upload(fileName, blob, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading archive:', uploadError);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('journal-archives')
    .getPublicUrl(uploadData.path);

  // Save metadata to database
  const archive: Archive = {
    id,
    week_start: weekStart,
    week_end: weekEnd,
    html_url: urlData.publicUrl,
    created_at: new Date().toISOString(),
  };

  const { error: dbError } = await supabase
    .from('archives')
    .insert(archive);

  if (dbError) {
    console.error('Error saving archive metadata:', dbError);
    return null;
  }

  return archive;
};

// Get all archives
export const getAllArchives = async (): Promise<Archive[]> => {
  const { data, error } = await supabase
    .from('archives')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching archives:', error);
    return [];
  }

  return data;
};

// Delete archive
export const deleteArchive = async (archive: Archive): Promise<boolean> => {
  // Delete HTML file from storage
  const path = archive.html_url.split('/journal-archives/')[1];
  if (path) {
    await supabase.storage.from('journal-archives').remove([path]);
  }

  // Delete from database
  const { error } = await supabase
    .from('archives')
    .delete()
    .eq('id', archive.id);

  if (error) {
    console.error('Error deleting archive:', error);
    return false;
  }

  return true;
};

// Clear all entries for the week (both users)
export const clearAllWeekEntries = async (weekStart: string, weekEnd: string): Promise<boolean> => {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .gte('week_start', weekStart)
    .lte('week_end', weekEnd);

  if (error) {
    console.error('Error clearing all entries:', error);
    return false;
  }

  return true;
};

// Get all entries for the week (both users) for archiving
export const getAllWeekEntries = async (weekStart: string, weekEnd: string): Promise<JournalEntry[]> => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .gte('week_start', weekStart)
    .lte('week_end', weekEnd)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching all entries:', error);
    return [];
  }

  return data.map(entry => ({
    id: entry.id,
    type: entry.type,
    content: entry.content,
    images: entry.images || [],
    date: entry.date,
    author: entry.author,
  }));
};
