export interface BunRequest extends Request {
  params?: Record<string, string>;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name: string;
}

export interface AuthedRequest extends BunRequest {
  user: AuthUser;
}
