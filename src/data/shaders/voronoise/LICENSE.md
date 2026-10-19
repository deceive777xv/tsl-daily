# Voronoise 来源与许可证档案

原作：**Voronoise — iq / Inigo Quilez（Xd23Dh）**。原作链接：<https://www.shadertoy.com/view/Xd23Dh>。

## 固定旧镜像证据

- 镜像仓库：<https://github.com/GabeRundlett/shadertoy-api-shaders>。
- 固定提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，文件提交时间 **2025-05-29T06:43:53Z**。
- [原始 JSON](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/Xd23Dh.json)。镜像 README 记载初次下载日期为 **2024-10-05**；这不是已证实的热度采样日期。
- 本次抓取、完整审阅与候选批准日期：**2026-10-19**。
- 历史 **408 likes / 114189 views**；精确指标采样日期未知，不代表当前热度，不宣称 Featured 或 Shader of the Week。
- `mirror.json`：4877 字节，SHA256 `0ff8b5e5c3ac2f65efa388b0b01f2f70ed90939c452a5946e172a98b5d3624f6`，Git blob `28f0011dd96c4129377b218ca6bbfe830a25abd1`，已与固定提交树匹配。
- `original.glsl`：3525 字节 / 86 行，SHA256 `9dd1151b4e847e19b5cdf23a36e8e67f50353942d89e3fa1a3c93b18a5b92b90`。

完整检查元数据与全部 render pass：只有一个 Image pass，零输入，没有贴图、音频或其他资产。第 1 至 5 行包含完整 MIT 声明及作者版权信息；未发现额外的禁止托管、展示、分发、改编条款或第三方源码声明。作者自己的相关文章与“More Voronoi shaders”列表属于说明和相关作品，不是必需的二级复制来源。

**本许可判断基于旧镜像快照中的显式 MIT，不使用 Shadertoy 默认许可推断。** 它只适用于该固定文件，不能推广为 iq 的其他作品均可复用。当前原作页面抓取返回 HTTP 402，未绕过访问控制，未核验当前源码、热度或作者最新许可说明。用户直接回复批准了前述唯一候选 **Voronoise（Xd23Dh）**，接受该历史证据，并授权一次独立案例 PR；合并由用户另行决定。

## 改编范围

原始 JSON 与 GLSL 按字节保留。TSL 保留三分量哈希、5×5 邻域顺序、距离权重、归一化、相位差与三次平滑；权重和为零时输出有限黑色，避免 `0 / 0`。默认静止重置对应原作第 4 秒。新增速度、格子密度、点位扰动偏移、权重柔度偏移、灰度对比五个控制；来源鼠标直接设参被滑块偏移替代。原作灰度输出先解码，再由共享渲染器做 sRGB 编码。

媒体来自真实浏览器中的 TSL 渲染。短循环采用已渲染时间段的正放与倒放衔接；这只改变预览剪辑，不改变交互案例的时间函数。具体编码、来源对照、后端差异与测试边界见 `VALIDATION.md`。

原始 GLSL 与 TSL 改编采用下列 MIT；中文原创说明与生成媒体采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)，框架 MIT，站点永久非商业。

## MIT License

Copyright © 2014 Inigo Quilez

Copyright (c) 2026 TSL Daily contributors (TSL adaptation)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
