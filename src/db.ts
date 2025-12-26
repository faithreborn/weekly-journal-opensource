import type { JournalEntry, ArchivedWeek } from "./types";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

const DB_NAME = "journal-db";
const DB_VERSION = 2;
const ENTRIES_STORE = "entries";
const ARCHIVE_STORE = "archive";
const ARCHIVE_FOLDER = "journal-archives";

let db: IDBDatabase | null = null;

// Check if running on native platform
const isNative = Capacitor.isNativePlatform();

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(ENTRIES_STORE)) {
        database.createObjectStore(ENTRIES_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(ARCHIVE_STORE)) {
        database.createObjectStore(ARCHIVE_STORE, { keyPath: "id" });
      }
    };
  });
};

// Initialize archive folder
export const initArchiveFolder = async (): Promise<void> => {
  if (!isNative) return;

  try {
    await Filesystem.mkdir({
      path: ARCHIVE_FOLDER,
      directory: Directory.Documents,
      recursive: true,
    });
  } catch {
    // Folder might already exist
    console.log("Archive folder exists or created");
  }
};

// Entries functions (always use IndexedDB)
export const getAllEntries = async (): Promise<JournalEntry[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ENTRIES_STORE, "readonly");
    const store = transaction.objectStore(ENTRIES_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const addEntry = async (entry: JournalEntry): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ENTRIES_STORE, "readwrite");
    const store = transaction.objectStore(ENTRIES_STORE);
    const request = store.add(entry);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const updateEntry = async (entry: JournalEntry): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ENTRIES_STORE, "readwrite");
    const store = transaction.objectStore(ENTRIES_STORE);
    const request = store.put(entry);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const deleteEntry = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ENTRIES_STORE, "readwrite");
    const store = transaction.objectStore(ENTRIES_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const clearAllEntries = async (): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ENTRIES_STORE, "readwrite");
    const store = transaction.objectStore(ENTRIES_STORE);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Archive functions - Using Filesystem for native, IndexedDB for web
export const getAllArchives = async (): Promise<ArchivedWeek[]> => {
  if (isNative) {
    return getAllArchivesNative();
  }
  return getAllArchivesWeb();
};

const getAllArchivesWeb = async (): Promise<ArchivedWeek[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ARCHIVE_STORE, "readonly");
    const store = transaction.objectStore(ARCHIVE_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const archives = request.result || [];
      archives.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      resolve(archives);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

const getAllArchivesNative = async (): Promise<ArchivedWeek[]> => {
  try {
    await initArchiveFolder();

    const result = await Filesystem.readdir({
      path: ARCHIVE_FOLDER,
      directory: Directory.Documents,
    });

    const archives: ArchivedWeek[] = [];

    for (const file of result.files) {
      if (file.name.endsWith(".json")) {
        try {
          const content = await Filesystem.readFile({
            path: `${ARCHIVE_FOLDER}/${file.name}`,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          });
          const archive = JSON.parse(content.data as string) as ArchivedWeek;
          archives.push(archive);
        } catch (e) {
          console.error("Error reading archive file:", e);
        }
      }
    }

    archives.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return archives;
  } catch (e) {
    console.error("Error reading archives:", e);
    return [];
  }
};

export const addArchive = async (archive: ArchivedWeek): Promise<void> => {
  if (isNative) {
    return addArchiveNative(archive);
  }
  return addArchiveWeb(archive);
};

const addArchiveWeb = async (archive: ArchivedWeek): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ARCHIVE_STORE, "readwrite");
    const store = transaction.objectStore(ARCHIVE_STORE);
    const request = store.add(archive);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

const addArchiveNative = async (archive: ArchivedWeek): Promise<void> => {
  await initArchiveFolder();

  const jsonPath = `${ARCHIVE_FOLDER}/${archive.id}.json`;
  const htmlPath = `${ARCHIVE_FOLDER}/${archive.id}.html`;

  // Save metadata as JSON
  await Filesystem.writeFile({
    path: jsonPath,
    data: JSON.stringify(archive),
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });

  // Also save HTML file separately for easy sharing
  await Filesystem.writeFile({
    path: htmlPath,
    data: archive.htmlContent,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });

  // Log saved paths for debugging
  console.log("✅ Archive saved to Documents/" + jsonPath);
  console.log("✅ HTML saved to Documents/" + htmlPath);
};

export const deleteArchive = async (id: string): Promise<void> => {
  if (isNative) {
    return deleteArchiveNative(id);
  }
  return deleteArchiveWeb(id);
};

const deleteArchiveWeb = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ARCHIVE_STORE, "readwrite");
    const store = transaction.objectStore(ARCHIVE_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

const deleteArchiveNative = async (id: string): Promise<void> => {
  try {
    await Filesystem.deleteFile({
      path: `${ARCHIVE_FOLDER}/${id}.json`,
      directory: Directory.Documents,
    });
  } catch (e) {
    console.error("Error deleting JSON:", e);
  }

  try {
    await Filesystem.deleteFile({
      path: `${ARCHIVE_FOLDER}/${id}.html`,
      directory: Directory.Documents,
    });
  } catch (e) {
    console.error("Error deleting HTML:", e);
  }
};

// Get archive file path for sharing
export const getArchiveFilePath = async (
  id: string
): Promise<string | null> => {
  if (!isNative) return null;

  try {
    const result = await Filesystem.getUri({
      path: `${ARCHIVE_FOLDER}/${id}.html`,
      directory: Directory.Documents,
    });
    return result.uri;
  } catch (e) {
    console.error("Error getting file path:", e);
    return null;
  }
};


// Debug: List all archive files
export const listArchiveFiles = async (): Promise<string[]> => {
  if (!isNative) {
    console.log("Running on web - files stored in IndexedDB");
    return [];
  }

  try {
    await initArchiveFolder();
    const result = await Filesystem.readdir({
      path: ARCHIVE_FOLDER,
      directory: Directory.Documents,
    });
    
    const files = result.files.map(f => f.name);
    console.log("📁 Archive files:", files);
    console.log("📍 Location: Documents/" + ARCHIVE_FOLDER);
    return files;
  } catch (e) {
    console.error("Error listing files:", e);
    return [];
  }
};
