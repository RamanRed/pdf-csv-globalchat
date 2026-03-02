import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { threadId, sessionId, message, pdfId, pdfIds, linkUrls, mode } =
      await request.json();

    // Support both threadId (new) and sessionId (legacy)
    const resolvedThreadId = threadId || null;
    const resolvedSessionId = sessionId || null;

    if (!message) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (!resolvedThreadId && !resolvedSessionId) {
      return NextResponse.json(
        { error: 'threadId or sessionId is required' },
        { status: 400 }
      );
    }

    // Build metadata (attachments, links, etc.)
    const metadata: Record<string, unknown> = {};
    if (pdfIds && pdfIds.length > 0) metadata.pdfIds = pdfIds;
    if (linkUrls && linkUrls.length > 0) metadata.linkUrls = linkUrls;

    // Pick the first attached PDF for the legacy pdf_id column
    const primaryPdfId = pdfId || (pdfIds && pdfIds.length > 0 ? pdfIds[0] : null);

    // ── Save user message to Supabase ─────────────────────────────────
    const { data: userMessage, error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: resolvedThreadId,
        session_id: resolvedSessionId,
        user_id: user.id,
        pdf_id: primaryPdfId,
        role: 'user',
        content: message,
      })
      .select()
      .single();

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    // ── Call RAG FastAPI Backend (HuggingFace pipeline) ───────────────
    let assistantContent = '';
    let ragSources: unknown[] = [];

    try {
      const ragResponse = await fetch(`${RAG_BACKEND_URL}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          message,
          thread_id: resolvedThreadId,
          mode: mode || 'rag',     // 'rag' | 'web' | 'hybrid'
          web_links: linkUrls || [],
          top_k: 5,
        }),
      });

      if (!ragResponse.ok) {
        const errText = await ragResponse.text();
        throw new Error(`RAG backend error ${ragResponse.status}: ${errText}`);
      }

      const ragData = await ragResponse.json();
      assistantContent = ragData.answer || 'No answer returned from RAG pipeline.';
      ragSources = ragData.sources || [];
    } catch (ragError) {
      console.error('RAG backend call failed:', ragError);
      // Graceful fallback — don't crash the whole request
      assistantContent =
        '⚠️ The AI backend is currently unavailable. Please ensure the RAG server is running at ' +
        RAG_BACKEND_URL;
    }

    // ── Save assistant message to Supabase ────────────────────────────
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: resolvedThreadId,
        session_id: resolvedSessionId,
        user_id: user.id,
        pdf_id: primaryPdfId,
        role: 'assistant',
        content: assistantContent,
      })
      .select()
      .single();

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
      return NextResponse.json(
        { error: 'Failed to save assistant response' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { userMessage, assistantMessage, sources: ragSources },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
