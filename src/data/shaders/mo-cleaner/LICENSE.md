# M-O (from Wall-E) · 来源与许可档案

## 用户批准与范围

- 原作：**M-O (from Wall-E) — dean_the_coder（WdVfRc）**。
- 链接：https://www.shadertoy.com/view/WdVfRc
- 2026-10-21，用户紧接本聊天唯一同名、同 ID 候选回复“批准”。批准接受该旧镜像的显式 CC BY-NC-SA 3.0 证据，仅授权从最新 main 制作一个案例和一个独立 PR，不授权合并或发布。
- 基线 main：`f2c7c78da48a2bbcba9a29e3f8dd610ad70ffbce`；分支 `codex/mo-cleaner`。

## 可复核旧镜像

- 仓库：https://github.com/GabeRundlett/shadertoy-api-shaders
- 固定文件：https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/WdVfRc.json
- 固定提交与文件最后提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，2025-05-29T06:43:53Z，已通过文件历史查询核验。
- README 声称最初下载日期：2024-10-05。固定提交的 README 同时说明 Windows 文件名大小写碰撞风险；本例内部 ID、标题、作者全部逐字匹配，不依赖文件名猜测。
- 抓取、完整审阅、候选通知和用户批准：2026-10-21。
- 元数据历史热度：**152 likes / 37,830 views**；精确采样日期未知，非当前指标。
- 当前页面核验：工具报告页面不可访问，没有观察到可归属于该 ID 的具体 HTTP 状态。没有绕过访问限制；当前源码、作者确认与热度未核验。

## 全通道审阅和判断

完整元数据及唯一 Image pass 全部 274 行已审阅，无 Common、Buffer 或 Sound pass，无外部纹理、模型或音频输入。源码第 23 行明确写出 Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License。未发现额外禁止托管、展示、分发或改编的声明。本判断**基于旧镜像快照中的显式许可**，不是默认规则推断，也不是对当前作者授权的确认。

保留作者 **dean_the_coder / @deanthecoder**，对 Pixar《Wall-E》中 M-O 的致敬背景，以及原文对 Evvvvil、Flopine、Nusan、BigWings、Iq、Shane 等分享知识者的致谢。源码链接的 GLSL Shader Shrinker 是创作/压缩工具，不是声明复制的上游实现或运行时依赖。完整源码没有声明另行复制的第三方代码。角色致敬说明不表示 Pixar 对本移植的认可。

## 文件与修改

| 文件            | 字节数 | SHA-256                                                            |
| --------------- | ------ | ------------------------------------------------------------------ |
| `mirror.json`   | 9020   | `ba98c8d275660fe2aefc678cb201d89e07f9e7f77077596b7f7922d6e71273aa` |
| `original.glsl` | 7401   | `1aaf7f03856024f1e00f7ca6960bb4cd8b9aa0b547bbe0eb060c8f2908ea3ff9` |

镜像 Git blob 为 `3c686860ba5e59237da90703f3fd0447e29806c6`，与固定树匹配。JSON 和解码 GLSL 按字节保存，不格式化原始源码。

TSL 是此源码的改编：保留几何、变换方向、材质编号、采样顺序、原作四次抗锯齿与跨样本辉光累加。将 Hit 打包为向量、将 map 的全局辉光副作用改成显式传递，添加五个教学控制及退化法线/平方根/分母保护，约束显示 RGB、显式采用不透明输出。窄屏扩展取景并向角色平移，桌面默认构图保持原作设置。没有载入外部素材。

## 分发条款

- 原始快照与 TSL 改编：**CC BY-NC-SA 3.0 Unported**。保留作者、标题、来源链接、许可链接和改动说明，永久非商业，并按相同许可共享改编。
- 本文原创中文解释：**CC BY-NC-SA 4.0**。
- 实际浏览器生成的 WebP/WebM 是原作视觉改编；保留上述署名与来源，并依据 CC BY-NC-SA 3.0 第 4(b) 条允许的后续同要素版本，以 **CC BY-NC-SA 4.0** 分发。媒体制作方式与裁剪/往返循环记录在验证档案中。
- 站点框架：MIT；站点永久非商业。

许可摘要：https://creativecommons.org/licenses/by-nc-sa/3.0/

法律文本：https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode
