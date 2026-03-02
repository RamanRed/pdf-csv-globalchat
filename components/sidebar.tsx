'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  FileText,
  User,
  LogOut,
  Plus,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  sessions?: any[];
  onNewChat?: () => void;
  onSelectSession?: (sessionId: string) => void;
  currentSessionId?: string;
}

export function Sidebar({
  sessions = [],
  onNewChat,
  onSelectSession,
  currentSessionId,
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNewChat = () => {
    onNewChat?.();
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo/Header */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold text-lg">ChatApp</span>
        </Link>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={handleNewChat}
          className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground justify-start"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="text-xs font-semibold text-sidebar-foreground/60 uppercase px-2 mb-4">
          Recent Chats
        </p>
        {sessions.length === 0 ? (
          <p className="text-sm text-sidebar-foreground/50 px-2">
            No chats yet. Start a new one!
          </p>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                onSelectSession?.(session.id);
                setIsMobileOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                currentSessionId === session.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'hover:bg-sidebar-accent text-sidebar-foreground'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              <span className="truncate">{session.title || 'Untitled Chat'}</span>
            </button>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
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
          {isMobileOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:h-screen border-r border-border">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-64 z-40 md:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
