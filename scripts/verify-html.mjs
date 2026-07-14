// 深度验证：检查最终 HTML 的完整性
import { readFileSync } from 'fs'

const html = readFileSync('dist/index.html', 'utf8')

// 1. 检查所有 script 标签内容是否包含 </body> 或 </script> 字面量
const scriptRegex = /<script>([\s\S]*?)<\/script>/g
let match
let idx = 0
while ((match = scriptRegex.exec(html)) !== null) {
  idx++
  const content = match[1]
  const hasBodyClose = content.includes('</body>')
  const hasScriptClose = content.includes('</script>')
  console.log(`Script ${idx}: 长度=${content.length}, 含</body>=${hasBodyClose}, 含</script>=${hasScriptClose}`)
  if (hasBodyClose || hasScriptClose) {
    console.log('✗ Script 内容包含非法字符串!')
    // 找到位置
    const pos = content.indexOf('</body>')
    if (pos !== -1) {
      console.log(`  </body> 位置 ${pos}: ...${content.substring(Math.max(0, pos - 40), pos + 40)}...`)
    }
    process.exit(1)
  }
}

// 2. 检查 HTML 结构完整性
const hasDoctype = html.startsWith('<!doctype html>')
const hasHtmlOpen = html.includes('<html')
const hasHtmlClose = html.includes('</html>')
const hasHeadOpen = html.includes('<head>')
const hasHeadClose = html.includes('</head>')
const hasBodyOpen = html.includes('<body>')
const hasBodyClose = html.includes('</body>')
const hasRoot = html.includes('id="root"')

console.log(`\n--- HTML 结构验证 ---`)
console.log(`<!doctype>: ${hasDoctype}`)
console.log(`<html>/<\/html>: ${hasHtmlOpen}/${hasHtmlClose}`)
console.log(`<head>/<\/head>: ${hasHeadOpen}/${hasHeadClose}`)
console.log(`<body>/<\/body>: ${hasBodyOpen}/${hasBodyClose}`)
console.log(`id="root": ${hasRoot}`)

// 3. 检查 head 中不应有 script
const headContent = html.substring(html.indexOf('<head>'), html.indexOf('</head>'))
const headHasScript = headContent.includes('<script')
console.log(`\nhead 中有 script: ${headHasScript} (应为 false)`)

// 4. 检查 body 末尾的 script
const bodyContent = html.substring(html.indexOf('<body>'))
const lastScriptInBody = bodyContent.lastIndexOf('<script>')
console.log(`body 中最后一个 script 位置: ${lastScriptInBody}`)
console.log(`body 内容长度: ${bodyContent.length}`)

// 5. 模拟浏览器：检查 createElement('root') 调用
const hasCreateRoot = html.includes("getElementById(") && html.includes('"root"')
console.log(`\n包含 getElementById root: ${hasCreateRoot}`)

console.log(`\n✓ 深度验证完成`)
