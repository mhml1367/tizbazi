// استخراج مرز استان‌ها (مسیرهای SVG) از بستهٔ react-iran-map (MIT، © Sima Mojtahedi) به prisma/data/iran-map.json
// کد بسته اجرا نمی‌شود؛ فقط متن فایل خوانده و مسیرها با regex بیرون کشیده می‌شوند.
// اجرا: npm pack react-iran-map && tar -xzf react-iran-map-*.tgz
//       node scripts/build-iran-map.mjs package/dist/esm/components/mapSvg/IranMapWrapper.js
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const src = readFileSync(process.argv[2], 'utf8')
const unescape = (s) => s.replace(/\\+u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
// هر استان یک <path d> یا <polygon points> با data-name است؛ polygon به مسیر تبدیل می‌شود
const shapes = src
  .split('React.createElement(')
  .map((el) => {
    const name = el.match(/"data-name": '([^']+)'/)?.[1]
    const d =
      el.match(/\bd: '([^']+)'/)?.[1] ??
      el
        .match(/\bpoints: '([^']+)'/)?.[1]
        ?.trim()
        .replace(/^/, 'M')
        .concat('Z')
    return name && d
      ? {
          name: unescape(name),
          d: d
            .replace(/\\+[rnt]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        }
      : null
  })
  .filter(Boolean)

const file = join(import.meta.dirname, '..', 'prisma', 'data', 'iran-map.json')
const map = JSON.parse(readFileSync(file, 'utf8'))
const names = new Set(map.provinces.map((p) => p.name))
const missing = [...names].filter((n) => !shapes.some((s) => s.name === n))
const extra = shapes.filter((s) => !names.has(s.name)).map((s) => s.name)
if (missing.length || extra.length) throw new Error(`نام‌ها نمی‌خوانند — بی‌شکل: ${missing.join('، ')} · ناشناخته: ${extra.join('، ')}`)

// کادر مرزها (getBBox در مرورگر: 13,92,1004×898) با ۸ واحد حاشیه؛ viewBox اصلی 1080×1080 حاشیهٔ خالی زیادی دارد
map.viewBox = '5 84 1020 914'
map.shapes = shapes
map.note = 'مختصات مراکز استان‌ها تقریبی است؛ مرز استان‌ها از بستهٔ react-iran-map (MIT، © 2023 Sima Mojtahedi)'
delete map.outline
writeFileSync(file, JSON.stringify(map) + '\n')
console.log(`${shapes.length} استان`)
