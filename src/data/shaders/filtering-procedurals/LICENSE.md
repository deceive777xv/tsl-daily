# Filtering procedurals — 许可证与来源证据

- 原作：**Filtering procedurals — iq / Inigo Quilez（MdjGR1）**，[原作链接](https://www.shadertoy.com/view/MdjGR1)。
- 固定镜像：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/MdjGR1.json)。
- 镜像提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，**2025-05-29T06:43:53Z**；按文件路径查询提交历史确认。README 声明初次下载于 **2024-10-05**，并提示 Windows 文件名大小写碰撞；已核对 JSON 内部精确 ID `MdjGR1`。
- 本次取回、完整审阅、推荐与明确批准：**2026-10-11**。
- 历史热度：**216 likes / 55313 views**。精确指标采样日期未知；不能把镜像提交日或源码创建日当作热度采样日期，也不代表当前数值。
- `mirror.json`：完整原始 **13743 bytes**，SHA-256 **7ED5834E8BFD4F2B0C42EEC1442649F2E15E9BC8B6CAF1EE304C90BEF4589512**。
- `original.glsl`：完整唯一 Image pass 的解码字符串，**350 行**，UTF-8 SHA-256 **E9A7CE95ABB9465497D3413F9CA7B3BB8C2334D5D50A359BA4D099DEBC71C771**；未删改空白、头尾或预处理分支。
- 本次当前 Shadertoy 页面请求返回 **HTTP 402**。当前源码、许可与热度未核验，没有绕过访问控制。

## 全通道与来源检查

完整 JSON 只有一个 Image / image render pass，`inputs=[]`，没有 Common、Buffer、Sound，也没有外部贴图、音频或模型。已审阅完整 350 行及元数据。

源码第 1 行明确为 **The MIT License**，第 2 行为 **Copyright © 2013 Inigo Quilez**，第 5 行含完整授权、保留通知条件与免责条款。链接仅为作者自己的网站和 YouTube；整份源码未发现其他禁止托管、展示、分发、改编的限制或第三方源码、素材引用。

因此这份原作与 TSL 改编遵循 **MIT（基于旧镜像中的显式声明）**，显式声明优先于平台默认规则。该结论仅适用于这份固定历史快照，不是对当前作者许可的核验，也不意味着 iq 的其他作品均可使用。

框架 MIT，本站原创中文赏析与生成媒体 CC BY-NC-SA 4.0；站点永久非商业。保留作者、标题、原作链接和完整 MIT 通知；原作者没有为本站背书。

## 候选批准记录

2026-10-11 先推荐完全相同标题与 ID 的 **Filtering procedurals — iq / Inigo Quilez（MdjGR1）**，披露关键技术、历史热度与未知采样日期、初抓/镜像/本次抓取日期、完整 MIT 判断、当前页面访问限制与现有案例的差异，并展示原始 GLSL 的真实浏览器对照画面。用户随后明确回复 **“批准”**。

该批准只授权这一案例的一个独立 PR。分支 `codex/filtering-procedurals` 从当时最新 main **4f00f1603fb63690b7c20a6b082bb12a5d46d0a7** 创建；合并与发布仍由用户审批，候选批准不是合并许可。

## 改编说明

- 保留四个解析球体、地面、程序地砖/梯度噪声、解析球影与遮蔽、距离雾、相邻射线与切平面求交、自适应材质采样和原作显示曲线。
- 默认从源时间 7 秒开始，纹理尺度 64、每轴采样上限 10、过滤范围 4、分界约居中；纹理过滤不重复几何求交与光照，不是全帧超采样。
- GLSL 多个 out 参数打包为 TSL 返回值；梯度噪声仍按原作的八格点与三次平滑权重计算。相邻射线的切平面分母增加保留符号的 `1e-6` 下限，负材质亮度在 gamma 运算前保护为 0，避免边界数值异常。
- 原作按下鼠标拖动分界改为独立滑块；分界为 0 或 1 时隐藏对照黑线，便于全屏比较。其他新增教学控制为速度、纹理尺度、采样上限、过滤范围。
- 海报与无声短循环从真实浏览器 TSL 画布生成；媒体的闭环处理、后端/原作比较、测试与性能数据见 `VALIDATION.md`。实时相机保持向前环绕。

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
