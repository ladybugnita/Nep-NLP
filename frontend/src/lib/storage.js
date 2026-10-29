export function load(key, fallback = '') {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}
export function save(key, value) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch { }
}
