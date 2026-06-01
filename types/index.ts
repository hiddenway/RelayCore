export interface AdminAccount {
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface TelegramBot {
  id: string;
  name: string;
  tokenEncrypted: string;
  username?: string;
  enabled: boolean;
  createdAt: string;
}

export interface RouteTarget {
  botId: string;
  chatId: string;
  chatName?: string;
}

export interface Route {
  slug: string;
  name: string;
  description?: string;
  apiKeyHash: string;
  targets: RouteTarget[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventLog {
  id: string;
  routeSlug: string;
  title?: string;
  message?: string;
  payload?: Record<string, unknown>;
  level: "info" | "success" | "warning" | "error";
  deliveries: DeliveryResult[];
  timestamp: string;
}

export interface DeliveryResult {
  botId: string;
  chatId: string;
  success: boolean;
  error?: string;
  messageId?: number;
}

export interface Stats {
  total: number;
  success: number;
  failed: number;
}

export interface RelayEventInput {
  title?: string;
  message?: string;
  payload?: Record<string, unknown>;
  level?: "info" | "success" | "warning" | "error";
}

export interface SetupState {
  completed: boolean;
}

export interface SessionPayload {
  username: string;
  iat: number;
  exp: number;
}
