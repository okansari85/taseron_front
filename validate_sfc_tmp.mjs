import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import fs from 'fs'
const files = process.argv.slice(2)
let ok = true
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')
  try {
    const { descriptor, errors } = parse(src, { filename: f })
    if (errors.length) throw new Error(errors.map(e=>e.message).join('; '))
    if (descriptor.script || descriptor.scriptSetup) {
      compileScript(descriptor, { id: f })
    }
    if (descriptor.template) {
      const r = compileTemplate({ source: descriptor.template.content, filename: f, id: f })
      if (r.errors.length) throw new Error(r.errors.map(e=>e.message || e).join('; '))
    }
    console.log('OK   ' + f)
  } catch (e) {
    ok = false
    console.log('FAIL ' + f + ' -> ' + e.message)
  }
}
process.exit(ok ? 0 : 1)
