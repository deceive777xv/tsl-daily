# Paint streams 来源与许可证档案

原作：**Paint streams — michael0884 / Mykhailo Moroz（WtfyDj）**。原作链接：<https://www.shadertoy.com/view/WtfyDj>。

## 固定旧镜像与批准

- 仓库：<https://github.com/GabeRundlett/shadertoy-api-shaders>。
- 固定提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，文件最新提交时间 **2025-05-29T06:43:53Z**；初始文件提交 `90091f43d47a056066a119bdcd4c1955f83704f4`，时间 **2024-10-06T12:51:23Z**。
- [原始 JSON](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/WtfyDj.json)。README 记载初次下载 **2024-10-05**，不代表指标采样日期。
- 抓取、全部源码审阅、候选通知及用户批准：**2026-10-26**。
- 历史 **666 likes / 33881 views**；精确采样日期未知，不代表当前热度，不宣称 Featured 或 Shader of the Week。
- `mirror.json`：15232 字节，SHA256 `5178d554b7df57f950b08fc882e0a739f3d2fd4eda82facc6d4dbe0cd2b115a1`，Git blob `92e1c560b506abd3a734f26251c9aa93a3c17981`，与固定树匹配。
- 各段解码 GLSL 的字节数与 SHA256 见 `source-hashes.json`。Image 51 行、Common 244 行、A 33 行、B 31 行、C 25 行，共 384 行含空行；全部源码及元数据已审阅。输入仅为内部反馈缓冲，没有外部图片、音频、视频或模型。

用户在本聊天唯一 **Paint streams — michael0884 / Mykhailo Moroz（WtfyDj）** 候选通知之后直接回复“批准”。该批准接受旧镜像默认 CC BY-NC-SA 3.0 判断及 David Hoskins 的 MIT 辅助函数署名，只授权一次独立案例 PR。制作前已复核最新 main、现有案例与全部历史 PR，无重复。合并与发布仍由用户决定。

## 主作品许可判断

原作五段源码中没有自定义许可头部或禁止托管、展示、分发、改编的额外条件。**按 Shadertoy 默认 CC BY-NC-SA 3.0 判断，明确基于旧镜像快照。** 这不是原作者在源码中的显式授予，也不是当前作者确认。原作与 terms 页面请求返回 HTTP 402，没有绕过访问控制；当前源码、热度及最新授权说明未核验。

主作品原始快照和 TSL 改编依照 [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)分发，保留标题、作者、原作链接、旧镜像出处及修改说明；保持非商业及相同方式共享条件。完整法律文本：<https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode>。

## 辅助哈希的二级来源

Common 中 `hash32(vec2)` 的函数体，在去除空白后，与 **Hash without Sine — David Hoskins（4djSRW）** 的 Common 函数体完全一致。来源是同一固定镜像的 [4djSRW.json](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/4djSRW.json)。已审阅其 Common 全文与所有 pass 的许可头部。Common 含完整 MIT 许可及 `Copyright (c)2014 David Hoskins`；完整原始 Common 保存为 `hash-without-sine-common.glsl`，包含许可文本，哈希见 `source-hashes.json`。

MIT 判断仅适用于这个 Common 函数来源，不扩大到整个 4djSRW；其 Sound pass 是 CC BY-NC-SA 3.0，本案例不使用该 Sound 源码。主作品中随机初始化条件 `rand.z < 0` 不会进入该分支，TSL 不执行这段未启用的初始化，但原始快照仍保留辅助代码及 MIT 署名。

## 算法与概念署名

作者自己的 [Reintegration tracking](https://michaelmoroz.github.io/Reintegration-Tracking/)发表于 **2020-08-31**，直接链接本作品；[About](https://michaelmoroz.github.io/about/)链接 michael0884 的 Shadertoy 身份。文章解释质量加权的邻域重积分与 SPH 式局部作用力，并感谢 Wyatt 的建议、stb 的早期网格粒子追踪思路。本文保留这些概念来源，没有复制文章图像、正文或独立实现包。

## 移植修改

- 保留 A→B 反馈、C 密度与 Image 显示的依赖，5×5 重积分与压力邻域、3×3 密度邻域、原作 dt=1.5、注入口与边界几何、混色及显示曲线。
- 用两个普通 RGBA32F 附件代替浮点位型打包，保留 16 位量化公式；明确的零越界、极小分母与零法线保护避免未定义数据。没有宣称逐像素或数值轨迹完全相同。
- 逆序 smoothstep 展开为明确的下降三次曲线；显示值先做 sRGB 解码。
- 固定 60 步/秒的调度与最长边 400 的模拟网格；先推进 600 步，非默认物理参数与宽高比变化会重演。默认恢复采用持久状态 B 与显示密度 C 的 GPU 检查点，避免依赖重新求解的局部轨迹；显示 DPR 独立于模拟分辨率。
- 加入模拟速度、重力、压力、分布宽度与高光五个参数；不接入原鼠标搅动，省去未启用的随机初始化、零系数黏性与未使用显示量。
- 预览海报和短循环从实际 TSL 浏览器画布生成；短循环的剪辑处理会单独记录。没有下载或托管外部输入资产。

原作与 TSL 改编署名 Mykhailo Moroz / michael0884，辅助 Common 署名 David Hoskins，TSL 修改另署名 TSL Daily contributors，2026。原创中文采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)；生成媒体含改编表达，按 CC BY-NC-SA 3.0 第 4(b) 条允许的同要素后续版本，以 CC BY-NC-SA 4.0 分发，保留全部来源署名。框架 MIT，站点永久非商业。
