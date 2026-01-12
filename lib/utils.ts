import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSelfSoUrl(username: string) {
  const domain =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://self.so';
  return `${domain}/${username}`;
}

export const TOGETHER_LINK = 'https://togetherai.link/?utm_source=selfso&utm_medium=referral&utm_campaign=example-app';
