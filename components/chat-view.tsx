'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Paperclip,
  FileText,
  FileSpreadsheet,
  Link2,
  X,
  Upload,
  ExternalLink,
  Filter,
  ChevronDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { fetchMessages, sendMessage } from '@/lib/api';
import type { ChatThread, ChatMessage, Attachment, FileFilterType } from '@/lib/types';
import { CHAT_MODELS } from '@/lib/types';

interface ChatViewProps {
  thread: ChatThread | null;
  onBack: () => void;
}

// ─── URL detection helpers ───────────────────────────────────────────
const URL_REGEX = /(https?:\/\/[^\s<>)"']+)/gi;

function renderContentWithLinks(text: string) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 text-blue-500 hover:text-blue-400 inline-flex items-center gap-0.5 break-all"
      >
        {part}
        <ExternalLink className="w-3 h-3 shrink-0 inline" />
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// ─── Attachment chip ─────────────────────────────────────────────────
function AttachmentChip({
  attachment,
  onRemove,
  readonly = false,
}: {
  attachment: Attachment;
  onRemove?: () => void;
  readonly?: boolean;
}) {
  const icon =
    attachment.type === 'pdf' ? (
      <FileText className="w-3.5 h-3.5 text-red-500" />
    ) : attachment.type === 'csv' ? (
      <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
    ) : (
      <Link2 className="w-3.5 h-3.5 text-blue-500" />
    );

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
        attachment.status === 'error'
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-border bg-secondary/50 text-foreground'
      }`}
    >
      {icon}
      <span className="max-w-[120px] truncate">{attachment.name}</span>
      {attachment.type !== 'link' && (
        <span className="text-muted-foreground">
          ({formatSize(attachment.size)})
        </span>
      )}
      {attachment.status === 'uploading' && (
        <span className="text-muted-foreground animate-pulse">uploading…</span>
      )}
      {!readonly && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 p-0.5 rounded hover:bg-destructive/20 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// ─── Main component ──────────────────────────────────────────────────
export function ChatView({ thread, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [filterType, setFilterType] = useState<FileFilterType>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const model = CHAT_MODELS.find((m) => m.id === thread?.model_type);

  // ── Load messages from backend when thread changes ──
  useEffect(() => {
    if (!thread) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const msgs = await fetchMessages(thread.id);
        if (!cancelled) setMessages(msgs);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();

    return () => { cancelled = true; };
  }, [thread?.id]);

  // ── Auto-scroll ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Auto-resize textarea ──
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [input]);

  // ── File handling ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const type: Attachment['type'] =
        ext === 'csv' ? 'csv' : 'pdf';

      // Validate file type
      if (!['pdf', 'csv'].includes(ext || '')) {
        return; // skip unsupported
      }

      const attachment: Attachment = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        type,
        status: 'pending',
      };
      setAttachments((prev) => [...prev, attachment]);
    });

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleAddLink = () => {
    const url = linkInput.trim();
    if (!url) return;

    // Basic URL validation
    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    const attachment: Attachment = {
      id: crypto.randomUUID(),
      file: null,
      name: finalUrl.replace(/^https?:\/\//, '').split('/')[0],
      size: 0,
      type: 'link',
      url: finalUrl,
      status: 'uploaded',
    };
    setAttachments((prev) => [...prev, attachment]);
    setLinkInput('');
    setIsLinkPopoverOpen(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // ── Sending ──
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isSending || !thread) return;

    const content = input.trim();
    const currentAttachments = [...attachments];

    // Optimistic user message
    const tempUserId = crypto.randomUUID();
    const optimisticMsg: ChatMessage = {
      id: tempUserId,
      thread_id: thread.id,
      session_id: null,
      user_id: thread.user_id,
      pdf_id: null,
      role: 'user',
      content,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');
    setAttachments([]);
    setIsSending(true);

    try {
      // Collect real File objects and link URLs
      const files = currentAttachments
        .filter((a) => a.file && a.type !== 'link')
        .map((a) => a.file as File);
      const linkUrls = currentAttachments
        .filter((a) => a.type === 'link' && a.url)
        .map((a) => a.url as string);

      const { userMessage, assistantMessage } = await sendMessage(
        thread.id,
        content,
        files.length > 0 ? files : undefined,
        linkUrls.length > 0 ? linkUrls : undefined
      );

      // Replace optimistic user message with server response, add assistant
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== tempUserId);
        // Preserve client-side attachments on the user message for display
        const enrichedUserMsg: ChatMessage = {
          ...userMessage,
          attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
        };
        return [...withoutOptimistic, enrichedUserMsg, assistantMessage];
      });
    } catch (err) {
      console.error('Send failed:', err);
      // Mark optimistic message as errored
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempUserId
            ? { ...m, content: `${m.content}\n\n⚠️ Failed to send — ${err instanceof Error ? err.message : 'unknown error'}` }
            : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  // ── Keyboard shortcut: Enter to send, Shift+Enter for newline ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // ── Filtering: count attachments across all messages ──
  const allAttachments = messages.flatMap((m) => m.attachments || []);
  const attachmentCounts = {
    all: allAttachments.length,
    pdf: allAttachments.filter((a) => a.type === 'pdf').length,
    csv: allAttachments.filter((a) => a.type === 'csv').length,
    link: allAttachments.filter((a) => a.type === 'link').length,
  };

  // Filtered messages (show all messages, highlight those with matching attachments)
  const filteredMessages =
    filterType === 'all'
      ? messages
      : messages.filter(
          (m) =>
            !m.attachments ||
            m.attachments.length === 0 ||
            m.attachments.some((a) => a.type === filterType) ||
            m.role === 'assistant'
        );

  // ── Empty state ──
  if (!thread) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No thread selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Header ── */}
      <div className="border-b border-border px-4 py-3 flex items-center gap-3 bg-background/95 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="hidden md:flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="h-5 w-px bg-border hidden md:block" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl">{model?.icon || '💬'}</span>
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground truncate text-sm">{thread.title}</h2>
            <p className="text-xs text-muted-foreground">{model?.name || thread.model_type}</p>
          </div>
        </div>

        {/* Attachment filter */}
        {allAttachments.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Filter className="w-3.5 h-3.5" />
                {filterType === 'all' ? 'All' : filterType.toUpperCase()}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Filter by attachment</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterType('all')}>
                All ({attachmentCounts.all})
              </DropdownMenuItem>
              {attachmentCounts.pdf > 0 && (
                <DropdownMenuItem onClick={() => setFilterType('pdf')}>
                  <FileText className="w-3.5 h-3.5 mr-2 text-red-500" />
                  PDF ({attachmentCounts.pdf})
                </DropdownMenuItem>
              )}
              {attachmentCounts.csv > 0 && (
                <DropdownMenuItem onClick={() => setFilterType('csv')}>
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-2 text-green-600" />
                  CSV ({attachmentCounts.csv})
                </DropdownMenuItem>
              )}
              {attachmentCounts.link > 0 && (
                <DropdownMenuItem onClick={() => setFilterType('link')}>
                  <Link2 className="w-3.5 h-3.5 mr-2 text-blue-500" />
                  Links ({attachmentCounts.link})
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Badge variant="secondary" className="text-xs">
          {thread.message_count} msgs
        </Badge>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading state */}
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading messages…</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <p className="text-sm text-destructive">{loadError}</p>
              <Button variant="outline" size="sm" onClick={() => {
                if (thread) {
                  setIsLoading(true);
                  setLoadError(null);
                  fetchMessages(thread.id)
                    .then(setMessages)
                    .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed'))
                    .finally(() => setIsLoading(false));
                }
              }}>
                Retry
              </Button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4 max-w-lg px-4">
              <div className="text-5xl">{model?.icon || '💬'}</div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{thread.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Start a conversation with {model?.name || 'the AI'}.
                  {model?.description ? ` ${model.description}.` : ''}
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['Explain a concept', 'Analyze this PDF', 'Summarize CSV data', 'Help me write'].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>

              {/* Upload hint cards */}
              <div className="grid grid-cols-3 gap-3 pt-4 max-w-sm mx-auto">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-muted-foreground">Upload PDF</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                >
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <span className="text-xs text-muted-foreground">Upload CSV</span>
                </button>
                <button
                  onClick={() => setIsLinkPopoverOpen(true)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                >
                  <Link2 className="w-5 h-5 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Add Link</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="max-w-[75%] space-y-1.5">
                <Card
                  className={`px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-card-foreground border border-border'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {renderContentWithLinks(message.content)}
                  </div>

                  {/* Attachments in message */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/30">
                      {message.attachments.map((att) => (
                        <AttachmentChip key={att.id} attachment={att} readonly />
                      ))}
                    </div>
                  )}

                  <p
                    className={`text-xs mt-2 ${
                      message.role === 'user'
                        ? 'text-primary-foreground/60'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </Card>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isSending && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <Card className="px-4 py-3 bg-card border border-border">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div className="border-t border-border bg-background">
        {/* Attachment preview strip */}
        {attachments.length > 0 && (
          <div className="px-4 pt-3 flex flex-wrap gap-1.5">
            {attachments.map((att) => (
              <AttachmentChip
                key={att.id}
                attachment={att}
                onRemove={() => removeAttachment(att.id)}
              />
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="p-4 pt-3">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-secondary/30 p-2 focus-within:border-primary/50 transition-colors">
            {/* Attachment actions */}
            <div className="flex items-center gap-0.5 pb-0.5">
              {/* File upload */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
                title="Upload PDF or CSV"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.csv"
                multiple
                onChange={handleFileSelect}
              />

              {/* Link popover */}
              <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Add a link"
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3" side="top" align="start">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Add a link</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
                        placeholder="https://example.com"
                        className="flex-1 px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddLink}
                        disabled={!linkInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste any URL to include it as a reference
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${model?.name || 'AI'}…`}
              disabled={isSending}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[36px] max-h-[160px] py-2 px-1"
            />

            {/* Send */}
            <Button
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || isSending}
              size="icon"
              className="h-8 w-8 shrink-0 mb-0.5"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Hint bar */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-red-400" /> PDF
              </span>
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3 text-green-500" /> CSV
              </span>
              <span className="flex items-center gap-1">
                <Link2 className="w-3 h-3 text-blue-400" /> Links
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Shift+Enter for new line
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
