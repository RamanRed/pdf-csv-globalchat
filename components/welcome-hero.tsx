'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, MessageSquare, Clock, Plus, Loader2 } from 'lucide-react';

interface WelcomeHeroProps {
  userEmail: string;
  threadCount: number;
  onNewChat: () => void;
  isCreating?: boolean;
}

export function WelcomeHero({ userEmail, threadCount, onNewChat, isCreating }: WelcomeHeroProps) {
  const username = userEmail.split('@')[0];

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-accent/5" />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col items-start gap-6">
          {/* Greeting */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">
                AI Chat — Powered by HuggingFace
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {getGreeting()},{' '}
              <span className="text-primary">{username}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Start a new conversation or pick up where you left off.
            </p>
          </div>

          {/* Stats + New Chat CTA */}
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={onNewChat}
              disabled={isCreating}
              size="lg"
              className="gap-2 shadow-md"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isCreating ? 'Creating...' : 'New Chat'}
            </Button>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">
                <span className="font-semibold text-foreground">{threadCount}</span> conversation{threadCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
