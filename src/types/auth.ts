
export type UserStatus = 'pending' | 'approved' | 'blocked';
export type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UpdateLog {
  id: string;
  status: string;
  message?: string;
  started_at: string;
  completed_at?: string;
  error_details?: string;
}
