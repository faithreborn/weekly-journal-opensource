import type { JournalEntry } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Trash2,
  Edit3,
  BookOpen,
  Camera,
  Quote,
  HelpCircle,
  Frown,
  Smile,
  StickyNote,
} from "lucide-react";
import "./EntryList.css";

interface Props {
  entries: JournalEntry[];
  onDelete: (id: string) => void;
  onEdit: (entry: JournalEntry) => void;
}

const typeIcons = {
  diary: BookOpen,
  photo: Camera,
  quote: Quote,
  question: HelpCircle,
  "sad-moment": Frown,
  "happy-moment": Smile,
  note: StickyNote,
};

const typeLabels = {
  diary: "يومية",
  photo: "صور",
  quote: "قصاصة",
  question: "سؤال",
  "sad-moment": "لحظة زعلتني",
  "happy-moment": "لحظة فرحتني",
  note: "ملاحظة",
};

export default function EntryList({ entries, onDelete, onEdit }: Props) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p>لا توجد إدخالات بعد 📝</p>
        <p>ابدئي بإضافة يومياتك!</p>
      </div>
    );
  }

  return (
    <div className="entry-list">
      {entries.map((entry) => {
        const Icon = typeIcons[entry.type];
        return (
          <div
            key={entry.id}
            className={`entry-card ${entry.type} ${entry.author}`}
          >
            <div className="entry-header">
              <div className="entry-type">
                <Icon size={18} />
                <span>{typeLabels[entry.type]}</span>
              </div>
              <div className="entry-meta">
                <span className="author-badge">
                  {entry.author === "user1" ? "💜" : "💖"}
                </span>
                <span className="entry-date">
                  {format(new Date(entry.date), "EEEE d MMMM", { locale: ar })}
                </span>
              </div>
            </div>

            {entry.images && entry.images.length > 0 && (
              <div className="entry-images">
                {entry.images.map((img, index) => (
                  <div key={index} className="entry-image-wrapper">
                    <div className="tape"></div>
                    <img src={img} alt="" className="entry-image" />
                  </div>
                ))}
              </div>
            )}

            {entry.content && <p className="entry-content">{entry.content}</p>}

            <div className="entry-actions">
              <button className="edit-btn" onClick={() => onEdit(entry)}>
                <Edit3 size={16} />
              </button>
              <button className="delete-btn" onClick={() => onDelete(entry.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
