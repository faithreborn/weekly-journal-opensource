export type AuthorType = 'user1' | 'user2';

export interface JournalEntry {
  id: string;
  type:
    | "diary"
    | "photo"
    | "quote"
    | "question"
    | "sad-moment"
    | "happy-moment"
    | "note";
  content: string;
  images?: string[];
  date: string;
  author: AuthorType;
}

export interface WeekData {
  weekStart: string;
  weekEnd: string;
  entries: JournalEntry[];
}

export interface ArchivedWeek {
  id: string;
  weekStart: string;
  weekEnd: string;
  htmlContent: string;
  createdAt: string;
}
