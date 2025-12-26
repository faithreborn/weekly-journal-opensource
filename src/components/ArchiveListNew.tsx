import { useState } from 'react';
import type { Archive } from '../supabaseDb';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Trash2, ExternalLink, X } from 'lucide-react';
import './ArchiveListNew.css';

interface ArchiveListNewProps {
  archives: Archive[];
  onDelete: (archive: Archive) => void;
}

function ArchiveListNew({ archives, onDelete }: ArchiveListNewProps) {
  const [viewingArchive, setViewingArchive] = useState<Archive | null>(null);

  if (archives.length === 0) {
    return (
      <div className="archive-empty">
        <p>📁</p>
        <p>لا توجد أرشيفات بعد</p>
        <small>سيتم حفظ اليوميات تلقائياً يوم الثلاثاء والجمعة</small>
      </div>
    );
  }

  return (
    <>
      <div className="archive-list-new">
        {archives.map((archive) => (
          <div key={archive.id} className="archive-card">
            <div className="archive-info">
              <div className="archive-dates">
                {format(new Date(archive.week_start), 'd MMMM', { locale: ar })} - {format(new Date(archive.week_end), 'd MMMM yyyy', { locale: ar })}
              </div>
              <div className="archive-created">
                حُفظ في {format(new Date(archive.created_at), 'd MMMM yyyy', { locale: ar })}
              </div>
            </div>
            <div className="archive-actions">
              <button
                className="archive-btn view"
                onClick={() => setViewingArchive(archive)}
                title="عرض"
              >
                <ExternalLink size={18} />
              </button>
              <button
                className="archive-btn delete"
                onClick={() => onDelete(archive)}
                title="حذف"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Archive Viewer Modal */}
      {viewingArchive && (
        <div className="archive-viewer-overlay" onClick={() => setViewingArchive(null)}>
          <div className="archive-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-viewer" onClick={() => setViewingArchive(null)}>
              <X size={24} />
            </button>
            <iframe
              src={viewingArchive.html_url}
              title="Archive Viewer"
              className="archive-iframe"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default ArchiveListNew;
