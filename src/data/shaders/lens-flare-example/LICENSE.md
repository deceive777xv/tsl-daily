# Lens Flare Example — 许可证与来源证据

- 原作：**Lens Flare Example — mu6k（4sX3Rs）**，https://www.shadertoy.com/view/4sX3Rs 。中文名「镜间流光」，TSL 授权移植。
- 许可：**Unlicense / public domain（旧镜像源码显式声明）**，优先于 Shadertoy 默认规则。许可正文：https://unlicense.org/ 。
- 顶部原文：`This is free and unencumbered software released into the public domain.`；紧接 Unlicense 链接。作者另外明确允许使用、无需署名但欢迎署名。本案例保留署名。
- 原始 GLSL、TSL 改编、生成噪声按 Unlicense 分发；独立中文赏析及本项目海报、视频 CC BY-NC-SA 4.0，框架 MIT。本站永久非商业；这些内容许可不改变原作的 public-domain 声明。

## 固定镜像与热度

- 镜像：https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/4sX3Rs.json
- 仓库：GabeRundlett/shadertoy-api-shaders；文件提交 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，**2025-05-29T06:43:53Z**。
- 同提交 README 说明下载于 **2024-10-05**；提交日期不是热度采样日期，具体采样日未知。
- 历史 **294 likes / 26927 views**，不是当前指标；本次抓取、完整源码与许可审阅 **2026-09-13**。
- `mirror.json` 保存原始下载字节，SHA-256：`D12853CE339A8D62F83F01CC5EF9342697D5E99D051E262E6FE2A952EAAC6708`。
- 已核对 JSON 内部 ID 大小写为 `4sX3Rs`，作者 `mu6k`，避免镜像文件名大小写碰撞问题。
- 当前 Shadertoy 请求返回 **HTTP 402**；没有直接观察到 Cloudflare 403，当前页面、源码与指标未核验。

## 全部 pass 与输入

只有一个 **Image** pass。已检查完整源码及头尾，顶部为明确 public-domain / Unlicense 声明，无禁止托管、展示、分发或改编的条款。2017-11-27 变更记录致谢 **Shane** 修复接缝，2019-08-08 记录许可变更；两者均原样保留。

源码中的“更通用方案”链接和 Used in 列表是进一步阅读及下游使用示例；本案例没有从这些链接引入代码。没有额外 render pass 或音频。

唯一输入为 Shadertoy `iChannel0` 噪声贴图，路径记录在原始 JSON 内。其独立素材许可未确认，**不下载、不复制、不托管、不请求该贴图**。按获批范围，运行时生成固定种子 xorshift32 256 × 256 RGBA 噪声，使用 Repeat、Linear/Mipmap 采样。证据 JSON 保留原输入路径只为记录来源，不触发请求。

## 候选批准

2026-09-13，候选 **Lens Flare Example — mu6k（4sX3Rs）** 已披露原作链接、历史指标与日期、显式许可证、当前页不可核验、视觉差异及本地噪声替换范围。用户明确回复 **“批准”**。

批准仅授权此案例实现和一个独立 PR；PR 合并仍为最终发布审批，自动化不自行合并。分支从 `main@3aac5320f0298e5ca3aa8adbd62d75c3399f2872` 创建。

## 修改清单

- `original.glsl` 原样提取唯一 Image pass；`mirror.json` 字节保真。
- TSL 保留主光源径向衰减、角度噪声、四组 RGB 鬼影、UV 外推扭曲、暖色偏置和颜色调整。
- 删除不参与输出的 `n`、`f1` 计算；为光源中心 `atan(0,0)` 增加极小保护。
- 本地生成噪声代替外部贴图，星芒和颗粒细节因此不同；不是逐像素复刻原作素材。
- 默认从原作第 0.7 秒开始；增加运动速度、整体亮度、鬼影强度、色散距离、星芒起伏五参数。
- 竖屏缩小光源水平运动幅度；桌面拖动为自动轨迹添加持久偏移，代替原作按住时直接定位/松开回到轨迹的交互；移动端保留案例切换手势。
- 显示 RGB 限制后先解码，再交由站点编码输出。媒体由真实浏览器画布生成，无音轨；短循环接缝处理见 VALIDATION.md。

## 署名

Lens Flare Example by mu6k — https://www.shadertoy.com/view/4sX3Rs . Original seam fix acknowledgment: Shane.

TSL adaptation and generated noise: TSL Daily contributors, 2026, Unlicense. Independent Chinese commentary and project preview media: CC BY-NC-SA 4.0. No endorsement by the original author is implied.
