/**
 * Client-side API service layer.
 * All frontend components should use these helpers instead of calling
 * fetch() or Supabase directly, so there's a single place to maintain
 * when backend routes change.
 */

import type { ChatThread, ChatMessage, PDF } from './types';

// ─── Generic helpers ─────────────────────────────────────────────────
async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ─── Threads ─────────────────────────────────────────────────────────

export async function fetchThreads(): Promise<ChatThread[]> {
  const res = await fetch('/api/chat/threads');
  if (!res.ok) return [];          // fail silently — tables may not exist yet
  const data = await res.json() as { threads: ChatThread[]; setup_required?: boolean };
  return data.threads ?? [];
}

export async function createThread(
  title: string,
  model_type: string,
  description?: string
): Promise<ChatThread> {
  const res = await fetch('/api/chat/threads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, model_type, description }),
  });
  const body = await res.json() as { thread?: ChatThread; error?: string; setup_required?: boolean };
  if (body.setup_required) {
    throw new Error('⚠️ Database not set up. Run the SQL script in your Supabase SQL Editor first.');
  }
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body.thread!;
}

export async function getThread(threadId: string): Promise<ChatThread> {
  const data = await json<{ thread: ChatThread }>(
    await fetch(`/api/chat/threads/${threadId}`)
  );
  return data.thread;
}

export async function updateThread(
  threadId: string,
  updates: Partial<Pick<ChatThread, 'title' | 'status' | 'description' | 'model_type'>>
): Promise<ChatThread> {
  const data = await json<{ thread: ChatThread }>(
    await fetch(`/api/chat/threads/${threadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  );
  return data.thread;
}

export async function deleteThread(threadId: string): Promise<void> {
  await json<{ message: string }>(
    await fetch(`/api/chat/threads/${threadId}`, { method: 'DELETE' })
  );
}

// ─── Messages ────────────────────────────────────────────────────────

export async function fetchMessages(threadId: string): Promise<ChatMessage[]> {
  const data = await json<{ messages: ChatMessage[] }>(
    await fetch(`/api/chat/messages?threadId=${threadId}`)
  );
  return data.messages;
}

/**
 * Send a message (with optional file attachments).
 * Files are uploaded first via /api/pdfs/upload, then IDs are passed to /api/chat/send.
 */
export async function sendMessage(
  threadId: string,
  content: string,
  files?: File[],
  linkUrls?: string[]
): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
  // 1. Upload any files first
  const uploadedPdfIds: string[] = [];

  if (files && files.length > 0) {
    for (const file of files) {
      const pdf = await uploadFile(file);
      uploadedPdfIds.push(pdf.id);
    }
  }

  // 2. Send the chat message
  const data = await json<{ userMessage: ChatMessage; assistantMessage: ChatMessage }>(
    await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId,
        message: content,
        pdfIds: uploadedPdfIds.length > 0 ? uploadedPdfIds : undefined,
        linkUrls: linkUrls && linkUrls.length > 0 ? linkUrls : undefined,
      }),
    })
  );

  return data;
}

// ─── PDFs / Files ────────────────────────────────────────────────────

export async function uploadFile(file: File): Promise<PDF> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const category = ext === 'csv' ? 'csv' : 'pdf';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const data = await json<{ pdf: PDF }>(
    await fetch('/api/pdfs/upload', { method: 'POST', body: formData })
  );
  return data.pdf;
}

export async function fetchPdfs(): Promise<PDF[]> {
  const data = await json<{ pdfs: PDF[] }>(await fetch('/api/pdfs/list'));
  return data.pdfs;
}

// ─── User Profile ────────────────────────────────────────────────────

export async function fetchProfile() {
  return json<{ user: any }>(await fetch('/api/user/profile'));
}

export async function updateProfile(updates: { username?: string; avatar_url?: string }) {
  return json<{ user: any }>(
    await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  );
}
