---
title: 菱波交织
subtitle: 把浅色填充波纹与深色方环叠在同一张网格上，看相位从中心向外传递
description: 融合 Pretty Hip 的浅色填充波纹与用户修改的深色方环，用周期平铺、距离遮罩和径向相位构成二维动态纹样。
publishedAt: 2026-09-14
difficulty: 入门
caseType: 授权移植
tags:
  - 周期平铺
  - 方形距离场
  - 径向相位
  - 阈值遮罩
source:
  title: Pretty Hip
  author: Hadyn
  url: https://www.shadertoy.com/view/XsBfRW
  license: CC BY-NC-SA 3.0（基于旧镜像的默认许可判断）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 2025-05-29 旧镜像唯一 Image pass 无自定义许可；227 likes / 71985 views 为历史指标；融合站点所有者提供的修改版
preview:
  poster: /previews/pretty-hip.webp
  loop: /previews/pretty-hip.webm
  alt: 深蓝细网格上，青白菱形方环沿同心波纹交替出现，左上区域点缀钴蓝色，浅色块面隐约穿行其间
---

## 先看见什么

深蓝色的细网格承载着一圈圈青色与白色方环。每个方环都待在自己的格子里，轮廓却依次展开、收拢，形成从中心向外传播的波。少量浅色填充形状在方环之间显现，把原作与改版连接起来。

Hadyn 的 **Pretty Hip** 用浅蓝与白色表现填充菱形的波纹。本例保留这个计算过程，再融合站点所有者提供的深色网格、青白交替方环、钴蓝区域与斜向相位偏移。默认融合权重为 0.9，偏向深色改版；把“原作／改版”滑到两端，便能比较两种图形语言。

这不是 3D 场景，也没有纹理图片。屏幕上的方环都是像素坐标、距离与阈值的结果。与「光栅涌流」的径向 UV 扭曲和距离倒数辉光不同，这里不扭曲网格位置，而是让每格的遮罩在不同时间发生变化。

## 一步一步拆开

### 1. 先把坐标旋转，再让它重复

屏幕 UV 减去 0.5，中心就成了原点。纵坐标乘高宽比，让两个方向都以屏幕宽度为单位。然后旋转 45°，普通方格就呈现为菱形。写出旋转后的两个分量，也能避免混淆 GLSL 矩阵的行列顺序。

```ts
const centered = uv()
  .sub(0.5)
  .mul(vec2(1, resolution.y.div(resolution.x)));
const rotated = vec2(centered.x.add(centered.y), centered.y.sub(centered.x)).div(Math.SQRT2);
const cellPosition = rotated.mul(density).add(0.5);
const local = fract(cellPosition);
const cell = floor(cellPosition);
```

`fract` 返回格子内的局部坐标，`floor` 返回格子编号。同一个格子内的所有像素共享编号，因此能共享同一个动画相位。改版的 `+0.5` 使画面中心落在一个格子中央；原作则有自己相对网格宽度的偏移，融合实现保留两条计算路径，没有强行改变原作的网格对齐。

### 2. 用到四条边的最短距离描述一个方形

局部坐标的 `x`、`1-x`、`y`、`1-y` 分别对应到四条边的距离。取最小值，再乘 2，得到边缘为 0、中心为 1 的标量。改变这个标量的阈值，就能画出不同大小的内嵌方形。

```ts
const border = min(min(local.x, float(1).sub(local.x)), min(local.y, float(1).sub(local.y))).mul(2);
const distance = pow(float(1).sub(border), 2);
```

这里的“方形距离场”是用于画图的局部距离构造，不是可以直接拿去做 sphere tracing 的三维 SDF。平方改变了阈值对应的轮廓间距，也改变了轮廓移动时的视觉节奏。

### 3. 每格延迟一点，波纹就出现了

对格子编号求 `length`，得到格子距离中心有多远。用时间减去这段距离，远处格子就会晚一些进入同一阶段。改版还加入 `cell.x-cell.y`，让相位略微偏向对角线，减轻绝对同心的机械感。

```ts
const phase = elapsed.mul(0.5).sub(length(cell).mul(spacing)).add(cell.x.sub(cell.y).mul(0.05));
const edge = pow(max(sin(phase), 0), 0.4);
```

用户提供的版本直接对 `sin(phase)` 做 0.4 次幂。正弦为负时，GLSL 的 `pow` 结果未定义，所以这里先截到零；负半周期保持静止，正半周期展开。不能简单换成 `abs`，否则负半周期也会产生一次脉冲，动画节奏会改变。

原作路径保留 `fract` 形成的锯齿相位和隔阶段反转遮罩；改版路径使用截断正弦。两种节奏共同参与默认画面。

### 4. 两条轮廓之间，留下一个清晰的方环

