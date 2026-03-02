'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { fetchThreads, createThread as apiCreateThread, deleteThread as apiDeleteThread } from '@/lib/api';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { WelcomeHero } from '@/components/welcome-hero';
import { ThreadHistory } from '@/components/thread-history';
import { ChatView } from '@/components/chat-view';
import type { ChatThread } from '@/lib/types';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';

// Supabase project ref extracted from the public URL
const SUPABASE_SQL_EDITOR = 'https://supabase.com/dashboard/project/pprihwbaqkyaxijofqpk/sql/new';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [view, setView] = useState<'dashboard' | 'chat'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      setUser({ id: authUser.id, email: authUser.email || '' });

      try {
        const threadsData = await fetchThreads();
        setThreads(threadsData);
      } catch (err) {
        console.error('Error loading threads:', err);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = useCallback(async () => {
    if (!user || isCreating) return;
    setIsCreating(true);
    setSetupError(null);
    try {
      const newThread = await apiCreateThread('New Chat', 'minimax', 'Chat with AI');
      setThreads(prev => [newThread, ...prev]);
      setActiveThread(newThread);
      setView('chat');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create chat';
      setSetupError(msg);
      console.error('Error creating thread:', error);
    } finally {
      setIsCreating(false);
    }
  }, [user, isCreating]);

  const handleSelectThread = useCallback((thread: ChatThread) => {
    setActiveThread(thread);
    setView('chat');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setView('dashboard');
    setActiveThread(null);
    fetchThreads()
      .then(setThreads)
      .catch((err) => console.error('Error refreshing threads:', err));
  }, []);

  const handleDeleteThread = useCallback(async (threadId: string) => {
    try {
      await apiDeleteThread(threadId);
      setThreads(prev => prev.filter(t => t.id !== threadId));
      if (activeThread?.id === threadId) {
        setActiveThread(null);
        setView('dashboard');
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  }, [activeThread]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        threads={threads}
        activeThreadId={activeThread?.id || null}
        onSelectThread={handleSelectThread}
        onNewChat={handleNewChat}
        onBackToDashboard={handleBackToDashboard}
        userEmail={user?.email || ''}
        isCreating={isCreating}
      />

      <main className="flex-1 overflow-hidden pt-16 md:pt-0">
        {view === 'dashboard' ? (
          <div className="h-full overflow-y-auto">

            {/* ── Setup required banner ─────────────────────────────── */}
            {setupError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg mx-6 mt-6 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-destructive text-sm">{setupError}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You need to create the database tables in Supabase before you can start chatting.
                  </p>
                  <a
                    href={SUPABASE_SQL_EDITOR}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-primary hover:underline"
                  >
                    Open Supabase SQL Editor
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Copy &amp; paste the contents of{' '}
                    <code className="bg-muted px-1 rounded text-xs">scripts/create-supabase-tables.sql</code>{' '}
                    and click Run.
                  </p>
                </div>
                <button
                  onClick={() => setSetupError(null)}
                  className="text-muted-foreground hover:text-foreground text-sm shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            <WelcomeHero
              userEmail={user?.email || ''}
              threadCount={threads.length}
              onNewChat={handleNewChat}
              isCreating={isCreating}
            />

            <div className="max-w-6xl mx-auto px-6 pb-12">
              <ThreadHistory
                threads={threads}
                onSelectThread={handleSelectThread}
                onDeleteThread={handleDeleteThread}
                onNewChat={handleNewChat}
              />
            </div>
          </div>
        ) : (
          <ChatView
            thread={activeThread}
            onBack={handleBackToDashboard}
          />
        )}
      </main>
    </div>
  );
}
