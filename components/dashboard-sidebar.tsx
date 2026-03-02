'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  User,
  LogOut,
  Plus,
  Menu,
  X,
  LayoutDashboard,
  Clock,
  Loader2,
  Bot,
} from 'lucide-react';
import type { ChatThread } from '@/lib/types';

interface DashboardSidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (thread: ChatThread) => void;
  onNewChat: () => void;
  onBackToDashboard: () => void;
  userEmail: string;
  isCreating?: boolean;
}

export function DashboardSidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onBackToDashboard,
  userEmail,
  isCreating,
}: DashboardSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  // Group threads by date
  const todayThreads = threads.filter(t => {
    const diff = Date.now() - new Date(t.updated_at).getTime();
    return diff < 86400000;
  });
  const olderThreads = threads.filter(t => {
    const diff = Date.now() - new Date(t.updated_at).getTime();
    return diff >= 86400000;
  });

  const ThreadItem = ({ thread }: { thread: ChatThread }) => (
    <button
      onClick={() => {
        onSelectThread(thread);
        setIsMobileOpen(false);
      }}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors group ${activeThreadId === thread.id
          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
          : 'hover:bg-sidebar-accent text-sidebar-foreground'
        }`}
    >
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4 shrink-0 opacity-60" />
        <span className="truncate flex-1">{thread.title}</span>
      </div>
      <div className="flex items-center gap-2 mt-1 ml-6">
        <span className={`text-xs ${activeThreadId === thread.id
            ? 'text-sidebar-primary-foreground/60'
            : 'text-sidebar-foreground/40'
          }`}>
          {thread.message_count} msgs · {formatDate(thread.updated_at)}
        </span>
      </div>
    </button>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo/Header */}
      <div className="p-4 border-b border-sidebar-border">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold text-lg">AI Chat</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-2">
        <Button
          onClick={() => {
            onNewChat();
            setIsMobileOpen(false);
          }}
          disabled={isCreating}
          className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground justify-start"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {isCreating ? 'Creating...' : 'New Chat'}
        </Button>
        <Button
          onClick={() => {
            onBackToDashboard();
            setIsMobileOpen(false);
          }}
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Dashboard
        </Button>
      </div>

      {/* Thread History Sections */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
        {threads.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-6 h-6 mx-auto mb-2 text-sidebar-foreground/30" />
            <p className="text-sm text-sidebar-foreground/50">No chats yet</p>
            <p className="text-xs text-sidebar-foreground/30 mt-1">
              Click &ldquo;New Chat&rdquo; to start
            </p>
          </div>
        ) : (
          <>
            {todayThreads.length > 0 && (
              <>
                <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase px-2 pt-2 pb-1">
                  Today
                </p>
                {todayThreads.map((thread) => (
                  <ThreadItem key={thread.id} thread={thread} />
                ))}
              </>
            )}

            {olderThreads.length > 0 && (
              <>
                <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase px-2 pt-4 pb-1">
                  Previous
                </p>
                {olderThreads.map((thread) => (
                  <ThreadItem key={thread.id} thread={thread} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <div className="px-2 pb-2">
          <p className="text-xs text-sidebar-foreground/50 truncate">{userEmail}</p>
        </div>
        <Link href="/profile" className="block">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </Button>
        </Link>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-background border border-border"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:h-screen border-r border-border">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-72 z-40 md:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
