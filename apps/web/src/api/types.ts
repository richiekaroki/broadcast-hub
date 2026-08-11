export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalContent: number;
  publishedContent: number;
  todayViews: number;
  cached: boolean;
}

export interface ContentItem {
  id: string;
  title: string;
  body: string;
  status: ContentStatus;
  authorId: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  presenterId: string | null;
  createdAt: string;
}

export interface ProgramsResponse {
  data: Program[];
  total: number;
  page: number;
  limit: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, any>;
  createdAt: string;
}
