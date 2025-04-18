export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Forum {
  id: number;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface DatabaseError {
  message: string;
  details: string;
  hint?: string;
  code: string;
}
