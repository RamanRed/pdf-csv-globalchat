'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Trash2, Clock, ArrowRight, Plus, Bot } from 'lucide-react';
import type { ChatThread } from '@/lib/types';

interface ThreadHistoryProps {
  threads: ChatThread[];
  onSelectThread: (thread: ChatThread) => void;
  onDeleteThread: (threadId: string) => void;
  onNewChat: () => void;
}

export function ThreadHistory({ threads, onSelectThread, onDeleteThread, onNewChat }: ThreadHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (threads.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Recent Conversations</h2>
        <Card className="p-12 text-center border-dashed">
          <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-foreground mb-2">No conversations yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Click <span className="font-semibold">New Chat</span> to start your first conversation.
          </p>
          <Button onClick={onNewChat} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Start a conversation
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Recent Conversations</h2>
        <span className="text-sm text-muted-foreground">
          {threads.length} thread{threads.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {threads.map((thread) => (
          <Card
            key={thread.id}
            className="group p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
            onClick={() => onSelectThread(thread)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                  {thread.model_type === 'minimax' ? 'MiniMax' :
                    thread.model_type === 'qwen-coder' ? 'Qwen Coder' : 'AI'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteThread(thread.id);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            <h3 className="font-semibold text-foreground truncate mb-1">
              {thread.title}
            </h3>

            {thread.description && (
              <p className="text-xs text-muted-foreground truncate mb-3">
                {thread.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(thread.updated_at)}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {thread.message_count} msgs
              </div>
            </div>

            <div className="flex items-center text-xs text-primary font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Continue chat <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
