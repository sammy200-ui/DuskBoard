export type UserProfile = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
};

export type UpdateProfileInput = {
  name?: string;
  email?: string;
};