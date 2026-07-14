// 构建后处理：让单文件 HTML 在 file:// 下可用
// 解决两个问题：
// 1. <script type="module"> 在 file:// 下被 CORS 阻止 → 移除 type 属性，移到 body 末尾
// 2. /favicon.svg 绝对路径在 file:// 下找不到 → 删除 favicon 引用
import { readFileSync, writeFileSync } from 'fs'

let html = readFileSync('dist/index.html', 'utf8')

// === 问题 2：删除 favicon 绝对路径引用 ===
html = html.replace(/<link rel="icon"[^>]*>\s*/g, '')

// === 问题 1：处理 module script ===
// 用 indexOf 精确定位，避免正则和字符串替换的副作用
const scriptOpenTag = '<script type="module" crossorigin>'
const scriptCloseTag = '</script>'

const scriptStart = html.indexOf(scriptOpenTag)
if (scriptStart === -1) {
  console.log('ℹ 未找到 type=module 的 script，跳过')
  writeFileSync('dist/index.html', html)
  process.exit(0)
}

const scriptContentStart = scriptStart + scriptOpenTag.length
const scriptEnd = html.indexOf(scriptCloseTag, scriptContentStart)
if (scriptEnd === -1) {
  console.log('✗ 找不到 script 结束标签')
  process.exit(1)
}

const jsCode = html.substring(scriptContentStart, scriptEnd)

// 验证：JS 代码中不应包含 </script> 或 </body>（否则会被浏览器误解析）
if (jsCode.includes('</script>') || jsCode.includes('</body>')) {
  console.log('✗ JS 代码中包含 </script> 或 </body>，无法安全内联')
  process.exit(1)
}

// 从 head 移除原 script 块（包括前面的空白行）
const beforeScript = html.substring(0, scriptStart)
const afterScript = html.substring(scriptEnd + scriptCloseTag.length)
html = beforeScript + afterScript

// 在最后一个 </body> 前插入新的 script（不带 type 属性）
const bodyCloseIdx = html.lastIndexOf('</body>')
if (bodyCloseIdx === -1) {
  console.log('✗ 找不到 </body> 标签')
  process.exit(1)
}

const newScriptTag = '<script>' + jsCode + '</script>\n  '
html = html.substring(0, bodyCloseIdx) + newScriptTag + html.substring(bodyCloseIdx)

writeFileSync('dist/index.html', html)
console.log('✓ script 已移到 body 末尾，type=module 已移除')
console.log('✓ favicon 引用已删除')

// === 最终验证 ===
const finalHtml = readFileSync('dist/index.html', 'utf8')
const hasModule = finalHtml.includes('type="module"')
const hasFaviconAbs = finalHtml.includes('href="/favicon.svg"')
const scriptCount = (finalHtml.match(/<script[^>]*>/g) || []).length
const lastScriptIdx = finalHtml.lastIndexOf('<script>')
const bodyIdx = finalHtml.lastIndexOf('</body>')
const scriptBeforeBody = lastScriptIdx < bodyIdx && lastScriptIdx !== -1

console.log(`\n--- 验证结果 ---`)
console.log(`type="module" 存在: ${hasModule} (应为 false)`)
console.log(`/favicon.svg 绝对路径存在: ${hasFaviconAbs} (应为 false)`)
console.log(`script 标签数: ${scriptCount}`)
console.log(`最后一个 <script> 在 </body> 之前: ${scriptBeforeBody} (应为 true)`)
console.log(`最终文件大小: ${(finalHtml.length / 1024).toFixed(1)} KB`)

if (!hasModule && !hasFaviconAbs && scriptBeforeBody) {
  console.log('\n✓ 所有验证通过')
} else {
  console.log('\n✗ 验证失败')
  process.exit(1)
}
