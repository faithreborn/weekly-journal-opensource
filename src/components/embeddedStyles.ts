// Embedded CSS styles for HTML export
export const getEmbeddedCSS = () => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Tajawal', sans-serif; background: linear-gradient(135deg, #fdf2f8, #fce7f3); padding: 20px; direction: rtl; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { text-align: center; color: #be185d; margin-bottom: 30px; font-size: 2.5rem; }
  .book-container { display: flex; flex-direction: column; gap: 25px; align-items: center; }
  .book-page { width: 100%; max-width: 480px; min-height: 600px; position: relative; border-radius: 5px 15px 15px 5px; box-shadow: 0 4px 20px rgba(0,0,0,0.1), inset -2px 0 8px rgba(0,0,0,0.05); overflow: hidden; font-family: 'Tajawal', sans-serif; direction: rtl; text-align: right; }
  .book-page.cover-page, .book-page.back-page { aspect-ratio: 210 / 297; min-height: auto; }
  .page-curl { position: absolute; bottom: 0; left: 0; width: 40px; height: 40px; background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%); border-radius: 0 0 0 5px; }
  .cover-page { background: #fffbf5; border: 2px solid #f5e6d3; }
  .cover-bg { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 26px, rgba(236,72,153,0.06) 26px, rgba(236,72,153,0.06) 27px); }
  .cover-content { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center; direction: rtl; }
  .cover-ornament { font-size: 1.5rem; letter-spacing: 10px; color: #f9a8d4; }
  .cover-ornament.top { margin-bottom: 20px; }
  .cover-ornament.bottom { margin-top: 20px; }
  .cover-icon { font-size: 4rem; margin-bottom: 12px; }
  .cover-title { font-family: 'Tajawal', sans-serif; font-size: 2.8rem; font-weight: 800; color: #be185d; margin-bottom: 6px; direction: rtl; }
  .cover-subtitle { font-size: 1rem; color: #9d174d; margin-bottom: 20px; opacity: 0.7; direction: rtl; }
  .cover-date-box { display: flex; align-items: center; gap: 10px; padding: 10px 20px; background: rgba(236,72,153,0.08); border: 1px dashed #f9a8d4; border-radius: 8px; margin-bottom: 20px; }
  .cover-date { color: #be185d; font-size: 0.9rem; font-weight: 500; direction: rtl; }
  .cover-date-sep { color: #f9a8d4; }
  .cover-hearts { display: flex; align-items: center; gap: 10px; font-size: 2rem; }
  .heart-and { color: #f9a8d4; font-size: 1.1rem; font-weight: 300; }
  .content-page { background: #fffbf5; direction: rtl; border: 2px solid #f5e6d3; }
  .page-texture { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 26px, rgba(236,72,153,0.08) 26px, rgba(236,72,153,0.08) 27px); pointer-events: none; }
  .page-header { padding: 12px 20px 8px; border-bottom: 2px solid #f9a8d4; margin-bottom: 10px; position: relative; }
  .page-header::after { content: '♡'; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); background: #fffbf5; padding: 0 8px; color: #ec4899; font-size: 1rem; }
  .page-title { font-size: 1.1rem; font-weight: 700; color: #be185d; margin-bottom: 2px; direction: rtl; }
  .page-date { font-size: 0.8rem; color: #9d174d; opacity: 0.8; direction: rtl; }
  .page-content { padding: 10px 18px 40px; flex: 1; }
  .page-content.single-entry { display: flex; flex-direction: column; }
  .page-content.single-entry .journal-entry { flex: 1; border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .page-content.single-entry .entry-text { font-size: 0.85rem; line-height: 1.7; }
  .journal-entry { display: flex; gap: 8px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #f9a8d4; position: relative; }
  .journal-entry:last-child { border-bottom: none; margin-bottom: 0; }
  .entry-marker { flex-shrink: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; }
  .entry-body { flex: 1; min-width: 0; }
  .entry-meta-line { display: flex; align-items: center; gap: 5px; margin-bottom: 3px; }
  .entry-type-label { font-size: 0.65rem; color: #be185d; font-weight: 600; padding: 1px 6px; background: rgba(236,72,153,0.1); border-radius: 10px; }
  .entry-author-icon { font-size: 0.85rem; }
  .entry-text { color: #4b5563; line-height: 1.7; font-size: 0.8rem; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; text-align: right; font-family: 'Tajawal', sans-serif; direction: rtl; }
  .journal-entry.me .entry-text { border-right: 3px solid #a855f7; padding-right: 10px; }
  .journal-entry.friend .entry-text { border-right: 3px solid #ec4899; padding-right: 10px; }
  .entry-photos { display: flex; gap: 6px; margin-top: 5px; flex-wrap: wrap; }
  .photo-frame { position: relative; background: white; padding: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
  .photo-frame.frame-0 { transform: rotate(-2deg); }
  .photo-frame.frame-1 { transform: rotate(1deg); }
  .photo-frame.frame-2 { transform: rotate(-1deg); }
  .photo-tape { position: absolute; top: -6px; left: 50%; transform: translateX(-50%); width: 30px; height: 10px; background: linear-gradient(180deg, rgba(255,220,180,0.9) 0%, rgba(255,200,150,0.8) 100%); z-index: 2; }
  .photo-frame img { width: 80px; height: 80px; object-fit: cover; display: block; }
  .page-footer { padding: 15px 0; text-align: center; }
  .page-number { display: inline-block; width: 28px; height: 28px; line-height: 28px; background: rgba(236,72,153,0.1); border-radius: 50%; color: #be185d; font-size: 0.85rem; font-weight: 500; }
  .back-page { background: #fffbf5; border: 2px solid #f5e6d3; }
  .back-bg { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 26px, rgba(236,72,153,0.06) 26px, rgba(236,72,153,0.06) 27px); }
  .back-content { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; direction: rtl; }
  .back-quote { font-family: 'Tajawal', sans-serif; font-size: 1.3rem; color: #be185d; margin-bottom: 25px; line-height: 1.8; max-width: 80%; direction: rtl; }
  .back-decoration { font-size: 2rem; margin-bottom: 35px; letter-spacing: 8px; }
  .back-made { color: #9d174d; font-size: 1rem; margin-bottom: 8px; opacity: 0.8; direction: rtl; }
  .back-year { color: #be185d; font-size: 1.1rem; letter-spacing: 4px; font-weight: 600; }
  @media print { body { background: white; padding: 0; } .book-page { page-break-after: always; margin: 0; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
`;
