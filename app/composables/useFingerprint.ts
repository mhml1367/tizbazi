/** ترکیب ویژگی‌های دستگاه + UUID ذخیره‌شده؛ سرور آن را SHA-256 می‌کند */
export async function computeFingerprint(): Promise<string> {
  let uuid = ''
  try {
    uuid = localStorage.getItem('tiz_device') || crypto.randomUUID()
    localStorage.setItem('tiz_device', uuid)
  } catch {
    /* حالت خصوصی مرورگر */
  }

  let canvasSig = ''
  let gl = ''
  try {
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d')
    if (ctx) {
      ctx.font = '14px Arial'
      ctx.fillText('تیزبازی-fp', 2, 14)
      canvasSig = c.toDataURL().slice(-64)
    }
    const g = document.createElement('canvas').getContext('webgl')
    const ext = g?.getExtension('WEBGL_debug_renderer_info')
    gl = ext && g ? String(g.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
  } catch {
    /* نادیده */
  }

  const parts = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    canvasSig,
    gl,
    uuid
  ]
  return parts.join('|')
}
