type AuthUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
} | null;

let cachedUser: AuthUser = null;

export function getCachedUser(): AuthUser {
  return cachedUser;
}

export function setCachedUser(user: AuthUser): void {
  cachedUser = user;
}
