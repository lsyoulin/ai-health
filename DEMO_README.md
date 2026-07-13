# 知食 Demo 分支

> 本分支用于 TRAE AI 创造力大赛 Demo 提交，冻结当前可用版本，不再迭代新功能。
> 真实产品的设计与开发在 `main` 分支进行。

---

## 一、Demo 访问方式

### 在线 Demo
- **地址**：https://ai-health-chi-nine.vercel.app/
- **状态**：自动从 main 分支构建部署
- **响应**：桌面端 / 移动端自适应

### 本地运行
```bash
git checkout demo
npm install
npm run dev   # 开发模式 http://localhost:5173
npm run build # 生产构建产物 dist/
```

### 演示视频
- 待录制（可选）

---

## 二、Demo 包含的 4 大核心亮点

| # | 亮点 | 路径 | 关键文件 |
|---|------|------|---------|
| 1 | 餐后血糖预测环 | `/` | [PredictionRing.tsx](src/components/PredictionRing.tsx) |
| 2 | 慢病 Persona 切换器 | `/persona` | [Persona.tsx](src/pages/Persona.tsx) |
| 3 | 饮食决策推演 | `/simulate` | [Simulate.tsx](src/pages/Simulate.tsx) |
| 4 | 为父母分析模式 | `/parent` | [Parent.tsx](src/pages/Parent.tsx) |

### 评委 1 分钟体验路径
1. 打开首页 → 看品牌主张「知食 · 「吃」掉慢病，让每一口都被懂」+ 实时演示菜品卡（预测环动效）
2. 点击「演示场景」→ 选择菜品 → 预测环炸出 → AI 建议
3. 切换慢病 Persona → 同一道菜看 3 种 AI 建议
4. 点击「为父母分析」→ 输入父母情况 → 看 AI 关怀建议

---

## 三、Demo 素材清单

### 1. 报名阶段
- **报名帖正文**：[报名帖-知食.md](报名帖-知食.md)
- **创意产物 HTML 附件**：[知食-创意提案.html](知食-创意提案.html)

### 2. 初赛阶段
- **初赛 Demo 帖**：[初赛Demo帖-知食.md](初赛Demo帖-知食.md)
- **在线 Demo 地址**：https://ai-health-chi-nine.vercel.app/
- **GitHub 仓库**：https://github.com/lsyoulin/ai-health

### 3. 项目文档
- **项目上下文**：[慢病饮食AI伙伴-项目上下文.md](慢病饮食AI伙伴-项目上下文.md)
- **产品 PRD**：[.trae/documents/PRD.md](.trae/documents/PRD.md)
- **技术架构**：[.trae/documents/TechnicalArchitecture.md](.trae/documents/TechnicalArchitecture.md)
- **产品商业方案**：[知食-产品商业方案.md](知食-产品商业方案.md)
- **慢病认知引擎设计方案**：[知食-慢病认知引擎设计方案.md](知食-慢病认知引擎设计方案.md)

### 4. 截图待补充（初赛阶段需要 ≥3 张）
| # | 截图内容 | 截取位置 |
|---|---------|---------|
| 1 | TRAE 对话界面 + 首页代码生成 | TRAE IDE |
| 2 | 运行中的预测环动效 | 浏览器 / Vercel 在线地址 |
| 3 | Persona 切换器对比效果 | 浏览器 / Vercel |
| 4 | 为父母分析模式 | 浏览器 / Vercel |
| 5 | 决策推演滑块 | 浏览器 / Vercel |

### 5. Session ID 待补充（初赛阶段需要 ≥3 个）
> 报名阶段不需要，留待初赛阶段补充

---

## 四、技术栈

- **框架**：React 18 + TypeScript + Vite 5
- **样式**：Tailwind CSS 3
- **状态**：Zustand
- **路由**：React Router 6
- **部署**：Vercel（自动从 main 分支构建）

---

## 五、Demo 分支冻结说明

- **当前版本**：v0.2.0
- **冻结时间**：2026-07-14
- **冻结原因**：保留大赛提交版本，避免后续真实产品迭代影响 demo 一致性
- **真实产品迭代**：在 `main` 分支进行，不回传到 demo 分支
- **如需复现 demo**：`git checkout demo && git checkout v0.2.0`

---

## 六、大赛时间节点

- **报名截止**：2026-07-15 23:59
- **初赛提交**：报名通过后（具体时间见大赛官方通知）
- **审核时间**：一般次日审核通过
- **审核查询**：https://www.trae.cn/ai-creativity/result

---

> **知食 · 「吃」掉慢病，让每一口都被懂**
>
> 4.7 亿慢病人群，每个家庭都有人需要。这是 AI 能做、且必须做的事。
