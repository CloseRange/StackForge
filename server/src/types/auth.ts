export type JwtUser = {
  userId: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  statusMessage?: string;
  userCode?: string;
};

export type AuthenticatedUser = JwtUser;
