export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RefreshTokenInput = {
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
};

export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
};

export type AuthResponse = {
  user: AuthUser;
  tokens: TokenSet;
};