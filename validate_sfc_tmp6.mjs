import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { readFileSync } from 'fs'

const files = process.argv.slice(2)
let hasError = false
for (const file of files) {
  try {
    const source = readFileSync(file, 'utf-8')
    const { descriptor, errors } = parse(source, { filename: file })
    if (errors.length) {
      console.log(`[PARSE ERROR] ${file}`)
      for (const e of errors) console.log('  ' + e.message)
      hasError = true
      continue
    }
    if (descriptor.script || descriptor.scriptSetup) {
      compileScript(descriptor, { id: file })
    }
    if (descriptor.template) {
      const result = compileTemplate({
        source: descriptor.template.content,
        filename: file,
        id: file,
      })
      if (result.errors.length) {
        console.log(`[TEMPLATE ERROR] ${file}`)
        for (const e of result.errors) console.log('  ' + e)
        hasError = true
        continue
      }
    }
    console.log(`[OK] ${file}`)
  } catch (e) {
    console.log(`[COMPILE ERROR] ${file}`)
    console.log('  ' + e.message)
    hasError = true
  }
}
process.exit(hasError ? 1 : 0)
