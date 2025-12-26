// Smart image compression - maintains quality while reducing size

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

const defaultOptions: CompressOptions = {
  maxWidth: 1920,      // Full HD width - good for viewing
  maxHeight: 1920,     // Full HD height
  quality: 0.85,       // 85% quality - visually identical
  maxSizeKB: 800,      // Target max 800KB per image
};

export const compressImage = (
  file: File | string,
  options: CompressOptions = {}
): Promise<string> => {
  const opts = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const maxW = opts.maxWidth!;
        const maxH = opts.maxHeight!;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Try to compress to target size
        let quality = opts.quality!;
        let result = canvas.toDataURL("image/jpeg", quality);

        // If still too large, reduce quality gradually
        const maxBytes = opts.maxSizeKB! * 1024;
        while (result.length > maxBytes && quality > 0.5) {
          quality -= 0.05;
          result = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Handle both File and base64 string
    if (typeof file === "string") {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    }
  });
};

// Compress multiple images
export const compressImages = async (
  files: File[],
  options?: CompressOptions
): Promise<string[]> => {
  const results: string[] = [];

  for (const file of files) {
    try {
      const compressed = await compressImage(file, options);
      results.push(compressed);
    } catch (error) {
      console.error("Error compressing image:", error);
      // If compression fails, try to use original
      const reader = new FileReader();
      const original = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      results.push(original);
    }
  }

  return results;
};

// Get estimated size of base64 string in KB
export const getBase64SizeKB = (base64: string): number => {
  // Remove data URL prefix if present
  const base64Data = base64.split(",")[1] || base64;
  // Base64 is ~33% larger than binary
  return Math.round((base64Data.length * 3) / 4 / 1024);
};

// Check if image needs compression
export const needsCompression = (base64: string, maxSizeKB = 800): boolean => {
  return getBase64SizeKB(base64) > maxSizeKB;
};
