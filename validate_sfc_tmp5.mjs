import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc';
import { readFileSync } from 'fs';
const files = process.argv.slice(2);
for (const f of files) {
  const source = readFileSync(f, 'utf-8');
  const { descriptor, errors } = parse(source, { filename: f });
  if (errors.length) { console.log(f, 'PARSE ERRORS', errors); process.exitCode = 1; continue; }
  try {
    compileScript(descriptor, { id: f });
    if (descriptor.template) compileTemplate({ source: descriptor.template.content, filename: f, id: f });
    console.log(f, 'OK');
  } catch (e) {
    console.log(f, 'COMPILE ERROR', e.message);
    process.exitCode = 1;
  }
}