用户修改版把两次 `smoothstep` 映射到 -1 至 +1，再相乘。两条零交叉轮廓之间成为方环，但固定为格子比例的软过渡会随画面一起放大：在 2560×1440、低密度方格上，边缘从 20% 到 80% 亮度要经过约 7 个像素。

融合版保留这两条轮廓的位置，分别是 `edge - 0.4` 和 `edge - 0.25`，改用 `fwidth` 决定边缘宽度。这样既保留抗锯齿，又不会让大方环变成宽泛的柔光。

```ts
const ringField = distance.mul(1.2).toVar();
const pixelWidth = max(fwidth(ringField).mul(0.5), 0.00001);
const inner = edge.sub(0.4);
const outer = edge.sub(0.25);
const enters = smoothstep(inner.sub(pixelWidth), inner.add(pixelWidth), ringField);
const leaves = smoothstep(outer.sub(pixelWidth), outer.add(pixelWidth), ringField);
const outsideRing = float(1).sub(enters.mul(float(1).sub(leaves)));
```

`fwidth` 近似描述一个像素内标量的变化范围。它只作用于边缘过渡，不是把整个画面做锐化，也不需要增加渲染分辨率。小尺寸下仍保留像素覆盖的平滑，放大时轮廓保持清晰。

按 `mod(cell.x + cell.y, 2)` 的奇偶选择青色或白色。GLSL 风格的 `mod` 对负编号也返回正确的非负周期位置；不要直接套用 JavaScript 对负数的 `%` 语义。再对 `cell.y-cell.x` 分区，给画面的一角加入钴蓝色。

### 5. 用颜色融合把两个版本连起来

底纹使用另一张更密的、没有旋转的网格。`fwidth` 估计一个像素跨过多少网格坐标，为细线边缘提供屏幕空间平滑。默认底纹对比为 0.6，保持方环的主次关系。

```ts
const darkColor = mix(ringColor, background, outsideRing);
const displayColor = clamp(mix(originalColor, darkColor, style), 0, 1);
return sRGBTransferEOTF(displayColor);
```

两种版本都先得到显示编码的 RGB，然后融合，再转入 Three.js 的线性颜色空间。原作会把一个数值写入 alpha；本例是完全不透明的画面，不把它当成网页透明度，以免亮度随页面背景变化。

## 可以试着改变什么

- **波纹速度**：改变时间推进倍率，零值停在初始相位。
- **方格密度**：从 8 到 24，比较格子大小与画面信息量。原作参考密度为 10，融合版默认 16。
- **相位间隔**：间隔越大，相邻径向位置的状态差异越大，波纹更密。
- **原作／改版**：0 为浅色填充路径，1 为深色方环路径。设为 0、密度 10、相位间隔 1.5，可查看原作计算路径的参考效果；它仍经过不透明输出与颜色处理。
- **底纹对比**：只改变深色路径的细网格；在原作端点不会生效。这是有意保留的分层关系。

## 性能观察

这是一个单 pass 的二维程序化片段着色器，没有纹理请求、光线步进或循环采样。融合版同时计算两个遮罩，所以比只保留某一版多一些标量运算。密度参数改变图案频率，不改变循环次数；提高分辨率会增加像素数，通常比提高方格密度更影响开销。

桌面与移动视口共用同一份 TSL，默认 WebGPU，可强制 WebGL2。页面沿用减少动态效果时的静态替身、隐藏时暂停和自适应 DPR。具体本机帧间隔、参数检查与环境限制见本目录 `VALIDATION.md` 和 `performance.json`。RAF 帧间隔不是 GPU 执行时间，模拟移动视口也不代表真机性能。

## 来源与改编

原作：**Pretty Hip — Hadyn**，Shadertoy **XsBfRW**。使用 GabeRundlett/shadertoy-api-shaders 的固定旧镜像；README 记载下载于 2024-10-05，文件提交日期为 2025-05-29，2026-09-14 取回。历史快照记录 227 likes / 71985 views，指标具体采样日期未知，不代表当前热度。当前 Shadertoy 获取返回 HTTP 402，未复核当前页面或源码。

镜像的唯一 Image pass 无外部输入、自定义许可或上游署名引用，按 **CC BY-NC-SA 3.0（基于旧镜像快照）**处理。完整保留 Hadyn 署名、原作链接和原始 GLSL。用户修改版由站点所有者提供，其说明为自行修改，部分灵感来源已记不清；不据此虚构作者或外部授权。

本例不是逐像素等价移植：新增两版融合、五个探索参数、固定初始相位 2.5、底纹边缘平滑、方环像素级抗锯齿、负数幂修正、显示 RGB 钳制与不透明输出。原作镜像、原始 GLSL 和用户修改版分别归档，详见 `LICENSE.md`。
