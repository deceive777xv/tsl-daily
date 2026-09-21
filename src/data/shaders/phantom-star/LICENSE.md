# Phantom Star for CineShader — 许可证与来源证据

- 主作品：**Phantom Star for CineShader — kasari39（ttKGDt）**，https://www.shadertoy.com/view/ttKGDt 。
- 本案例：TSL 授权移植「幻星晶廊」。
- **主作品 CC BY-NC-SA 3.0：基于旧镜像快照的默认许可判断，不是源码显式许可声明。**
- 明确上游：**Phantom Mode — aiekick / Stephane Cuillerdier（MtScWW）**，https://www.shadertoy.com/view/MtScWW 。其源码头部明确声明 Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported。
- 许可正文：https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode 。
- 原始 GLSL、TSL 改编和衍生海报/短片遵循 CC BY-NC-SA 3.0；独立中文赏析 CC BY-NC-SA 4.0，框架 MIT，站点永久非商业。

## 固定证据与逐层来源

仓库 GabeRundlett/shadertoy-api-shaders，固定提交 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`。

| 证据           | 固定链接                                                                                                                               | 本地档案                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 主作品完整快照 | [ttKGDt.json](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/ttKGDt.json) | mirror.json / original.glsl                  |
| 上游完整快照   | [MtScWW.json](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/MtScWW.json) | phantom-mode-mirror.json / phantom-mode.glsl |
| 下载日期记录   | [README](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/README.md)                | 下载于 2024-10-05                            |

- 两文件提交日期均为 2025-05-29T06:43:53Z，GitHub API 核验。
- 抓取与完整审阅：2026-09-20；内部 info.id 与大小写精确匹配。
- 主作品历史 541 likes / 353861 views；上游 44 likes / 2241 views。精确指标采样时间未知，不代表当前热度。
- mirror.json SHA-256：`C0A57CE8C5CAC8FAAC9A999A2138D53B5AF0AE712F507FAA94C2784CDC06B309`。
- phantom-mode-mirror.json SHA-256：`A85AD1E862CABE2FC94489C3D064884483F0B04948761183307C3C33E2A9ACFD`。
- 两者均为单 Image pass、零输入。已完整检查源码头尾和正文，主作品没有自定义许可证或额外限制，唯一明确上游为 Phantom Mode；上游没有进一步代码来源署名或额外限制。
- 主作品描述的 CineShader 链接是另一展示入口，本例不复制该平台处理或素材。
- 当前主作品 Shadertoy 页面请求返回 HTTP 402；当前代码、许可与热度未核验。上游许可来自固定历史档案，未声称当前页面核验。

## 用户批准

2026-09-20，本任务推荐 **Phantom Star for CineShader — kasari39（ttKGDt）**，披露热度、镜像日期、默认许可判断、上游明确许可及视觉差异。用户随后明确回复 **“批准”**。该批准仅授权此标题/ID 的一个案例和一个独立 PR；PR 合并是最终发布审批，自动化不自行合并。

## 保留与改编

- 两个 JSON 保持字节不变；两个 GLSL 保存各自唯一 Image pass 的完整解码文本，保留空白与署名。
- TSL 保留右乘旋转、极坐标重复、盒体场、Phantom Mode 距离步进与光带公式。新增速度、角分区、折叠次数、辉光衰减、光带倍率五个参数，默认与原作相同；初始时间第 2 秒。
- 原始 alpha 公式仍在档案中，网页采用不透明 RGB，不实现 CineShader 的深度后处理；新增显示 RGB 到线性颜色空间解码。
- 无外部纹理、音频、模型或素材。浏览器渲染 WebP 与无声 WebM；短片使用 0.15 倍速度展示初始构图附近，首尾 0.5 秒交叉淡化，不声称原作数学严格周期；交互页保留默认一倍速度。

Phantom Star for CineShader by kasari39; Phantom Mode by Stephane Cuillerdier / aiekick (2017).

TSL adaptation and independent Chinese commentary: TSL Daily contributors, 2026. No endorsement by the original authors is implied.
