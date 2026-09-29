/** token 持久化：key 与 RuoYi-Vue3 一致（Admin-Token），后端 Sa-Token 契约 Bearer 头 */
const TOKEN_KEY = 'Admin-Token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
