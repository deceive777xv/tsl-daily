---
title: 格点融噪
subtitle: 用同一套邻域加权，让规则格子、细胞纹理与柔和噪声连续变化
description: Voronoise 为每个格子生成一个特征点与灰度值，再按距离混合邻域样本；点位扰动和权重柔度决定画面有多规则、边界有多硬。
publishedAt: 2026-10-19
difficulty: 进阶
caseType: 授权移植
tags:
  - Voronoise
  - 程序噪声
  - 邻域加权
  - 特征点
source:
  title: Voronoise
  author: iq / Inigo Quilez
  url: https://www.shadertoy.com/view/Xd23Dh
  license: MIT（基于旧镜像中的显式声明）
  licenseUrl: https://opensource.org/license/mit
  evidence: 2024-10-05 初次下载；2025-05-29 镜像提交；2026-10-19 完整审阅；历史 408 likes / 114189 views，精确采样日期未知；唯一 Image pass 顶部含完整 MIT 声明，无外部输入
preview:
  poster: /previews/voronoise.webp
  loop: /previews/voronoise.webm
  alt: 不规则灰度细胞逐渐融成柔和噪声，边界和形状随参数相位连续变化
---

## 先看见什么

一开始，画面像由深浅不同的碎片拼成。播放后，碎片边缘会软化，最后成为没有明确边界的灰度云团；另一段相位又让它接近规则格子。它没有移动贴图，也没有叠加多个噪声频段。变化来自同一个邻域加权公式中的两个数：**点能偏离格点多远，以及邻点的影响能扩散多宽**。

已有“金线分域”先找最近点，再计算到细胞边界的距离。本例给每个点附上一个灰度值，最后输出这些值的加权平均。两者都从网格与特征点出发，计算目标不同。

## 一步一步拆开

### 1. 给每个格子一组稳定的随机值

`floor(point)` 找到整数格子，`fract(point)` 留下格内位置。哈希把格子编号映射为三个 `[0, 1)` 数值：前两个决定点的位置，第三个决定该点携带的灰度。同一编号每次得到同一结果，所以动画过程中不会重新抽签。

```ts
const projected = vec3(
  dot(cell, vec2(127.1, 311.7)),
  dot(cell, vec2(269.5, 183.3)),
  dot(cell, vec2(419.2, 371.9)),
);
return fract(sin(projected).mul(43758.5453));
```

正弦哈希对浮点误差敏感。本移植保留来源公式，方便阅读对照；不同 GPU 或后端可能产生不同的局部灰度与点位，不能据此承诺逐像素相同。

### 2. 让点位扰动改变空间结构

检查当前格子周围的 `5 × 5` 邻域。每个邻格提供一个点，其偏移量乘以 `jitter`。当它为零，点落在规则整数格点上；接近一时，每个点可以在自己的格子内充分移动。灰度值不随这个缩放变化。

```ts
const random = cellRandom(cell.add(neighbor)).mul(vec3(jitter, jitter, 1));
const displacement = neighbor.sub(fraction).add(random.xy);
```

`displacement` 是从当前像素指向候选点的向量。这里不需要记录哪个点最近，只需要用它的长度决定影响权重。UV 两轴都按画面宽度换算，使宽屏和竖屏里的格子保持相同尺度。

### 3. 用距离权重决定边缘有多硬

先把距离通过 `smoothstep(0, 1.414, distance)` 映射到零至一，再用 `1 -` 翻转为中心强、远处弱的影响。来源半径常量是 `1.414`，移植保留这个数值。

```ts
const exponent = float(1).add(pow(float(1).sub(softness), 6).mul(63));
const weight = pow(float(1).sub(smoothstep(0, 1.414, length(displacement))), exponent);
```

`softness = 0` 时指数为 64，较小权重被迅速压低，附近最有影响的点主导颜色，形成近似硬细胞。`softness = 1` 时指数为 1，多个点共同贡献，颜色过渡变宽。硬边仍来自有限指数的加权，并非一次精确的最近点选择。

### 4. 用权重总和归一化灰度

累加器同时记录“随机灰度乘权重”和“权重”。最后除以权重总和，才得到加权平均。若只输出前者，多点重叠的位置会因为贡献数量更多而变亮。

