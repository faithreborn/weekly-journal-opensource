import type { ArchivedWeek } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Trash2, FileText, Download } from "lucide-react";
import "./ArchiveList.css";

interface Props {
  archives: ArchivedWeek[];
  onDelete: (id: string) => void;
  onView: (archive: ArchivedWeek) => void;
}

export default function ArchiveList({ archives, onDelete, onView }: Props) {
  if (archives.length === 0) {
    return (
      <div className="empty-state">
        <p>📁 لا توجد أرشيفات بعد</p>
        <p>سيتم حفظ يومياتك هنا كل خميس</p>
      </div>
    );
  }

  const handleDownload = (archive: ArchivedWeek) => {
    const blob = new Blob([archive.htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `يومياتنا-${format(new Date(archive.weekStart), "d-MM-yyyy")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="archive-list">
      {archives.map((archive) => (
        <div key={archive.id} className="archive-card">
          <div className="archive-icon">
            <FileText size={24} />
          </div>
          <div className="archive-info">
            <h3>
              {format(new Date(archive.weekStart), "d MMMM", { locale: ar })} -{" "}
              {format(new Date(archive.weekEnd), "d MMMM yyyy", { locale: ar })}
            </h3>
            <p>
              تم الحفظ: {format(new Date(archive.createdAt), "d MMMM yyyy", { locale: ar })}
            </p>
          </div>
          <div className="archive-actions">
            <button className="view-btn" onClick={() => onView(archive)}>
              عرض
            </button>
            <button className="download-archive-btn" onClick={() => handleDownload(archive)}>
              <Download size={16} />
            </button>
            <button className="delete-archive-btn" onClick={() => onDelete(archive.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
