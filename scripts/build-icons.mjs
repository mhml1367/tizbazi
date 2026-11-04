// ساخت آیکون‌های PNG (PWA / اندروید) از همان طرح favicon.svg؛ بدون وابستگی تصویری
// اجرا: npm run build:icons  → public/icons/*.png
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const out = join(import.meta.dirname, '..', 'public', 'icons')
mkdirSync(out, { recursive: true })

// طرح در مختصات ۶۴×۶۴ (مثل favicon.svg)
const BOLT = [
  [36, 8],
  [16, 36],
  [29, 36],
  [25, 56],
  [48, 26],
  [34, 26]
]
const DOT = { x: 50, y: 14, r: 4 }
const A = [0x1f, 0xd6, 0xa0]
const B = [0x0a, 0x7f, 0x66]

function inPoly(x, y, poly) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

function inRound(x, y, size, rx) {
  const cx = Math.min(Math.max(x, rx), size - rx)
  const cy = Math.min(Math.max(y, rx), size - rx)
  return (x - cx) ** 2 + (y - cy) ** 2 <= rx * rx
}

/** @param maskable پس‌زمینهٔ تمام‌صفحه و نقش کوچک‌تر (ناحیهٔ امن ۸۰٪) */
function render(size, maskable) {
  const SS = 4
  const scale = maskable ? 0.62 : 1
  const off = (64 - 64 * scale) / 2
  const px = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = ((x + (sx + 0.5) / SS) / size) * 64
          const uy = ((y + (sy + 0.5) / SS) / size) * 64
          if (!maskable && !inRound(ux, uy, 64, 16)) continue
          const t = (ux + uy) / 128
          let c = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]
          const bx = (ux - off) / scale
          const by = (uy - off) / scale
          if ((bx - DOT.x) ** 2 + (by - DOT.y) ** 2 <= DOT.r ** 2) c = [0xff, 0xd8, 0x4a]
          else if (inPoly(bx, by, BOLT)) c = [255, 255, 255]
          r += c[0]
          g += c[1]
          b += c[2]
          a += 255
        }
      }
      const n = SS * SS
      const i = (y * size + x) * 4
      const cnt = a / 255 || 1
      px[i] = Math.round(r / cnt)
      px[i + 1] = Math.round(g / cnt)
      px[i + 2] = Math.round(b / cnt)
      px[i + 3] = Math.round(a / n)
    }
  }
  return px
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const v of buf) c = CRC[(c ^ v) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function png(size, px) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const files = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, true]
]
for (const [name, size, maskable] of files) {
  writeFileSync(join(out, name), png(size, render(size, maskable)))
  console.log('✓', name)
}
