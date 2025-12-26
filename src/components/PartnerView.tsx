import { useState, useEffect, useRef } from 'react';
import type { JournalEntry } from '../types';
import { getPartnerEntries, getActualAuthor } from '../supabaseDb';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Heart, RefreshCw, Maximize2, X, ChevronRight, ChevronLeft } from 'lucide-react';
import './PartnerView.css';

interface PartnerViewProps {
  weekStart: string;
  weekEnd: string;
}

const typeLabels: Record<string, string> = {
  diary: 'يومية',
  photo: 'صور',
  quote: 'قصاصة',
  question: 'سؤال',
  'sad-moment': 'لحظة حزينة',
  'happy-moment': 'لحظة سعيدة',
  note: 'ملاحظة',
};

const typeEmojis: Record<string, string> = {
  diary: '📖',
  photo: '📷',
  quote: '✨',
  question: '❓',
  'sad-moment': '🥺',
  'happy-moment': '🥰',
  note: '📝',
};

type PageType = 
  | { type: 'cover' }
  | { type: 'entry'; entry: JournalEntry; dayName: string; dayDate: string; pageNum: number }
  | { type: 'back' };

function PartnerView({ weekStart, weekEnd }: PartnerViewProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const isScrolling = useRef(false);
  const storageKey = `partner_page_${weekStart}`;

  const author = getActualAuthor();
  const partnerEmoji = author === 'user1' ? '💖' : '💜';
  const partnerName = author === 'user1' ? 'User 2' : 'User 1';

  const loadEntries = async () => {
    setLoading(true);
    const data = await getPartnerEntries(weekStart, weekEnd);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    loadEntries();
  }, [weekStart, weekEnd]);

  // Load saved page on mount
  useEffect(() => {
    const savedPage = localStorage.getItem(storageKey);
    if (savedPage) {
      setCurrentPageIndex(parseInt(savedPage, 10));
    }
  }, [storageKey]);

  // Save current page
  useEffect(() => {
    if (fullscreenMode) {
      localStorage.setItem(storageKey, String(currentPageIndex));
    }
  }, [currentPageIndex, fullscreenMode, storageKey]);

  const buildPages = (): PageType[] => {
    const pages: PageType[] = [{ type: 'cover' }];
    entries.forEach((entry, idx) => {
      const dayName = format(new Date(entry.date), 'EEEE', { locale: ar });
      const dayDate = format(new Date(entry.date), 'd MMMM yyyy', { locale: ar });
      pages.push({ type: 'entry', entry, dayName, dayDate, pageNum: idx + 1 });
    });
    pages.push({ type: 'back' });
    return pages;
  };

  const pages = buildPages();
  const totalPages = pages.length;

  // Normal view grouping
  const questions = entries.filter(e => e.type === 'question');
  const otherEntries = entries.filter(e => e.type !== 'question');
  const entriesByDay = otherEntries.reduce((acc, entry) => {
    const dayKey = format(new Date(entry.date), 'yyyy-MM-dd');
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);
  const sortedDays = Object.keys(entriesByDay).sort();

  const nextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    isScrolling.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    
    // Check if user is scrolling vertically
    const diffX = Math.abs(touchEndX.current - touchStartX.current);
    const diffY = Math.abs(touchEndY.current - touchStartY.current);
    
    if (diffY > diffX && diffY > 10) {
      isScrolling.current = true;
    }
  };

  const handleTouchEnd = () => {
    // Don't change page if user was scrolling vertically
    if (isScrolling.current) {
      return;
    }
    
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = Math.abs(touchEndY.current - touchStartY.current);
    
    // Only swipe if horizontal movement is greater than vertical
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY) {
      if (diffX > 0) {
        prevPage();
      } else {
        nextPage();
      }
    }
  };

  const openFullscreen = () => {
    const savedPage = localStorage.getItem(storageKey);
    setCurrentPageIndex(savedPage ? parseInt(savedPage, 10) : 0);
    setFullscreenMode(true);
  };

  const renderEntry = (entry: JournalEntry) => (
    <div key={entry.id} className={`journal-entry ${entry.type} ${entry.author}`}>
      <div className="entry-marker">
        <span className="entry-emoji">{typeEmojis[entry.type]}</span>
      </div>
      <div className="entry-body">
        <div className="entry-meta-line">
          <span className="entry-type-label">{typeLabels[entry.type]}</span>
          <span className="entry-author-icon">{partnerEmoji}</span>
        </div>
        {entry.content && <p className="entry-text">{entry.content}</p>}
        {entry.images && entry.images.length > 0 && (
          <div className="entry-photos">
            {entry.images.map((img, idx) => (
              <div key={idx} className={`photo-frame frame-${idx % 3}`}>
                <img src={img} alt="" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPageContent = (page: PageType) => {
    if (page.type === 'cover') {
      return (
        <div className="fs-book-page fs-cover">
          <div className="fs-cover-decoration">❀ ✿ ❀</div>
          <div className="fs-cover-icon">📔</div>
          <h1 className="fs-cover-title">كتابات {partnerName}</h1>
          <div className="fs-cover-subtitle">يومياتنا الأسبوعية</div>
          <div className="fs-cover-dates">
            {format(new Date(weekStart), 'd MMMM', { locale: ar })} — {format(new Date(weekEnd), 'd MMMM', { locale: ar })}
          </div>
          <div className="fs-cover-heart">{partnerEmoji}</div>
          <div className="fs-cover-decoration bottom">✦ ✧ ✦</div>
        </div>
      );
    }

    if (page.type === 'entry') {
      return (
        <div className="fs-book-page fs-content">
          <div className="fs-page-header">
            <div className="fs-page-day">{page.dayName}</div>
            <div className="fs-page-date">{page.dayDate}</div>
          </div>
          
          <div className="fs-entry">
            <div className="fs-entry-header">
              <span className="fs-entry-emoji">{typeEmojis[page.entry.type]}</span>
              <span className="fs-entry-type">{typeLabels[page.entry.type]}</span>
              <span className="fs-entry-author">{partnerEmoji}</span>
            </div>
            
            {page.entry.content && (
              <p className="fs-entry-text">{page.entry.content}</p>
            )}
            
            {page.entry.images && page.entry.images.length > 0 && (
              <div className="fs-entry-images">
                {page.entry.images.map((img, idx) => (
                  <div key={idx} className="fs-photo-frame">
                    <div className="fs-photo-tape"></div>
                    <img src={img} alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="fs-page-footer">
            <div className="fs-page-number">{page.pageNum}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="fs-book-page fs-back">
        <div className="fs-back-quote">مع حبي {partnerEmoji}</div>
        <div className="fs-back-decoration">✨ 💕 ✨</div>
        <div className="fs-back-text">نهاية الكتاب</div>
        <div className="fs-back-year">{format(new Date(weekEnd), 'yyyy')}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="partner-view loading">
        <div className="loader">جاري التحميل...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="partner-view">
        <div className="partner-header">
          <Heart className="partner-icon" />
          <h2>كتابات {partnerName} {partnerEmoji}</h2>
          <button className="refresh-btn" onClick={loadEntries}>
            <RefreshCw size={20} />
          </button>
        </div>
        <div className="no-entries-book">
          <div className="empty-book">
            <span>📔</span>
            <p>لا توجد كتابات من {partnerName} هذا الأسبوع بعد</p>
            <small>انتظر حتى تكتب شيئاً جميلاً 💭</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="partner-view">
      <div className="partner-header">
        <Heart className="partner-icon" />
        <h2>كتابات {partnerName} {partnerEmoji}</h2>
        <button className="refresh-btn" onClick={loadEntries}>
          <RefreshCw size={20} />
        </button>
        <button className="fullscreen-btn" onClick={openFullscreen}>
          <Maximize2 size={20} />
        </button>
      </div>

      <div className="partner-book-container">
        <div className="book-page cover-page mini">
          <div className="cover-bg"></div>
          <div className="cover-content">
            <div className="cover-icon">📔</div>
            <h1 className="cover-title">كتابات {partnerName}</h1>
            <div className="cover-date-box">
              <span className="cover-date">{format(new Date(weekStart), 'd MMMM', { locale: ar })}</span>
              <span className="cover-date-sep">—</span>
              <span className="cover-date">{format(new Date(weekEnd), 'd MMMM', { locale: ar })}</span>
            </div>
            <div className="cover-hearts"><span className="heart">{partnerEmoji}</span></div>
          </div>
        </div>

        {sortedDays.map((dayKey, index) => (
          <div key={dayKey} className="book-page content-page">
            <div className="page-header">
              <div className="page-title">{format(new Date(dayKey), 'EEEE', { locale: ar })}</div>
              <div className="page-date">{format(new Date(dayKey), 'd MMMM yyyy', { locale: ar })}</div>
            </div>
            <div className="page-content">{entriesByDay[dayKey].map(renderEntry)}</div>
            <div className="page-footer"><div className="page-number">{index + 1}</div></div>
          </div>
        ))}

        {questions.length > 0 && (
          <div className="book-page content-page questions-page">
            <div className="page-header">
              <div className="page-title">❓ أسئلة الأسبوع</div>
              <div className="page-date">{format(new Date(weekStart), 'd MMMM yyyy', { locale: ar })}</div>
            </div>
            <div className="page-content">{questions.map(renderEntry)}</div>
            <div className="page-footer"><div className="page-number">{sortedDays.length + 1}</div></div>
          </div>
        )}

        <div className="book-page back-page mini">
          <div className="back-bg"></div>
          <div className="back-content">
            <div className="back-quote">تايك كير{partnerEmoji}</div>
            <div className="back-decoration">✨ 💕 ✨</div>
          </div>
        </div>
      </div>

      {fullscreenMode && (
        <div 
          className="fullscreen-reader"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button className="fs-close" onClick={() => setFullscreenMode(false)}>
            <X size={20} />
          </button>
          
          <div className="fs-content-wrapper">
            {renderPageContent(pages[currentPageIndex])}
          </div>

          <div className="fs-navigation">
            <button 
              className="fs-nav-btn" 
              onClick={nextPage} 
              disabled={currentPageIndex === totalPages - 1}
            >
              <ChevronRight size={24} />
            </button>
            
            <div className="fs-page-indicator">
              <span className="fs-current">{currentPageIndex + 1}</span>
              <span className="fs-separator">/</span>
              <span className="fs-total">{totalPages}</span>
            </div>
            
            <button 
              className="fs-nav-btn" 
              onClick={prevPage} 
              disabled={currentPageIndex === 0}
            >
              <ChevronLeft size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartnerView;
