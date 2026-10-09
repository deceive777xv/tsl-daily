# Menger Sponge — 许可证与来源证据

- 原作：**Menger Sponge — iq / Inigo Quilez（4sX3Rn）**，[原作链接](https://www.shadertoy.com/view/4sX3Rn)。
- 固定镜像：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/4sX3Rn.json)。
- 镜像提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，**2025-05-29T06:43:53Z**；按文件路径查询提交历史确认。README 声明初次下载于 **2024-10-05**，并提示 Windows 文件名大小写碰撞；JSON 内部 ID 已确认精确为 `4sX3Rn`。
- 本次取回、完整审阅及批准：**2026-10-09**。
- 历史热度：**162 likes / 105322 views**。指标采样日期未知，不能把文件提交日当作精确采样时间，也不代表当前热度。
- `mirror.json` 原始 7589 bytes，SHA-256：`3CEEB8A03A0C297846B0EB915740A7122F588C60AF1EDD44CF7C8639562BCA78`。`original.glsl` 是完整唯一 Image pass 的解码字符串，包含 `mainImage` 和 `mainVR`；没有删改头尾。
- 本次请求当前 Shadertoy 页面返回 **HTTP 402**；未核验当前源码、许可、热度，没有观察到 Cloudflare 403 或绕过访问控制。

## 全通道检查与许可判断

完整 JSON 只有一个 Image / image render pass，`inputs` 为空。已阅读完整约 201 行源码以及所有元数据：没有 Common、Buffer、Sound 通道，没有外部贴图或音频。

顶部第 1 行明确写有 **The MIT License**，第 4 行为 **Copyright © 2013 Inigo Quilez**，第 5 行包含完整 MIT 授权、通知保留条件及免责条款。整份源码未发现额外禁止托管、展示、分发或改编的限制，也没有第三方源码或素材引用；技术文章链接指向作者自己的 Menger 文章。

因此原作与 TSL 改编采用 **MIT（基于旧镜像中的显式声明）**，显式 MIT 优先于平台默认 NC-SA。该判断仅针对这份固定快照，不适用于 iq 的其他作品，也不冒充当前作者许可核验。

框架 MIT；本站原创中文赏析与生成媒体 CC BY-NC-SA 4.0；本站永久非商业。原作无署名背书本站之意。保留原作标题、作者、链接及下列完整 MIT 通知。

## 用户批准记录

2026-10-09 先推荐 **Menger Sponge — iq（4sX3Rn）**，披露原作、关键技术、历史热度与未知采样日期、镜像日期、显式 MIT、当前访问限制及与 Star Nest / Spiraled Layers 的差异，并展示旧镜像 GLSL 的浏览器筛选画面。用户在该候选之后明确回复 **“批准”**。

该批准仅用于这个完全相同标题和大小写精确 ID 的一个案例、一个独立 PR。实现从当时最新 main `7f944431738f0a43e26bba6a470727509dcab709` 开始；候选批准不是 PR 合并许可。

## 改编说明

- 保留立方体距离、四层三倍尺度切割、构造遮蔽/层级标记、时间驱动的列主序坐标变换、包围盒求交、64 次主射线/阴影上限、六点法线、余弦层级材质和原作显示曲线。
- 普通二维视口从源时间 2 秒开始；使用原作 `AA=1` 单采样分支，实时未采用高性能分支的 2×2 超采样。原始 `mainVR` 仍完整保留，本站未提供 VR。
- 新增五个教学参数：速度、1–4 层切割、向完全变形偏移的混合量、调色相位、阴影锐度。默认分别为 1、4、0、0、64，保持原作默认数学效果。
- 列主序矩阵展开成显式行点积；原作显示空间颜色经 sRGB 解码后交给共用 sRGB 输出，避免重复颜色编码。
- WebP 海报和无声 WebM 来自真实浏览器 TSL 画布。往返仅用于短片闭环，不改变实时动画方向。实际后端/视觉/性能及原生隐藏标签页验证边界见 VALIDATION.md。

## MIT notice

Copyright © 2013 Inigo Quilez

Copyright (c) 2026 TSL Daily contributors (TSL adaptation)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
