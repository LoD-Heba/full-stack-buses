// auth.interfaces.ts
export interface JwtPayload {
  sub: string;
  identifier: string; // Puede ser email o phone
  identifierType: 'email' | 'phone';
  role: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}