```ts
accumulated.addAssign(vec2(random.z.mul(weight), weight));
// 循环结束后，权重和为正时：
value.assign(accumulated.x.div(accumulated.y));
```

代码为权重和为零的情况返回有限黑色，避免极小权重全部下溢后出现 `0 / 0`；正权重和沿用原作比值，不额外加入 epsilon 改变归一化。原作注释把不同端点联系到 cell noise、Perlin 和 Voronoi。本例应理解为形态上的统一：它没有实现经典 Perlin 的梯度点积，也没有计算 Voronoi 边界距离。

### 5. 让两个形态参数沿时间移动

两组相位相差 2 的余弦生成扰动与柔度，再连续经过三次 `p * p * (3 - 2p)`。重复平滑使动画更长时间停留在接近端点的形态，过渡集中在中间一段。

```ts
const shape = float(0.5)
  .sub(cos(time.add(vec2(0, 2))).mul(0.5))
  .toVar();
for (let pass = 0; pass < 3; pass++) {
  shape.assign(shape.mul(shape).mul(float(3).sub(shape.mul(2))));
}
```

五个控制的默认值保留原作无鼠标动画，暂停重置对应第 4 秒。来源按住鼠标后直接设置这两个参数；本例改为两个带说明的偏移滑块，加到自动形态后裁剪到 `[0, 1]`，便于键盘和触屏操作。默认偏移为零。灰度先按显示空间理解，再用 `sRGBTransferEOTF` 解码，交给共享渲染器编码输出。

## 可以亲手试什么

- **形态速度**：先设为 0，将画面固定在原作第 4 秒，再比较其他参数。
- **格子密度**：从 8 增加到 48，观察细胞变细；每个像素仍查询 25 个邻点。
- **扰动偏移**：固定速度为 0，设为 -1，再恢复为 0，对照规则格子与不规则细胞。
- **柔度偏移**：保持速度为 0，推到 1，观察硬细胞如何融为连续噪声；-1 强制最硬权重。
- **灰度对比**：只调整最终明暗，分辨“改变结构”和“改变显示”各自造成的效果。

## 性能观察与验证边界

每个像素固定查询 25 个邻格，每次含三分量正弦哈希、距离、平滑和幂运算。它没有纹理请求，也没有 fBM 的多频段叠加。提高密度不会增加循环次数，但会增加屏幕空间高频细节；硬细胞边缘可能走样，本例没有为它增加全屏超采样。提高 DPR 会直接增加计算像素数，共享运行时可按帧负担下调 DPR。

本机实测、两种后端、参数变化与恢复、来源对照和媒体检查见同目录 `VALIDATION.md`、`performance.json`、`browser-evidence.json` 和 `reference-comparison.json`。RAF 间隔是浏览器调度观察，不是 GPU 时间戳或真实手机成绩。减少动态偏好默认展示海报，用户仍可手动播放；受控隐藏事件与真实后台标签页分别记录，未观察到原生隐藏状态时不宣称它已验证。

## 来源与许可

[Voronoise — iq / Inigo Quilez（Xd23Dh）](https://www.shadertoy.com/view/Xd23Dh) 来自 GabeRundlett/shadertoy-api-shaders 的固定旧镜像，提交 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`。README 记载初次下载于 2024-10-05，文件提交于 2025-05-29；历史 **408 likes / 114189 views** 的精确采样日期未知。

2026-10-19 审阅完整元数据与唯一 Image pass 的 86 行。源码顶部含完整 **MIT / Copyright © 2014 Inigo Quilez**，未见附加限制或第三方源码声明，无外部输入；相关作品列表与作者文章是延伸阅读。许可判断基于旧镜像中的显式声明，仅适用于这份来源，不推广到 iq 的其他作品。当前原作页面返回 HTTP 402，未核验当前版本。用户于 2026-10-19 明确批准该候选；原始 GLSL 与 JSON 保留快照字节，TSL 改编遵循 MIT，中文原创赏析与生成媒体 CC BY-NC-SA 4.0，框架 MIT，站点永久非商业。
