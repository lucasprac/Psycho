import Cookies from "js-cookie"

type StorageAdapter = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export const cookieStorage: StorageAdapter = {
  getItem: (key: string) => Cookies.get(key) ?? null,
  setItem: (key: string, value: string) => Cookies.set(key, value, { sameSite: "lax", secure: true, path: "/" }),
  removeItem: (key: string) => Cookies.remove(key),
} 