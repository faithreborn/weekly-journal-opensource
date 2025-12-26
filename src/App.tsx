import { useState, useEffect, useCallback } from "react";
import type { JournalEntry, WeekData } from "./types";
import EntryForm from "./components/EntryForm";
import EntryList from "./components/EntryList";
import PartnerView from "./components/PartnerView";
import ArchiveListNew from "./components/ArchiveListNew";
import PDFPreview from "./components/PDFPreview";
import LoginScreen from "./components/LoginScreen";
import {
  format,
  startOfWeek,
  endOfWeek,
  differenceInSeconds,
  isTuesday,
  isFriday,
  nextTuesday,
  nextFriday,
} from "date-fns";
import { ar } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { Book, Plus, Eye, Clock, LogOut, Archive, Moon, Sun } from "lucide-react";
import * as supabaseDb from "./supabaseDb";
import type { AuthorType } from "./supabaseDb";
import { getEmbeddedCSS } from "./components/embeddedStyles";
import "./App.css";

function App() {
  const [author, setAuthor] = useState<AuthorType | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [archives, setArchives] = useState<supabaseDb.Archive[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentTab, setCurrentTab] = useState<"entries" | "partner" | "archive">("entries");
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Algeria timezone (UTC+1)
  const ALGERIA_TZ = "Africa/Algiers";
  const getAlgeriaTime = () => toZonedTime(new Date(), ALGERIA_TZ);

  const today = getAlgeriaTime();
  // الثلاثاء والجمعة هي أيام المشاهدة
  const isViewDay = isTuesday(today) || isFriday(today);
  const weekStart = startOfWeek(today, { weekStartsOn: 6 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 6 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  // Check saved login and dark mode
  useEffect(() => {
    const savedAuthor = localStorage.getItem('journal_author') as AuthorType | null;
    if (savedAuthor) {
      setAuthor(savedAuthor);
    }
    const savedDarkMode = localStorage.getItem('journal_darkmode') === 'true';
    setDarkMode(savedDarkMode);
    setLoading(false);
  }, []);

  // Apply dark mode to body
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('journal_darkmode', String(darkMode));
  }, [darkMode]);

  // Get next view day (Tuesday or Friday)
  const getNextViewDay = (date: Date): Date => {
    const nextTue = nextTuesday(date);
    const nextFri = nextFriday(date);
    return nextTue < nextFri ? nextTue : nextFri;
  };

  // Calculate countdown to next view day (Algeria time)
  const updateCountdown = useCallback(() => {
    const now = getAlgeriaTime();

    if (isTuesday(now) || isFriday(now)) {
      setCountdown("اليوم يوم المشاهدة! 💕");
      return;
    }

    const nextView = getNextViewDay(now);
    nextView.setHours(23, 59, 59, 999);

    const diff = differenceInSeconds(nextView, now);

    if (diff <= 0) {
      setCountdown("حان وقت المشاهدة! 💕");
      return;
    }

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    if (days > 0) {
      setCountdown(`${days} يوم ${hours} ساعة`);
    } else if (hours > 0) {
      setCountdown(`${hours} ساعة ${minutes} دقيقة`);
    } else {
      setCountdown(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }
  }, []);

  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [updateCountdown]);

  // Load entries and archives from Supabase
  useEffect(() => {
    if (!author) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const [entriesData, archivesData] = await Promise.all([
          supabaseDb.getMyEntries(weekStartStr, weekEndStr),
          supabaseDb.getAllArchives(),
        ]);
        setEntries(entriesData);
        setArchives(archivesData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [author, weekStartStr, weekEndStr]);

  const handleLogin = (loggedAuthor: AuthorType) => {
    setAuthor(loggedAuthor);
  };

  const handleLogout = () => {
    localStorage.removeItem('journal_author');
    setAuthor(null);
    setEntries([]);
  };

  // Generate HTML content for archive
  const generateHTMLContent = (allEntries: JournalEntry[]): string => {
    const typeLabels: Record<string, string> = {
      diary: "يومية",
      photo: "صور",
      quote: "قصاصة",
      question: "سؤال",
      "sad-moment": "لحظة حزينة",
      "happy-moment": "لحظة سعيدة",
      note: "ملاحظة",
    };

    const typeEmojis: Record<string, string> = {
      diary: "📖",
      photo: "📷",
      quote: "✨",
      question: "❓",
      "sad-moment": "🥺",
      "happy-moment": "🥰",
      note: "📝",
    };

    // Separate by author
    const user1Entries = allEntries.filter(e => e.author === 'user1');
    const user2Entries = allEntries.filter(e => e.author === 'user2');

    const generateEntryHTML = (entry: JournalEntry) => `
      <div class="journal-entry ${entry.type} ${entry.author}">
        <div class="entry-marker">
          <span class="entry-emoji">${typeEmojis[entry.type]}</span>
        </div>
        <div class="entry-body">
          <div class="entry-meta-line">
            <span class="entry-type-label">${typeLabels[entry.type]}</span>
            <span class="entry-author-icon">${entry.author === "user1" ? "💜" : "💖"}</span>
            <span class="entry-date">${format(new Date(entry.date), "EEEE d MMMM", { locale: ar })}</span>
          </div>
          ${entry.content ? `<p class="entry-text">${entry.content}</p>` : ""}
          ${entry.images && entry.images.length > 0
        ? `<div class="entry-photos">
              ${entry.images.map((img, idx) => `
                <div class="photo-frame frame-${idx % 3}">
                  <img src="${img}" alt="" />
                </div>
              `).join("")}
            </div>`
        : ""
      }
        </div>
      </div>
    `;

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>يومياتنا - ${format(weekStart, "d MMMM yyyy", { locale: ar })}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>${getEmbeddedCSS()}</style>
</head>
<body>
  <div class="container">
    <div class="book-container">
      <div class="book-page cover-page">
        <div class="cover-bg"></div>
        <div class="cover-content">
          <div class="cover-ornament top">❀ ✿ ❀</div>
          <div class="cover-icon">📔</div>
          <h1 class="cover-title">يومياتنا</h1>
          <div class="cover-subtitle">كتاب الذكريات</div>
          <div class="cover-date-box">
            <span class="cover-date">${format(weekStart, "d MMMM", { locale: ar })}</span>
            <span class="cover-date-sep">—</span>
            <span class="cover-date">${format(weekEnd, "d MMMM yyyy", { locale: ar })}</span>
          </div>
          <div class="cover-hearts">
            <span class="heart purple">💜</span>
            <span class="heart-and">&</span>
            <span class="heart pink">💖</span>
          </div>
        </div>
      </div>

      <div class="book-page content-page">
        <div class="page-header">
          <div class="page-title">💜 User 1</div>
        </div>
        <div class="page-content">
          \${user1Entries.length > 0 ? user1Entries.map(generateEntryHTML).join("") : '<p class="no-entries">No entries</p>'}
        </div>
      </div>

      <div class="book-page content-page">
        <div class="page-header">
          <div class="page-title">💖 User 2</div>
        </div>
        <div class="page-content">
          \${user2Entries.length > 0 ? user2Entries.map(generateEntryHTML).join("") : '<p class="no-entries">No entries</p>'}
        </div>
      </div>

      <div class="book-page back-page">
        <div class="back-bg"></div>
        <div class="back-content">
          <div class="back-quote">Have a Sweet Weekend 💕</div>
          <div class="back-decoration">✨ 💕 ✨</div>
          <div class="back-made">صُنع بحب</div>
          <div class="back-year">${format(weekEnd, "yyyy", { locale: ar })}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  // Handle archive save
  const handleSaveArchive = async () => {
    if (!isViewDay) {
      alert("الأرشفة متاحة فقط يوم الثلاثاء والجمعة!");
      return;
    }

    if (!confirm("هل تريد حفظ اليوميات في الأرشيف؟ سيتم حذف جميع الإدخالات الحالية.")) {
      return;
    }

    setIsSaving(true);

    try {
      // Get all entries for both users
      const allEntries = await supabaseDb.getAllWeekEntries(weekStartStr, weekEndStr);
      
      if (allEntries.length === 0) {
        alert("لا توجد إدخالات للحفظ!");
        setIsSaving(false);
        return;
      }

      // Generate HTML
      const htmlContent = generateHTMLContent(allEntries);

      // Save archive
      const archive = await supabaseDb.saveArchive(htmlContent, weekStartStr, weekEndStr);
      
      if (archive) {
        // Clear all entries
        await supabaseDb.clearAllWeekEntries(weekStartStr, weekEndStr);
        
        setEntries([]);
        setArchives(prev => [archive, ...prev]);
        setCurrentTab("archive");
        
        alert("تم حفظ اليوميات في الأرشيف بنجاح! ✨");
      } else {
        alert("حدث خطأ أثناء الحفظ");
      }
    } catch (error) {
      console.error("Error saving archive:", error);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArchive = async (archive: supabaseDb.Archive) => {
    if (!confirm("هل تريد حذف هذا الأرشيف؟")) return;
    
    const success = await supabaseDb.deleteArchive(archive);
    if (success) {
      setArchives(archives.filter(a => a.id !== archive.id));
    }
  };

  const handleAddEntry = async (
    entry: Omit<JournalEntry, "id" | "date" | "author">
  ) => {
    if (!author) return;
    
    try {
      if (editingEntry) {
        const updatedEntry = { ...editingEntry, ...entry };
        const success = await supabaseDb.updateEntry(updatedEntry);
        if (success) {
          setEntries(entries.map((e) => (e.id === editingEntry.id ? updatedEntry : e)));
        }
        setEditingEntry(null);
      } else {
        const newEntry = await supabaseDb.addEntry(entry, weekStartStr, weekEndStr);
        if (newEntry) {
          setEntries((prev) => [...prev, newEntry]);
        }
      }
      setShowForm(false);
    } catch (error) {
      console.error("Error saving entry:", error);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const success = await supabaseDb.deleteEntry(id);
      if (success) {
        setEntries(entries.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const weekData: WeekData = {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    entries,
  };

  // Show login screen if not logged in
  if (!author && !loading) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="app loading">
        <div className="loader">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <header className="header">
        <div className="header-content">
          <Book className="header-icon" />
          <h1>يومياتنا الأسبوعية</h1>
          <p className="week-range">
            {format(weekStart, "d MMMM", { locale: ar })} -{" "}
            {format(weekEnd, "d MMMM yyyy", { locale: ar })}
          </p>
          <button className="logout-btn" onClick={handleLogout} title="تسجيل خروج">
            <LogOut size={18} />
          </button>
          <button className="theme-btn" onClick={() => setDarkMode(!darkMode)} title={darkMode ? "الوضع الفاتح" : "الوضع المظلم"}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* User indicator */}
      <div className="user-indicator">
        {author === 'user1' ? '💜 User 1' : '💖 User 2'}
      </div>

      {/* Countdown Timer */}
      <div className={`countdown-box ${isViewDay ? "thursday" : ""}`}>
        <Clock size={18} />
        <span>
          {isViewDay ? "View day! 💕" : `Next view day: ${countdown}`}
        </span>
      </div>

      {/* Tab Toggle */}
      <div className="author-toggle three-tabs">
        <button
          className={`author-btn ${currentTab === "entries" ? "active" : ""}`}
          onClick={() => setCurrentTab("entries")}
        >
          My Journal {author === 'user1' ? '💜' : '💖'}
        </button>
        <button
          className={`author-btn ${currentTab === "partner" ? "active" : ""}`}
          onClick={() => setCurrentTab("partner")}
          disabled={!isViewDay}
          title={!isViewDay ? "Available on Tuesday and Friday only" : ""}
        >
          {author === 'user1' ? 'User 2' : 'User 1'} {isViewDay ? '👀' : '🔒'}
        </button>
        <button
          className={`author-btn ${currentTab === "archive" ? "active" : ""}`}
          onClick={() => setCurrentTab("archive")}
        >
          Archive 📁
        </button>
      </div>

      <main className="main">
        {currentTab === "entries" ? (
          <EntryList
            entries={entries}
            onDelete={handleDeleteEntry}
            onEdit={handleEditEntry}
          />
        ) : currentTab === "partner" ? (
          <PartnerView
            weekStart={weekStartStr}
            weekEnd={weekEndStr}
          />
        ) : (
          <ArchiveListNew
            archives={archives}
            onDelete={handleDeleteArchive}
          />
        )}
      </main>

      {/* FAB Buttons */}
      {currentTab === "entries" && (
        <div className="fab-container">
          <button
            className="fab fab-preview"
            onClick={() => setShowPreview(true)}
            title="معاينة"
          >
            <Eye />
          </button>

          {/* Show archive button on view days */}
          {isViewDay && entries.length > 0 && (
            <button
              className="fab fab-save"
              onClick={handleSaveArchive}
              disabled={isSaving}
              title="حفظ في الأرشيف"
            >
              <Archive />
            </button>
          )}

          <button
            className="fab fab-add"
            onClick={() => {
              setEditingEntry(null);
              setShowForm(true);
            }}
            title="إضافة جديد"
          >
            <Plus />
          </button>
        </div>
      )}

      {showForm && (
        <EntryForm
          onSubmit={handleAddEntry}
          onClose={() => {
            setShowForm(false);
            setEditingEntry(null);
          }}
          author={author!}
          editingEntry={editingEntry}
        />
      )}

      {showPreview && (
        <PDFPreview weekData={weekData} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

export default App;
