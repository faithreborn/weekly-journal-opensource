import type { ArchivedWeek } from "../types";
import { X, Download } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import "./ArchiveViewer.css";

interface Props {
  archive: ArchivedWeek;
  onClose: () => void;
}

export default function ArchiveViewer({ archive, onClose }: Props) {
  const handleDownload = () => {
    const blob = new Blob([archive.htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `يومياتنا-${format(new Date(archive.weekStart), "d-MM-yyyy")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="archive-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="archive-viewer-header">
          <button className="close-btn" onClick={onClose}>
            <X />
          </button>
          <h3>
            {format(new Date(archive.weekStart), "d MMMM", { locale: ar })} -{" "}
            {format(new Date(archive.weekEnd), "d MMMM", { locale: ar })}
          </h3>
          <button className="download-btn" onClick={handleDownload}>
            <Download size={18} />
            <span>تحميل</span>
          </button>
        </div>
        <div className="archive-content">
          <iframe
            srcDoc={archive.htmlContent}
            title="Archive Viewer"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
