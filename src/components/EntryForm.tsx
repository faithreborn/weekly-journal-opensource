import { useState, useEffect } from "react";
import type { JournalEntry, AuthorType } from "../types";
import {
  X,
  BookOpen,
  Camera,
  Quote,
  HelpCircle,
  Frown,
  Smile,
  StickyNote,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { compressImage, getBase64SizeKB } from "../utils/imageCompressor";
import { uploadBase64Image } from "../supabaseDb";
import { Camera as CapCamera } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import "./EntryForm.css";

const MAX_IMAGES = 3; // Maximum images per entry

interface Props {
  onSubmit: (entry: Omit<JournalEntry, "id" | "date" | "author">) => void;
  onClose: () => void;
  author: AuthorType;
  editingEntry?: JournalEntry | null;
}

const entryTypes = [
  { type: "diary", label: "يومية", icon: BookOpen, color: "#8b5cf6" },
  { type: "photo", label: "صور", icon: Camera, color: "#ec4899" },
  { type: "quote", label: "قصاصة", icon: Quote, color: "#06b6d4" },
  { type: "question", label: "سؤال", icon: HelpCircle, color: "#f59e0b" },
  { type: "sad-moment", label: "لحظة زعلتني", icon: Frown, color: "#6366f1" },
  { type: "happy-moment", label: "لحظة فرحتني", icon: Smile, color: "#10b981" },
  { type: "note", label: "ملاحظة", icon: StickyNote, color: "#f97316" },
] as const;

export default function EntryForm({
  onSubmit,
  onClose,
  author,
  editingEntry,
}: Props) {
  const [type, setType] = useState<JournalEntry["type"]>("diary");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setType(editingEntry.type);
      setContent(editingEntry.content);
      setImages(editingEntry.images || []);
    }
  }, [editingEntry]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check max images limit
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      alert(`الحد الأقصى ${MAX_IMAGES} صور لكل إدخال`);
      e.target.value = "";
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setIsCompressing(true);

    try {
      for (const file of filesToProcess) {
        // Compress image while maintaining quality
        const compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
          maxSizeKB: 800,
        });

        const sizeKB = getBase64SizeKB(compressed);
        console.log(`Image compressed: ${file.name} → ${sizeKB}KB`);

        setImages((prev) => [...prev, compressed]);
      }
    } catch (error) {
      console.error("Error processing images:", error);
      alert("حدث خطأ أثناء معالجة الصور");
    } finally {
      setIsCompressing(false);
      e.target.value = "";
    }
  };

  // Native image picker using Capacitor Camera
  const handleNativeImagePick = async () => {
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      alert(`الحد الأقصى ${MAX_IMAGES} صور لكل إدخال`);
      return;
    }

    setIsCompressing(true);

    try {
      // Request permissions first on iOS
      const permissions = await CapCamera.requestPermissions({ permissions: ['photos'] });
      
      if (permissions.photos === 'denied') {
        alert('يرجى السماح بالوصول للصور من الإعدادات');
        setIsCompressing(false);
        return;
      }

      const result = await CapCamera.pickImages({
        quality: 85,
        limit: remainingSlots,
      });

      for (const photo of result.photos) {
        if (photo.webPath) {
          try {
            // Fetch the image and convert to base64
            const response = await fetch(photo.webPath);
            const blob = await response.blob();
            const file = new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" });
            
            const compressed = await compressImage(file, {
              maxWidth: 1920,
              maxHeight: 1920,
              quality: 0.85,
              maxSizeKB: 800,
            });

            setImages((prev) => [...prev, compressed]);
          } catch (imgError) {
            console.error("Error processing single image:", imgError);
          }
        }
      }
    } catch (error: unknown) {
      // User cancelled - ignore
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("cancel") || errorMessage.includes("Cancel")) {
        setIsCompressing(false);
        return;
      }
      console.error("Error picking images:", error);
      // Fallback to file input on error
      document.getElementById("image-input")?.click();
    } finally {
      setIsCompressing(false);
    }
  };

  // Choose between native picker or web file input
  const handleAddImages = () => {
    if (Capacitor.isNativePlatform()) {
      handleNativeImagePick();
    } else {
      // Trigger file input for web
      document.getElementById("image-input")?.click();
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const doSubmit = async () => {
    console.log("doSubmit called", { content, images });
    if (!content.trim() && images.length === 0) {
      console.log("Empty content, returning");
      return;
    }
    
    setIsCompressing(true);
    
    try {
      // Upload images to Supabase Storage
      const uploadedUrls: string[] = [];
      for (const img of images) {
        // Check if it's already a URL (from editing)
        if (img.startsWith('http')) {
          uploadedUrls.push(img);
        } else {
          // Upload base64 image
          const url = await uploadBase64Image(img);
          if (url) {
            uploadedUrls.push(url);
          }
        }
      }
      
      console.log("Calling onSubmit with uploaded images");
      onSubmit({
        type,
        content,
        images: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("حدث خطأ أثناء رفع الصور");
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button type="button" className="close-btn" onClick={onClose}>
          <X />
        </button>

        <h2>
          {editingEntry ? "Edit" : "Add New"}{" "}
          {author === "user1" ? "💜" : "💖"}
        </h2>

        <div className="form-content">
          <div className="type-selector">
            {entryTypes.map(({ type: t, label, icon: Icon, color }) => (
              <button
                key={t}
                type="button"
                className={`type-btn ${type === t ? "active" : ""}`}
                onClick={() => setType(t)}
                style={{ "--type-color": color } as React.CSSProperties}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتبي هنا..."
            rows={4}
          />

          <div className="images-section">
            <div className="images-header">
              <span>الصور ({images.length}/{MAX_IMAGES})</span>
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  className={`add-image-btn ${isCompressing ? "disabled" : ""}`}
                  onClick={handleAddImages}
                  disabled={isCompressing}
                >
                  {isCompressing ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      <span>جاري الضغط...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>إضافة صور</span>
                    </>
                  )}
                </button>
              )}
              {/* Hidden file input for web fallback */}
              <input
                id="image-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={isCompressing}
                style={{ display: "none" }}
              />
            </div>

            {images.length > 0 && (
              <div className="images-grid">
                {images.map((img, index) => (
                  <div key={index} className="image-item">
                    <img src={img} alt="" />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="button" 
            className="submit-btn" 
            onClick={doSubmit}
            disabled={isCompressing}
          >
            {editingEntry ? "حفظ التعديلات ✨" : "إضافة ✨"}
          </button>
        </div>
      </div>
    </div>
  );
}
