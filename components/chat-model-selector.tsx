'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowRight } from 'lucide-react';
import type { ChatModel } from '@/lib/types';

interface ChatModelSelectorProps {
  models: ChatModel[];
  onSelectModel: (model: ChatModel, title?: string) => void;
}

export function ChatModelSelector({ models, onSelectModel }: ChatModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<ChatModel | null>(null);
  const [chatTitle, setChatTitle] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleModelClick = (model: ChatModel) => {
    setSelectedModel(model);
    setChatTitle('');
    setIsDialogOpen(true);
  };

  const handleStartChat = () => {
    if (selectedModel) {
      onSelectModel(selectedModel, chatTitle || undefined);
      setIsDialogOpen(false);
      setSelectedModel(null);
      setChatTitle('');
    }
  };

  const categoryLabels: Record<string, string> = {
    general: 'General Purpose',
    code: 'Code & Development',
    creative: 'Creative & Multi-modal',
    analysis: 'Analysis & Research',
  };

  // Group models by category
  const categories = models.reduce((acc, model) => {
    if (!acc[model.category]) acc[model.category] = [];
    acc[model.category].push(model);
    return acc;
  }, {} as Record<string, ChatModel[]>);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Chat Models</h2>
        <p className="text-muted-foreground">Select a model to start a new conversation</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => (
          <Card
            key={model.id}
            className={`group relative p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5 ${
              !model.isAvailable ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => model.isAvailable && handleModelClick(model)}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{model.icon}</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                {categoryLabels[model.category] || model.category}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {model.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {model.description}
            </p>
            <div className="flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Start Chat <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Card>
        ))}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedModel?.icon}</span>
              New {selectedModel?.name} Chat
            </DialogTitle>
            <DialogDescription>
              Give your chat a name to easily find it later, or leave blank for a default title.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={`e.g., "Project analysis", "Code review"...`}
              value={chatTitle}
              onChange={(e) => setChatTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartChat()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartChat}>
              Start Chat <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
