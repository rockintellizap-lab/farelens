import { useSyncExternalStore } from "react";

/** Demo-only sign-in: nothing leaves the browser, any phone/OTP is accepted. */
export interface DemoUser {
  name: string;
  phone: string;
  email: string;
}

const KEY = "farelens-demo-user";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedUser: DemoUser | null = null;

function read(): DemoUser | null {
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  try {
    cachedUser = raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useDemoUser(): DemoUser | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function isSignedIn(): boolean {
  return typeof window !== "undefined" && read() !== null;
}

export function signIn(user: DemoUser) {
  window.localStorage.setItem(KEY, JSON.stringify(user));
  listeners.forEach((l) => l());
}

export function signOut() {
  window.localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

/** Only allow same-site paths as a post-login destination. */
export function safeRedirect(target: string | undefined): string {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return "/";
  return target;
}

export function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.length >= 4 ? `+91 ••••• ${d.slice(-4)}` : phone;
}
