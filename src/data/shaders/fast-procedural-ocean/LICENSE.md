# Very fast procedural ocean — 许可证与来源证据

- 原作：**Very fast procedural ocean — afl_ext（MdXyzX）**，[Shadertoy 原作](https://www.shadertoy.com/view/MdXyzX)。
- 本案例：TSL 授权移植「逐波海面」。唯一 Image pass，零纹理、音频或模型输入。
- **主作采用旧镜像源码顶部的显式 MIT 声明**：`// afl_ext 2017-2024`、`// MIT License`。已完整检查 pass 的顶部、正文、末尾和 metadata，没有禁止托管、展示、分发或改编的限制。
- 原始主作 GLSL、TSL 改编及本案例 WebP / 无声 WebM 按 MIT 保留通知。独立中文赏析 CC BY-NC-SA 4.0，框架 MIT，网站永久非商业。
- 单独归档的 XsGfWV 示范遵循历史默认 CC BY-NC-SA 3.0，不将其整份代码标为 MIT。

## 固定镜像与热度

- 镜像：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders)，固定提交 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`。
- [主作 MdXyzX.json](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/MdXyzX.json)，info.id 大小写精确一致，作者 afl_ext，标题 Very fast procedural ocean。
- [固定 README](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/README.md) 记载初始下载 **2024-10-05**；主作与 XsGfWV 文件的最后提交均经 API 核实为 **2025-05-29T06:43:53Z**。
- 抓取、完整审阅日期：**2026-10-08**。主作历史 **818 likes / 199459 views**，精确指标采样时间未知，不作为本日当前热度。metadata 的作品日期不是采样日期。
- 当前原作页面请求 **HTTP 403**，当前代码、许可、热度未核验，没有绕过访问限制。
- `mirror.json` 保留主作镜像原始字节；`original.glsl` 保留完整解码 Image pass，不删改注释或空白。

## ACES 二级引用与上游证据

1. 主作 `aces_tonemap` 注释明确链接同作者的 **ACES Cinematic Tonemapping — afl_ext（XsGfWV）**。[固定镜像](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/XsGfWV.json) 的唯一 Image pass 已全文审阅，无输入或自定义许可，只有 Academy ACES 概念链接。`tonemap-mirror.json` 和 `tonemap-original.glsl` 单独依用户流程按 **Shadertoy 默认 CC BY-NC-SA 3.0（基于旧镜像快照）** 归档。该判断不是作者显式 MIT 授权；[默认许可正文](https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode)。
2. 该独立示范中的其他视觉、曝光、对比代码没有移植。TSL 来自主作的显式 MIT 工作，并保留下述 MIT 拟合出处。
3. 主作及示范的矩阵与有理拟合系数匹配 **Stephen Hill** 的实现：[TheRealMJP/BakingLab 的 ACES.hlsl](https://github.com/TheRealMJP/BakingLab/blob/c3868af50d72afc13cdfe513a1e0c6a4fafdac8c/BakingLab/ACES.hlsl)。固定提交 `c3868af50d72afc13cdfe513a1e0c6a4fafdac8c` 时间 **2024-05-10T04:13:41Z**，2026-10-08 抓取全文。
4. HLSL 顶部显式说明全部代码 MIT、Baking Lab 作者 MJP / David Neubelt，并将拟合与实现署名 Stephen Hill。完整[仓库 MIT LICENSE](https://github.com/TheRealMJP/BakingLab/blob/c3868af50d72afc13cdfe513a1e0c6a4fafdac8c/LICENSE) Copyright (c) 2016 MJP 同样保留于 `upstream/BakingLab-LICENSE.txt`。
5. Hill 出处是基于相同矩阵与拟合系数的**补充推断**，主作注释没有直接署名 Hill。GLSL 使用列主序，另加 `1/2.2` 输出幂；不把学院概念页面当作数值代码的许可。没有复制学院的文字或图像。

| 证据文件                       | 原始字节 SHA-256                                                 |
| ------------------------------ | ---------------------------------------------------------------- |
| mirror.json                    | CE423773A03155F0291445CF6B7BDB4640F8E627399B63C03EED2E0BE9C834F1 |
| tonemap-mirror.json            | 6A9B9EF9B5D2483C43EE4EB2DEA54373C93D7BF35C727776E2EB1B879BC7F952 |
| upstream/ACES.hlsl             | 0DAB4DBFBD748DD4D6A3F38CEF00155CFA4FFB5F6A8DDDF4B3368AFF52E4B23F |
| upstream/BakingLab-LICENSE.txt | 751878625007BD944C6F0B8B43E1BBDF47DA639975D49C358832043A31F1F3E8 |

提交前验证 Git 暂存字节与审核文件一致，两个解码 GLSL 与各自 Image pass 完全一致；结果见 VALIDATION.md。

## 用户批准记录

2026-10-08 先推荐 **Very fast procedural ocean — afl_ext（MdXyzX）**，披露原作链接、技术、历史热度、镜像日期、主作显式 MIT、自引用示范默认 NC-SA 与 BakingLab MIT 的区分，以及与现有 Seascape 的差异。用户紧接着明确回复 **“批准”**。

这份批准仅授权完全相同的标题和大小写精确 ID 的一个案例、一个独立 PR，并接受基于旧镜像证据继续。PR 合并仍是最终发布审批，不自行合并。

## 改编范围

- 保留指数波、负相位导数拖拽、波层参数增长、12 层高度查询、64 次推进、36 层默认法线、距离平滑、天空、太阳、Fresnel、蓝色散射近似和 ACES 显示颜色。
- 五个新增教学参数：时间速度、波高范围、波形拖拽、起始频率、法线层数。默认数值保持原作，从源时间第 7 秒开始；累计运行时间在 4000 秒取模，避免无限增长带来的单精度精度损失。
- 保留上下平面交点构造推进方向。原作下平面交点仅用于获取方向，并无下边界终止测试；仅在两个截断交点几乎重合时改用视线，避免极近地平线处归一化零向量。
- 删除不参与输出的 Mie 中间值。保留原作距离平滑后未再次归一化的法线，不宣称物理准确性。
- 使用居中拖拽与受限俯仰；去掉源绘制宽度小于 600 的相机分支，确保移动端与 DPR 切换默认构图一致。投影、默认旋转与海面视觉保持原作思路。
- GLSL 矩阵写成显式行点积。原作 gamma 显示颜色通过 sRGB 解码后交由统一输出，防止重复颜色编码。
- 海报与无声短片来自真实浏览器 TSL 画布；往返循环只编辑媒体时间方向。实际录制、对照与性能见 VALIDATION.md。没有托管任何不明来源的外部素材。

## MIT notice — 主作及本站新增 MIT 部分

Copyright (c) 2017-2024 afl_ext

Copyright (c) 2026 TSL Daily contributors (TSL adaptation and preview media)

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

Baking Lab — MJP / David Neubelt. ACES fitting and implementation by Stephen Hill.
The separate complete MIT notice, Copyright (c) 2016 MJP, is retained verbatim
in upstream/BakingLab-LICENSE.txt and the ACES.hlsl header is unchanged.

Very fast procedural ocean by afl_ext — https://www.shadertoy.com/view/MdXyzX

No endorsement by the original authors is implied.
