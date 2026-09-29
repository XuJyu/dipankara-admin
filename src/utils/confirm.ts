/** 命令式确认框（Notion 风格），返回 Promise<boolean> */
import '@/style.css'

export interface ConfirmOptions {
  title?: string
  text: string
  confirmText?: string
  danger?: boolean
}

export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:60;background:rgba(15,15,15,.55);display:flex;align-items:flex-start;justify-content:center;padding-top:22vh;transition:opacity 150ms ease;opacity:0'

    const card = document.createElement('div')
    card.style.cssText =
      'background:#fff;border-radius:8px;width:min(400px,92vw);box-shadow:0 4px 12px rgba(0,0,0,.12),0 0 0 1px rgba(55,53,47,.06);overflow:hidden'

    const head = document.createElement('div')
    head.style.cssText = 'padding:14px 18px 0;font-size:15px;font-weight:600;color:#37352f'
    head.textContent = opts.title ?? '请确认'

    const body = document.createElement('div')
    body.style.cssText = 'padding:6px 18px 4px;font-size:14px;color:rgba(55,53,47,.8);line-height:1.6'
    body.textContent = opts.text

    const foot = document.createElement('div')
    foot.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;padding:14px 18px'

    function btn(label: string, primary: boolean, onClick: () => void): HTMLButtonElement {
      const b = document.createElement('button')
      b.textContent = label
      b.style.cssText = primary
        ? 'padding:6px 12px;border-radius:6px;font-size:14px;font-weight:500;border:none;cursor:pointer;color:#fff'
        : 'padding:6px 12px;border-radius:6px;font-size:14px;font-weight:500;border:none;cursor:pointer;background:transparent;color:#37352f'
      if (primary) b.style.background = opts.danger ? '#eb5757' : '#2eaadc'
      b.onmouseenter = () => { if (!primary) b.style.background = '#efedea' }
      b.onmouseleave = () => { if (!primary) b.style.background = 'transparent' }
      b.onclick = onClick
      return b
    }

    function done(result: boolean): void {
      overlay.style.opacity = '0'
      window.setTimeout(() => overlay.remove(), 160)
      resolve(result)
    }

    foot.appendChild(btn('取消', false, () => done(false)))
    foot.appendChild(btn(opts.confirmText ?? '确定', true, () => done(true)))

    card.appendChild(head)
    card.appendChild(body)
    card.appendChild(foot)
    overlay.appendChild(card)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) done(false) })
    document.body.appendChild(overlay)
    requestAnimationFrame(() => (overlay.style.opacity = '1'))
  })
}
