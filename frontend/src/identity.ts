const STORAGE_KEY = "recall.userEmail";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function getStoredEmail(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredEmail(email: string): void {
  localStorage.setItem(STORAGE_KEY, email.trim().toLowerCase());
}

export function clearStoredEmail(): void {
  localStorage.removeItem(STORAGE_KEY);
}
