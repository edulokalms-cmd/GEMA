import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.resolve('./firebase-applet-config.json');

export const TABLE_KEYS = [
  'users',
  'materials',
  'quizzes',
  'questions',
  'progress',
  'quiz_results',
  'badges',
  'user_badges',
  'points',
  'activities',
  'settings',
  'attendances',
  'assignments',
  'assignment_submissions',
  'exam_grades',
  'courses',
  'discussion_threads',
  'discussion_comments',
  'departments',
  'classes',
  'lecturer_grade_components',
  'lecturer_grade_weights',
  'course_groups',
] as const;

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let isConnected = false;
let lastSyncedTime: string | null = null;
let lastSyncError: string | null = null;

export function initFirebase(): { app: FirebaseApp; db: Firestore } | null {
  if (firestoreDb) return { app: firebaseApp!, db: firestoreDb };

  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      console.warn('[Firebase] firebase-applet-config.json tidak ditemukan, Firestore tidak aktif.');
      return null;
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    if (!config.projectId || !config.apiKey) {
      console.warn('[Firebase] Konfigurasi Firebase tidak lengkap.');
      return null;
    }

    const apps = getApps();
    firebaseApp = apps.length > 0 ? apps[0] : initializeApp(config);
    firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId || undefined);
    isConnected = true;
    console.log('[Firebase] Firestore berhasil diinisialisasi:', {
      projectId: config.projectId,
      databaseId: config.firestoreDatabaseId || '(default)',
    });
    return { app: firebaseApp, db: firestoreDb };
  } catch (err: any) {
    console.error('[Firebase] Gagal menginisialisasi Firebase:', err.message);
    lastSyncError = err.message;
    return null;
  }
}

/**
 * Memuat database lengkap dari Firebase Firestore
 */
export async function loadDatabaseFromFirestore(): Promise<any | null> {
  const fb = initFirebase();
  if (!fb) return null;

  try {
    const metaRef = doc(fb.db, 'system_tables', 'metadata');
    const metaSnap = await getDoc(metaRef);

    if (!metaSnap.exists() || !metaSnap.data()?.initialized) {
      console.log('[Firebase] Metadata belum ditemukan di Firestore (database cloud baru).');
      return null;
    }

    console.log('[Firebase] Menemukan data di Firestore, memulihkan seluruh tabel sistem...');
    const reconstructed: Record<string, any> = {};

    for (const table of TABLE_KEYS) {
      try {
        const snap = await getDoc(doc(fb.db, 'system_tables', table));
        if (snap.exists()) {
          const data = snap.data();
          if (data.chunksCount && typeof data.chunksCount === 'number') {
            let items: any[] = [];
            for (let i = 0; i < data.chunksCount; i++) {
              const chunkSnap = await getDoc(doc(fb.db, 'system_tables', `${table}_chunk_${i}`));
              if (chunkSnap.exists() && Array.isArray(chunkSnap.data()?.items)) {
                items = items.concat(chunkSnap.data().items);
              }
            }
            reconstructed[table] = items;
          } else if (data.items !== undefined) {
            reconstructed[table] = data.items;
          } else if (data.data !== undefined) {
            reconstructed[table] = data.data;
          }
        }
      } catch (tableErr: any) {
        console.warn(`[Firebase] Gagal memuat tabel ${table}:`, tableErr.message);
      }
    }

    // Validasi minimal ada data pengguna & courses
    if (Array.isArray(reconstructed.users) && reconstructed.users.length > 0) {
      lastSyncedTime = new Date().toISOString();
      console.log(`[Firebase] Berhasil memuat data dari cloud: ${reconstructed.users.length} pengguna, ${(reconstructed.courses || []).length} mata kuliah, ${(reconstructed.materials || []).length} materi.`);
      return reconstructed;
    }

    return null;
  } catch (err: any) {
    console.error('[Firebase] Gagal memuat data dari Firestore:', err.message);
    lastSyncError = err.message;
    return null;
  }
}

/**
 * Menyimpan seluruh database ke Firebase Firestore (dengan proteksi ukuran 1MB chunking)
 */
export async function saveDatabaseToFirestore(data: any): Promise<boolean> {
  const fb = initFirebase();
  if (!fb) return false;

  try {
    let totalItems = 0;

    for (const table of TABLE_KEYS) {
      const val = data[table];
      if (val === undefined) continue;

      const str = JSON.stringify(val);
      const isLargeArray = Array.isArray(val) && str.length > 700 * 1024;

      if (isLargeArray) {
        const half = Math.ceil(val.length / 2);
        const chunk0 = val.slice(0, half);
        const chunk1 = val.slice(half);

        await setDoc(doc(fb.db, 'system_tables', `${table}_chunk_0`), { items: chunk0 });
        await setDoc(doc(fb.db, 'system_tables', `${table}_chunk_1`), { items: chunk1 });
        await setDoc(doc(fb.db, 'system_tables', table), {
          chunksCount: 2,
          totalCount: val.length,
          updated_at: new Date().toISOString(),
        });
        totalItems += val.length;
      } else {
        if (Array.isArray(val)) {
          await setDoc(doc(fb.db, 'system_tables', table), {
            items: val,
            totalCount: val.length,
            updated_at: new Date().toISOString(),
          });
          totalItems += val.length;
        } else {
          await setDoc(doc(fb.db, 'system_tables', table), {
            data: val,
            updated_at: new Date().toISOString(),
          });
          totalItems += 1;
        }
      }
    }

    lastSyncedTime = new Date().toISOString();
    lastSyncError = null;

    await setDoc(doc(fb.db, 'system_tables', 'metadata'), {
      initialized: true,
      last_synced: lastSyncedTime,
      total_items: totalItems,
      version: '1.0.0',
    });

    console.log(`[Firebase] Berhasil menyinkronkan seluruh database ke Firestore pada ${lastSyncedTime}`);
    return true;
  } catch (err: any) {
    console.error('[Firebase] Gagal menyinkronkan database ke Firestore:', err.message);
    lastSyncError = err.message;
    return false;
  }
}

/**
 * Debounce helper agar pemanggilan berulang saveDatabase tidak membebani Firestore
 */
let debounceTimeout: NodeJS.Timeout | null = null;

export function triggerFirestoreSync(data: any, delayMs = 500): void {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

  debounceTimeout = setTimeout(async () => {
    debounceTimeout = null;
    await saveDatabaseToFirestore(data);
  }, delayMs);
}

export function getFirestoreCloudStatus() {
  let projectId = '';
  let databaseId = '';
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      projectId = config.projectId || '';
      databaseId = config.firestoreDatabaseId || '';
    }
  } catch {}

  return {
    provider: 'firebase_firestore',
    is_connected: isConnected,
    project_id: projectId,
    database_id: databaseId,
    last_synced: lastSyncedTime,
    last_error: lastSyncError,
  };
}
