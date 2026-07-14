// 检查原始构建产物
import { readFileSync } from 'fs'

const html = readFileSync('dist/index.html', 'utf8')
const lines = html.split('\n')
console.log(`总行数: ${lines.length}`)

// 找到 type="module" script 块
const scriptRegex = /<script type="module" crossorigin>([\s\S]*?)<\/script>/
const match = html.match(scriptRegex)
if (match) {
  const jsCode = match[1]
  console.log(`JS 代码长度: ${jsCode.length}`)
  // 检查 JS 代码中是否包含 </body> 字面量
  const bodyMatches = jsCode.match(/<\/body>/g)
  console.log(`JS 代码中 </body> 出现次数: ${bodyMatches ? bodyMatches.length : 0}`)
  // 检查 JS 代码中是否包含 </script> 字面量
  const scriptMatches = jsCode.match(/<\/script>/g)
  console.log(`JS 代码中 </script> 出现次数: ${scriptMatches ? scriptMatches.length : 0}`)
  // 找到所有 </body> 位置
  let idx = 0
  while ((idx = jsCode.indexOf('</body>', idx)) !== -1) {
    console.log(`  </body> 位置 ${idx}: ...${jsCode.substring(Math.max(0, idx - 30), idx + 40)}...`)
    idx += 7
  }
} else {
  console.log('未找到 type="module" script 块')
}
