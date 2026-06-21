import fs from "fs";
import path from "path";
import crypto from "crypto";

const DB_FILE = process.env.VERCEL 
  ? "/tmp/meta_manager_db.json" 
  : path.join(process.cwd(), "db.json");

const ENCRYPTION_KEY = process.env.META_APP_SECRET || "fallback_secret_key_meta_manager_32_bytes_long_!!!";
const IV_LENGTH = 16;

export interface BackgroundJob {
  id: string;
  type: "sync_pages" | "scan_posts" | "delete_posts" | "check_page_access" | "refresh_avatar" | "refresh_page_stats" | "check_api_access" | "scan_page_admins";
  page_id: string;
  status: "pending" | "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
  priority: number;
  payload: any;
  cursor: any;
  progress: number;
  total_items: number;
  processed_items: number;
  success_items: number;
  failed_items: number;
  attempt_count: number;
  max_attempts: number;
  next_run_at: string;
  started_at: string | null;
  completed_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageLock {
  page_id: string;
  lock_type: string;
  job_id: string;
  expires_at: string;
  created_at: string;
}

export interface CachedPage {
  id: string;
  name: string;
  avatar_url: string;
  access_status: "Bình thường" | "Thiếu quyền" | "Token lỗi" | "Chưa xác định";
  tasks: string[];
  last_synced_at: string;
  access_token_encrypted?: string;
  category?: string;
  monetization_status?: string;
}

export interface CachedPost {
  id: string;
  pageId: string;
  pageName: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
  status_type?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  delete_status?: "pending" | "deleting" | "deleted" | "failed" | "skipped";
}

export interface JobResult {
  id: string;
  job_id: string;
  page_id: string;
  item_type: "check_api_access" | "scan_page_admins";
  status: "pending" | "completed" | "failed";
  progress: number;
  result_json: any;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
}

interface DatabaseSchema {
  background_jobs: BackgroundJob[];
  page_locks: PageLock[];
  cached_pages: CachedPage[];
  cached_posts: CachedPost[];
  job_results: JobResult[];
}

function initDb(): DatabaseSchema {
  const defaultSchema: DatabaseSchema = {
    background_jobs: [],
    page_locks: [],
    cached_pages: [],
    cached_posts: [],
    job_results: []
  };

  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultSchema, null, 2), "utf-8");
      return defaultSchema;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.job_results) {
      parsed.job_results = [];
    }
    return parsed;
  } catch (e) {
    console.error("Database init error, resetting:", e);
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultSchema, null, 2), "utf-8");
    return defaultSchema;
  }
}

export function readDb(): DatabaseSchema {
  return initDb();
}

export function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Database write error:", e);
  }
}

// Token Encryption/Decryption Helpers
export function encrypt(text: string): string {
  if (!text) return "";
  try {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (e) {
    console.error("Encryption error:", e);
    return text;
  }
}

export function decrypt(text: string): string {
  if (!text) return "";
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return text;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error("Decryption error:", e);
    return text;
  }
}

// Job Lock Operations
export function acquireLock(pageId: string, jobId: string, lockType: string, durationSec: number = 300): boolean {
  const db = readDb();
  const now = new Date();
  
  // Clean expired locks first
  db.page_locks = db.page_locks.filter(lock => new Date(lock.expires_at) > now);

  // Check if there is an active lock on this page for this lockType
  const existingLock = db.page_locks.find(lock => lock.page_id === pageId && lock.lock_type === lockType);
  if (existingLock) {
    if (existingLock.job_id === jobId) return true; // Already locked by this job
    return false;
  }

  // Create new lock
  const expiresAt = new Date(now.getTime() + durationSec * 1000);
  db.page_locks.push({
    page_id: pageId,
    lock_type: lockType,
    job_id: jobId,
    expires_at: expiresAt.toISOString(),
    created_at: now.toISOString()
  });

  writeDb(db);
  return true;
}

export function releaseLock(pageId: string, jobId: string): void {
  const db = readDb();
  db.page_locks = db.page_locks.filter(lock => !(lock.page_id === pageId && lock.job_id === jobId));
  writeDb(db);
}

export function releaseAllExpiredLocks(): void {
  const db = readDb();
  const now = new Date();
  db.page_locks = db.page_locks.filter(lock => new Date(lock.expires_at) > now);
  writeDb(db);
}
