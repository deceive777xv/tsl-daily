# Pretty Hip — 许可证与来源档案

- 原作：**Pretty Hip — Hadyn**，<https://www.shadertoy.com/view/XsBfRW>。
- 许可：**CC BY-NC-SA 3.0 Unported**，基于旧镜像中无自定义许可证时的平台默认规则；并非源码显式写出的许可。
- 许可条款：<https://creativecommons.org/licenses/by-nc-sa/3.0/>。
- 固定镜像：<https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/XsBfRW.json>。
- 文件提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，2025-05-29T06:43:53Z；README 记载最初下载于 2024-10-05。两日期含义不同。
- 本次取回：2026-09-14。历史 227 likes / 71985 views，指标精确采样时间未知，不能称为当前热度。
- `mirror.json` SHA256：`04355B14DCA49D040440F55AF8292E78F686FC0288AA41B49B7D718B58668A79`。

## 审批与审查

2026-09-14，用户明确批准：“可以，把两个版本结合一下，保留 Pretty Hip／Hadyn 的原作署名”。这涵盖 Pretty Hip（XsBfRW）的旧镜像证据和用户提供的修改版；一个独立案例 PR，合并仍是最终发布审批，绝不自动合并。

已阅读全文：唯一 Image pass、零输入；未见自定义许可、禁止托管或改编的声明、外部资源或上游署名引用。当前 Shadertoy 获取返回 HTTP 402；未复核当前页面，不能声称观察到 Cloudflare 403，也不能把镜像说成当前源码。

## 文件与署名

- `mirror.json`：历史 JSON 字节原样保留，Git 禁止换行转换。
- `original.glsl`：从 JSON 的 `code` 字段解码得到的完整源码，未修整空白。
- `user-variant.glsl`：用户提供的完整代码，仅去除聊天 Markdown 转义，保留原始数值表达式（包括未定义负数幂）。它是来源档案，不是运行时使用的最终版本。
- 用户表示“自己修改过的，不过灵感来自其他地方，忘记了”。记录为站点所有者提供的修改；不将未知灵感当成具体第三方代码，也不虚构其作者。用户授权将其与原作合并，本例改编代码按原作 ShareAlike 要求以 CC BY-NC-SA 3.0 分发。
- 最终 `src/shaders/cases/pretty-hip.ts` 保留 Hadyn 原作署名；新增 TSL 改写、双路径融合、参数、背景网格抗锯齿、固定初始相位、RGB 颜色转换和完全不透明输出。
- `pow(sin(phase), 0.4)` 改为 `pow(max(sin(phase), 0), 0.4)`，排除负底数未定义行为；不改成会多出一次脉冲的绝对值。

## 分发边界

站点永久非商业；案例 GLSL/TSL 改编及预览按 CC BY-NC-SA 3.0 保留署名、非商业和相同方式共享要求。中文原创赏析按站点 CC BY-NC-SA 4.0；框架 MIT 不覆盖来源 Shader。此案例未引用 Flame 或其噪声函数，也不需要任何图片纹理或音频。

用户随后指出大图方环边缘模糊，批准继续修复。最终版保留两条零交叉轮廓位置，以 fwidth 控制像素级过渡，替代修改版随格子放大的软边。原始文件不变；这一差异仅在最终 TSL 中体现。
