// Shared types for the chat application
export interface ChatThread {
  id: string;
  user_id: string;
  title: string;
  model_type: string;
  description: string | null;
  status: 'active' | 'archived' | 'deleted';
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  thread_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

// Attachment type for files sent alongside messages
export interface Attachment {
  id: string;
  file: File | null; // null when loaded from server
  name: string;
  size: number;
  type: 'pdf' | 'csv' | 'link';
  url?: string; // for links or uploaded file URLs
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  session_id: string | null;
  user_id: string;
  pdf_id: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  created_at: string;
}

export interface PDF {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  category: 'pdf' | 'csv' | 'graph' | 'space';
  uploaded_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'general' | 'code' | 'creative' | 'analysis';
  isAvailable: boolean;
}

// Filter types for document browsing
export type FileFilterType = 'all' | 'pdf' | 'csv' | 'link';

// Available chat models
export const CHAT_MODELS: ChatModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Most capable model for complex tasks',
    icon: '🧠',
    category: 'general',
    isAvailable: true,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient for everyday tasks',
    icon: '⚡',
    category: 'general',
    isAvailable: true,
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    description: 'Advanced reasoning and analysis',
    icon: '🔬',
    category: 'analysis',
    isAvailable: true,
  },
  {
    id: 'codellama',
    name: 'Code Llama',
    description: 'Specialized for code generation',
    icon: '💻',
    category: 'code',
    isAvailable: true,
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Multi-modal understanding',
    icon: '✨',
    category: 'creative',
    isAvailable: true,
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B',
    description: 'Lightweight open-source model',
    icon: '🌊',
    category: 'general',
    isAvailable: true,
  },
];
