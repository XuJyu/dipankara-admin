/** 轻量全局消息提示（Notion 风格：白卡、小圆点、shadow-pop、150ms 渐隐） */
import '@/style.css'

type MessageType = 'success' | 'error' | 'info'

interface MessageItem {
  el: HTMLElement
  timer: number
}

let container: HTMLElement | null = null
const items: MessageItem[] = []

function ensureContainer(): HTMLElement {
  if (!container) {
    container = document.createElement('div')
    container.style.cssText =
      'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;'
    document.body.appendChild(container)
  }
  return container
}

const DOT_COLOR: Record<MessageType, string> = {
  success: '#0f7b6c',
  error: '#eb5757',
  info: '#2eaadc',
}

function show(type: MessageType, text: string): void {
  const box = ensureContainer()
  const el = document.createElement('div')
  el.style.cssText = [
    'display:flex;align-items:center;gap:8px',
    'background:#ffffff;color:#37352f',
    'padding:8px 14px;border-radius:6px;font-size:14px',
    'box-shadow:0 4px 12px rgba(0,0,0,.12),0 0 0 1px rgba(55,53,47,.06)',
    'opacity:0;transition:opacity 150ms ease',
  ].join(';')
  const dot = document.createElement('span')
  dot.style.cssText = `width:7px;height:7px;border-radius:9999px;background:${DOT_COLOR[type]};flex:none;`
  const span = document.createElement('span')
  span.textContent = text
  el.appendChild(dot)
  el.appendChild(span)
  box.appendChild(el)
  const item: MessageItem = { el, timer: 0 }
  items.push(item)
  requestAnimationFrame(() => (el.style.opacity = '1'))
  item.timer = window.setTimeout(() => {
    el.style.opacity = '0'
    window.setTimeout(() => {
      el.remove()
      const i = items.indexOf(item)
      if (i >= 0) items.splice(i, 1)
    }, 160)
  }, 2600)
}

export const message = {
  success: (text: string) => show('success', text),
  error: (text: string) => show('error', text),
  info: (text: string) => show('info', text),
}
