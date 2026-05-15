# Synthesis (compose-mp intermediate)

> compose-mp 在出 draft 之前的"想清楚"阶段. 把 transcript + enterprise + slack + 历史语料拼成结构化骨架.

## 1. Angle / 标题方向

由 transcript 决定:
- 不写 "我们如何省 60% 成本" (自夸感太重, 不公众号)
- 写 "我以前以为 prompt cache 没用, 后来发现是我没读完文档" (反常识 + 自我踩坑)

由 enterprise (Hit 4) 加权:
- 上一篇高表现稿《我们花了三个月才看懂 token 计费》= 反常识 + 数据钩子 + 风险提示 三段式
- 沿用此口吻可降低读者口味切换成本

**最终标题候选**:
1. 我们以为 prompt cache 没用, 一年后省了 60%
2. 读了三遍文档, 才看懂 prompt cache 是按 prefix 算的
3. 一个 prompt 改顺序的小改动, 月账单降了 60%

→ 取 1, 因为最反常识.

## 2. 数据锚 (第一段必须出现)

由 transcript + slack #eng-llm 交叉确认:

| 指标          | before  | after  | delta   | 来源                    |
|---------------|---------|--------|---------|------------------------|
| 单请求成本    | 100%    | 40%    | -60%    | grafana llm-cost-v2     |
| P50 latency   | 1820 ms | 745 ms | -59%    | #eng-llm 04-29 截图     |
| P95 latency   | 4200 ms | 1610 ms| -62%    | 同上                    |
| Hit rate 稳态 | 0%      | 71-74% | -       | Confluence 集成手册     |
| 月账单        | 100%    | 40.6%  | -59.4%  | Tina FinOps 05-13      |

数据全部双源交叉, 无 cherry-pick.

## 3. 三段结构 (公众号腔调规则)

由 wechat-mp-style.md (104 行 voice rules) 决定:

- **引言**: 反常识陈述 + 数据钩子 (≤ 200 字, 含 1 个数字)
- **§1 我以前为什么不上 cache**: 自我踩坑 (≤ 600 字)
- **§2 文档里那个被我忽略的细节**: prefix 计价机制 (≤ 700 字)
- **§3 重写 prompt 之后发生了什么**: 数据 + 三张表格 (≤ 600 字)
- **§4 你能复刻多少, 取决于三个前提**: 风险提示 (≤ 400 字, transcript 03:29 段)
- **§5 我们试过但没上的另外两条路**: KV cache + Redis full-response (≤ 400 字, transcript 04:02 段)
- **结语**: 一句话回到反常识 (≤ 150 字)

目标总字数: 2500 中文字 (默认 band 2000-3500).

## 4. 配图位 (image_prompts)

- 引言图: 一张"账单下降"概念图 (避免具体 logo)
- §2 图: prompt 结构 before/after 对比示意 (代码片段截图风格)
- §3 图: grafana latency 曲线 (脱敏)
- §5 图: 三条路线对比表

## 5. 合规检查清单 (来自 enterprise Hit 3)

- [x] 客户名脱敏 → 用 "我们的一个企业客户" / 不出现
- [x] 内部架构敏感词 → 已用通用名 (no infra leak)
- [x] 数据披露范围 → 60% / 740 ms / 70% hit rate 三项均已在内部手册可披露列表

## 6. Skip list (transcript 主动删掉的)

- 不写"飞书 MCP 集成" — 不在本篇主题
- 不写"公众号 publishing API" — 不在本篇主题
- 不写竞品对比 — 法务建议不点名
