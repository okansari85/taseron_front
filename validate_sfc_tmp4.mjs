import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { readFileSync } from 'fs'

const files = process.argv.slice(2)
let hasError = false
for (const file of files) {
  try {
    const source = readFileSync(file, 'utf-8')
    const { descriptor, errors } = parse(source, { filename: file })
    if (errors.length) throw errors[0]
    if (descriptor.script || descriptor.scriptSetup) {
      compileScript(descriptor, { id: file })
    }
    if (descriptor.template) {
      const result = compileTemplate({ source: descriptor.template.content, filename: file, id: file })
      if (result.errors.length) throw result.errors[0]
    }
    console.log(`OK   ${file}`)
  } catch (e) {
    hasError = true
    console.log(`FAIL ${file}: ${e.message}`)
  }
}
process.exit(hasError ? 1 : 0)
