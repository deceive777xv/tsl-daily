# Heartfelt：来源与许可证档案

- 原作：Heartfelt — BigWIngs / Martijn Steinrucken，2017，Shadertoy ID `ltffzl`。
- 原作链接：https://www.shadertoy.com/view/ltffzl
- 固定镜像：https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/ltffzl.json
- README 记载初次下载日期 2024-10-05；文件提交日期 2025-05-29T06:43:53Z；本次抓取、审查日期 2026-09-17。
- 历史热度：1323 likes / 129121 views；精确采样日期未知，不代表当前指标。
- 当前 Shadertoy 页面抓取返回 HTTP 402；当前源码、素材和热度未核验。

## 显式许可与保真

唯一 Image pass 头部明确写出 Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License，优先于默认许可推断。全文检查未发现额外禁止托管或改编的条款。使用范围依据用户接受的历史镜像证据。

- https://creativecommons.org/licenses/by-nc-sa/3.0/
- `mirror.json` 保存原始字节，SHA256 `3C2EC4A1223083A4FB77DEEBFDA7604503165B87C5B24201B76B27D283A5ADDC`。
- `original.glsl` 是 Image pass 的完整解码文本，不修整空白或修改代码。原素材链接作为来源证据保留，应用不会请求它们。

## 上游哈希

原作 N13 标注来源 DAVE HOSKINS，但它与现存 hash31 的常数和返回表达式不同。本例不推断旧变体的独立许可范围，而是替换为下面镜像中 Common pass 的 MIT hash31，保留完整版权与许可文本。

- Hash without Sine — Dave_Hoskins / David Hoskins，Shadertoy ID `4djSRW`。
- https://www.shadertoy.com/view/4djSRW
- https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/4djSRW.json
- 同一镜像提交日期；`hash-mirror.json` SHA256 `CE1D823D216B36AD1C6ACB0C9E856D02157B04492F58429FDD62D0CF44FBECB5`。
- `hash-common.glsl` 保留完整 Common pass；它与 Image pass 显式 MIT。Sound pass 单独标注 CC BY-NC-SA 3.0，本例不使用、不执行 Sound pass。
- 源码文件自身也保留 MIT notice，以便独立下载时仍有许可声明。

## 用户批准与改编范围

2026-09-17，本任务推荐“Heartfelt — BigWIngs（ltffzl）”及静音雨窗、自制灯光背景、MIT 哈希替换范围，用户明确回复“批准”。本次仅制作该案例的一个 PR；合并仍由用户审批。

1. 去掉 HAS_HEART 爱心剧情、原音乐、雨声、原图、闪电及开场淡入；任何原图或音频的许可均未核实，因此完全排除请求、复制、托管和播放。
2. 用固定随机种子、Canvas 径向渐变独立生成背景，初始化一次并生成 mipmap；背景按比例居中裁切。
3. 用 MIT hash31 替换旧 N13；水滴排列改变。保留署名，明确不是原作的逐像素复刻。
4. GLSL 改编为 Three.js TSL；反向 smoothstep 改为有定义的递增边界，零宽拖痕加数值保护。
5. 增加五个教学参数；雨量为零时清除全部水珠；去掉自动缩放、自动雨量与剧情，默认连续雨窗。

## 分发许可

原始 GLSL、TSL 改编、派生海报及视频：CC BY-NC-SA 3.0，保留 BigWIngs / Martijn Steinrucken 署名；hash31 子部分继续保留 David Hoskins MIT notice。自制背景随该派生案例按 CC BY-NC-SA 3.0 分发。独立中文赏析 CC BY-NC-SA 4.0；网站框架 MIT。本站永久非商业，无广告、赞助、付费访问或商业导流。

## David Hoskins MIT notice

```text
/* Copyright (c)2014 David Hoskins.

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
SOFTWARE.*/
```
