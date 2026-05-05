export type JwtUser = {
  userId: string;
  email: string;
  displayName?: string;
};

export type AuthenticatedUser = JwtUser;
