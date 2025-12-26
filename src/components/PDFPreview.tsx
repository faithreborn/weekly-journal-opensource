import { useRef, useState } from "react";
import type { WeekData } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { X, Share2, Loader2 } from "lucide-react";
import "./PDFPreview.css";
import { getEmbeddedCSS } from "./embeddedStyles";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

interface Props {
  weekData: WeekData;
  onClose: () => void;
}

const typeLabels = {
  diary: "يومية",
  photo: "صور",
  quote: "قصاصة",
  question: "سؤال",
  "sad-moment": "لحظة حزينة",
  "happy-moment": "لحظة سعيدة",
  note: "ملاحظة",
};

const typeEmojis = {
  diary: "📖",
  photo: "📷",
  quote: "✨",
  question: "❓",
  "sad-moment": "🥺",
  "happy-moment": "🥰",
  note: "📝",
};

export default function PDFPreview({ weekData, onClose }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportHTML = async () => {
    if (!contentRef.current || isExporting) return;

    setIsExporting(true);

    try {
      // Get the book container HTML
      const bookContainer = contentRef.current.cloneNode(true) as HTMLElement;

      // Convert any data URLs or blob URLs in images to base64
      const images = bookContainer.querySelectorAll('img');
      for (const img of Array.from(images)) {
        if (img.src && !img.src.startsWith('data:')) {
          try {
            const response = await fetch(img.src);
            const blob = await response.blob();
            const reader = new FileReader();
            await new Promise((resolve) => {
              reader.onloadend = () => {
                img.src = reader.result as string;
                resolve(null);
              };
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.warn('Could not convert image:', e);
          }
        }
      }

      const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>يومياتنا - ${format(new Date(weekData.weekStart), "d MMMM yyyy", { locale: ar })}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Tajawal', sans-serif;
      background: linear-gradient(135deg, #fdf2f8, #fce7f3);
      padding: 20px;
      direction: rtl;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      color: #be185d;
      margin-bottom: 30px;
      font-size: 2.5rem;
    }
    ${getEmbeddedCSS()}
    .book-container {
      gap: 25px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .book-page {
        page-break-after: always;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📔 يومياتنا</h1>
    <div class="book-container">
      ${bookContainer.innerHTML}
    </div>
  </div>
</body>
</html>`;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const fileName = `TradbleStory-${format(new Date(weekData.weekStart), "d-MM-yyyy")}.html`;

      if (Capacitor.isNativePlatform()) {
        // Native: Save file and share
        try {
          // Save to cache directory
          const result = await Filesystem.writeFile({
            path: fileName,
            data: htmlContent,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
          });

          // Share the file
          await Share.share({
            title: "TradbleStory - يومياتنا",
            text: "يومياتنا الأسبوعية 💕",
            url: result.uri,
            dialogTitle: "مشاركة اليوميات",
          });
        } catch (shareError) {
          console.error("Share error:", shareError);
          alert("حدث خطأ أثناء المشاركة");
        }
      } else {
        // Web: Download file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        alert('تم تصدير الكتاب بنجاح! ✨');
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("حدث خطأ أثناء التصدير. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsExporting(false);
    }
  };

  const weekStart = new Date(weekData.weekStart);
  const weekEnd = new Date(weekData.weekEnd);

  // Separate questions from other entries
  const questions = weekData.entries.filter((e) => e.type === "question");
  const otherEntries = weekData.entries.filter((e) => e.type !== "question");

  // Group entries by day (excluding questions)
  const entriesByDay = otherEntries.reduce(
    (acc, entry) => {
      const dayKey = format(new Date(entry.date), "yyyy-MM-dd");
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(entry);
      return acc;
    },
    {} as Record<string, typeof otherEntries>
  );

  // Sort days
  const sortedDays = Object.keys(entriesByDay).sort();

  // Render single entry
  const renderEntry = (entry: typeof weekData.entries[0]) => (
    <div
      key={entry.id}
      className={`journal-entry ${entry.type} ${entry.author}`}
    >
      <div className="entry-marker">
        <span className="entry-emoji">{typeEmojis[entry.type]}</span>
      </div>
      <div className="entry-body">
        <div className="entry-meta-line">
          <span className="entry-type-label">{typeLabels[entry.type]}</span>
          <span className="entry-author-icon">
            {entry.author === "user1" ? "💜" : "💖"}
          </span>
        </div>
        {entry.content && <p className="entry-text">{entry.content}</p>}
        {entry.images && entry.images.length > 0 && (
          <div className="entry-photos">
            {entry.images.map((img, idx) => (
              <div key={idx} className={`photo-frame frame-${idx % 3}`}>
                <div className="photo-tape"></div>
                <img src={img} alt="" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-header">
          <button className="close-btn" onClick={onClose}>
            <X />
          </button>
          <h3>معاينة الكتاب</h3>
          <button
            className="download-btn"
            onClick={handleExportHTML}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="spin" /> : <Share2 />}
            <span>{isExporting ? "جاري التصدير..." : "مشاركة"}</span>
          </button>
        </div>

        <div className="pdf-scroll">
          <div className="book-container" ref={contentRef}>
            {/* Cover Page */}
            <div className="book-page cover-page">
              <div className="cover-bg"></div>
              <div className="cover-content">
                <div className="cover-ornament top">❀ ✿ ❀</div>
                <div className="cover-icon">📔</div>
                <h1 className="cover-title">يومياتنا</h1>
                <div className="cover-subtitle">كتاب الذكريات</div>
                <div className="cover-date-box">
                  <span className="cover-date">
                    {format(weekStart, "d MMMM", { locale: ar })}
                  </span>
                  <span className="cover-date-sep">—</span>
                  <span className="cover-date">
                    {format(weekEnd, "d MMMM yyyy", { locale: ar })}
                  </span>
                </div>
                <div className="cover-hearts">
                  <span className="heart purple">💜</span>
                  <span className="heart-and">&</span>
                  <span className="heart pink">💖</span>
                </div>
                <div className="cover-ornament bottom">✦ ✧ ✦</div>
              </div>
              <div className="page-curl"></div>
            </div>

            {/* Day Pages */}
            {sortedDays.map((dayKey, index) => {
              const dayEntries = entriesByDay[dayKey];
              const dayDate = format(new Date(dayKey), "EEEE d MMMM yyyy", { locale: ar });
              const pageNumber = index + 2;

              return (
                <div key={dayKey} className="book-page content-page">
                  <div className="page-texture"></div>
                  <div className="page-header">
                    <div className="page-title">
                      {format(new Date(dayKey), "EEEE", { locale: ar })}
                    </div>
                    <div className="page-date">{dayDate}</div>
                  </div>

                  <div className="page-content">
                    {dayEntries.map(renderEntry)}
                  </div>

                  <div className="page-footer">
                    <div className="page-number">{pageNumber}</div>
                  </div>
                  <div className="page-curl"></div>
                </div>
              );
            })}

            {/* Questions Page */}
            {questions.length > 0 && (
              <div className="book-page content-page questions-page">
                <div className="page-texture"></div>
                <div className="page-header">
                  <div className="page-title">❓ أسئلة الأسبوع</div>
                  <div className="page-date">
                    {format(weekStart, "d MMMM yyyy", { locale: ar })}
                  </div>
                </div>

                <div className="page-content">
                  {questions.map(renderEntry)}
                </div>

                <div className="page-footer">
                  <div className="page-number">{sortedDays.length + 2}</div>
                </div>
                <div className="page-curl"></div>
              </div>
            )}

            {/* Back Cover */}
            <div className="book-page back-page">
              <div className="back-bg"></div>
              <div className="back-content">
                <div className="back-quote">Have a Sweet Weekend 💕</div>
                <div className="back-decoration">✨ 💕 ✨</div>
                <div className="back-made">صُنع بحب</div>
                <div className="back-year">
                  {format(weekEnd, "yyyy", { locale: ar })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
