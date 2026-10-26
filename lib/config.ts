export const MAX_USERNAME_LENGTH = 40;

export const isValidUsername = (username: string) =>
  /^[a-zA-Z0-9-]{1,50}$/.test(username);
