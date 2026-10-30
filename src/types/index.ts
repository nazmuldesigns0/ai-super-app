export type UserRole = "user" | "admin";
export type SubscriptionTier = "free" | "pro" | "enterprise";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  photoURL?: string;
  role: UserRole;
  creditBalance: number;
  creditResetAt: string; // ISO
  subscriptionTier: SubscriptionTier;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number; // negative = usage
  type: "usage" | "reset" | "purchase" | "bonus" | "admin_adjust";
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface MasterPrompt {
  id: string;
  title: string;
  description?: string;
  category?: string;
  formSchema: FormField[];
  promptTemplate: string;
  isPublic: boolean;
  createdBy?: string;
  usageCount: number;
  createdAt: string;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number";
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
  tokensUsed?: number;
  model?: string;
  comparison?: {
    modelB: string;
    contentB: string;
    winner?: "modelA" | "modelB" | "tie" | "both_bad";
  };
  createdAt: string;
}

export interface Attachment {
  id?: string;
  url: string;
  type: string;
  name: string;
  size: number;
  data?: string; // base64 representation if sent inline
}

export interface LibraryFile {
  id: string;
  userId: string;
  name: string;
  fileType: string;
  storagePath: string;
  publicUrl?: string;
  sizeBytes: number;
  source: string;
  expiresAt: string; // ISO string 30 days ahead
  createdAt: string;
  thumbnailUrl?: string;
}

export interface AIModel {
  id: string;
  displayName: string;
  provider: string;
  isEnabled: boolean;
  creditCost: number;
  maxTokens?: number;
  description?: string;
  badge?: string;
  updatedAt: string;
}

