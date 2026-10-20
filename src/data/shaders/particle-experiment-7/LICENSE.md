# Particle Experiment 7 来源与许可证档案

原作：**Particle Experiment 7 — aiekick / Stephane Cuillerdier（MddGWN）**。原作链接：<https://www.shadertoy.com/view/MddGWN>。

## 固定旧镜像证据

- 镜像仓库：<https://github.com/GabeRundlett/shadertoy-api-shaders>。
- 固定提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`；文件提交时间 **2025-05-29T06:43:53Z**。
- [原始 JSON](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/MddGWN.json)。README 记录初次下载 **2024-10-05**，不能据此确定指标采样日期。
- 本次抓取、全文审阅与批准：**2026-10-20**。
- 历史 **110 likes / 35450 views**，精确采样日期未知，不代表当前热度；不宣称 Featured 或 Shader of the Week。
- `mirror.json`：2664 字节，SHA256 `bfb11de6791e288f6cddfc956428ad047b421d17867405b54c625c6046dd6244`，Git blob `e1ff98e0aab9c5c66f568790e633f3ff32a20ac0`，匹配固定提交树。
- `original.glsl`：1684 UTF-8 字节 / 79 行，SHA256 `f8c182d0f4e55c06146648c5ffeb3085f69c51ba24e809921cc4b30fd341d3bc`。

完整检查元数据与所有 render pass：只有一个未命名 Image pass，零输入，无贴图、音频、缓冲通道或其他资产。首行署名 Stephane Cuillerdier / Aiekick / 2015；第 2 行显式声明 **Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License**。全文未发现额外禁止托管、展示、分发、改编的限制或声明复制的上游来源。XShade 在第 3 行被列为调试创作工具，不是输入素材或复制源码来源。

**本判断基于旧镜像快照中的显式 CC BY-NC-SA 3.0，不是默认许可证推断或作者当前确认。** 当前原作页面抓取返回 HTTP 402；没有绕过访问控制，未核验当前源码、热度及作者最新说明。用户在前述唯一、完整标题与 ID 候选之后直接回复“批准”，授权按该证据制作一次独立 PR；合并与公开发布仍由用户决定。

## 改编与分发

保留原始 JSON 和解码后的 GLSL 字节。TSL 改编保留默认一百粒子、整数分组、正弦相位、6.28 角度常量、径向循环、原作半径/颜色比值与逐次加权混色。仅增加光点中心和零向量的有限分母保护，显式下降三次曲线替代反向 smoothstep，RGB 显示范围约束及不透明输出。默认重置对应原作第 7 秒；速度、粒子数、扩散范围、取景尺度、辉光五个滑块取代直接鼠标覆盖。精度与后端差异见 `VALIDATION.md`，不承诺逐像素相同。

原作 GLSL、镜像与 TSL 改编遵循 [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)，保留作者、标题、来源、许可及修改说明。中文原创赏析采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)；生成媒体作为该视觉作品的改编，保留来源署名，按 [CC3 第 4(b) 条允许的同要素后续版本](https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode) CC BY-NC-SA 4.0 分发。框架 MIT，站点永久非商业。

海报与无声 WebM 循环由真实浏览器中的 TSL 画布生成。往返剪辑仅用于预览媒体，不改变交互动画的正向时间函数。修改者：TSL Daily contributors，2026-10-20。
