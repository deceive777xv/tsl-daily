# Flux Core — 许可证与来源证据

- 原作：**Flux Core — otaviogood（ltlSWf）**，作者署名 Otavio Good，[原作链接](https://www.shadertoy.com/view/ltlSWf)。
- 固定镜像：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/ltlSWf.json)。
- 镜像提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，**2025-05-29T06:43:53Z**，按文件路径查询提交历史确认。README 声明初次下载于 **2024-10-05**；JSON 内部 ID、标题、作者已逐项核对。
- 取回、全通道审阅、推荐、明确批准：**2026-10-12**。
- 历史热度：**271 likes / 37507 views**，精确采样日期未知；不代表当前数值，镜像提交日也不能当作热度采样日。
- `mirror.json`：**25501 bytes**，SHA-256 **38DC42FCE250AECDD0CC114D1B08DA36694F4D26BCE5851EE3401815D8960591**。
- `original.glsl`：完整 Image pass 解码字符串，**674 行 / 23631 UTF-8 bytes**，SHA-256 **82DA36878A0C00AEEA34B0FC67A073CEA05E854835485C85D8B15D2D53A6EC59**。保留全部预处理分支、注释与原始空白。
- 当前 Shadertoy 页面请求返回 **HTTP 402**，当前源码、许可与热度未核验；未绕过访问控制。

## 全通道与二级来源审阅

完整 JSON 仅一个 Image / image render pass，674 行，`inputs=[]`；没有 Common、Buffer、Sound 或外部模型、音频、贴图。已读取顶部、全部函数、默认关闭的手动相机与离线高清分支及文件结尾。

源码第 2 行明确为 **License CC0**，链接指向 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)，第 3 行含版权及相关权利的全球放弃文本，第 6 行有 **Otavio Good** 签名。全通道未发现禁止托管、展示、分发、改编的附加限制。

源码保留 Inigo Quilez 的 [距离函数文章](https://iquilezles.org/articles/distfunctions) 链接，说明其用途是了解更多距离函数。它是概念参考，没有指向某个 Shadertoy 作品、具体第三方复制段落或素材。此文章当前请求为 HTTP 403，未取用或复制当前页面代码；不推断其他 iq 作品的许可。

原作与本 TSL 改编遵循 **CC0 1.0（基于旧镜像中的显式声明）**，显式声明优先于平台默认 CC BY-NC-SA 3.0。保留原作完整权利声明、作者、标题与链接。CC0 判断适用于这份已审核固定快照，不声称验证了当前作者许可；原作者没有为本站背书。

本站框架 MIT，原创中文赏析与生成媒体 CC BY-NC-SA 4.0，站点永久非商业。独立内容条款不会撤销来源代码的 CC0 权利放弃。

## 候选批准记录

2026-10-12 先推荐完全相同的 **Flux Core — otaviogood（ltlSWf）**，披露技术、历史热度与未知采样日期、下载/镜像/取回日期、CC0 显式判断、当前访问限制和现有案例差异，并审阅原始 GLSL 的真实浏览器画面。用户对该候选随后明确回复 **“批准”**。

该批准只授权本案例一个独立 PR。分支 `codex/flux-core` 从当时最新 main **4399aad15b8ff7f4fe53d7699ea16e8e5635b758** 创建。合并是用户的最终发布审批，不自动合并。

## 改编说明

- 保留默认实时单 Image 的 70 秒相机/结构时间线、对数极坐标镜像、三层三轴圆柱切割、支撑杆、摆动环带、蓝光束、法线/遮蔽/阴影和程序锈纹。
- 默认从第 20 秒开始，原始孔洞半径 0.32，其他教学倍率 1。提供速度、空间变形、孔洞半径、辉光亮度、锈纹频率五个控制；未启用默认关闭的手动相机或离线高清分支，原码仍完整保留。
- 距离函数的全局副作用改为显式 `vec4` 返回值；保留橙色累积含法线/遮蔽/阴影查询、其他两色仅主射线累积的原始计算顺序。
- 半径增加 `1e-6` 下限以保护 `log` 与除法；逆序 `smoothstep` 显式展开三次曲线，避免依赖后端未定义边界行为。
- 原作平方根显示曲线经 sRGB 解码交由共享输出；没有新增后期 bloom、外部资产或多通道依赖。
- 海报与无声短循环来自本 TSL 的真实浏览器画布，闭环倒放只用于媒体。比较、性能和测试结果见 `VALIDATION.md`。

## 保留的原始声明

```text
License CC0 - http://creativecommons.org/publicdomain/zero/1.0/
To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
^ This means do ANYTHING YOU WANT with this code. Because we are programmers, not lawyers.
-Otavio Good
```

本 TSL 改编也按 [CC0 1.0 法律文本](https://creativecommons.org/publicdomain/zero/1.0/legalcode) 提供。
