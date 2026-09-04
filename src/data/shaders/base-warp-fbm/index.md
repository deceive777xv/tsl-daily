---
title: 玫瑰噪流
subtitle: 让 fBM 反复扭曲自己的坐标，长出粉红色的云团、脉络与潮汐
description: 普通 fBM 只是多尺度噪声相加；Base warp fBM 把噪声值送回坐标，再连续嵌套三层，于是随机纹理获得了方向、团块和流动感。
publishedAt: 2026-09-03
difficulty: 进阶
caseType: 授权移植
tags:
  - fBM
  - Domain Warp
  - Value Noise
source:
  title: Base warp fBM
  author: trinketMage
  url: https://www.shadertoy.com/view/tdG3Rd
  license: CC BY-NC-SA 3.0（Shadertoy 默认许可）；调色板 MIT
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 2025-05-29 API 快照；源码顶部无自定义许可证；458 likes / 369924 views
preview:
  poster: /previews/base-warp-fbm.webp
  loop: /previews/base-warp-fbm.webm
  alt: 深紫背景上的粉红、橙红与白色噪声云团缓慢卷曲流动
---

## 先看见什么

这不是一张被平移的噪声纹理。亮色云团会挤压、卷曲并拉出细长脉络，局部仿佛有一股看不见的流场。关键在于：噪声不仅决定颜色，也反过来改变下一次噪声采样的位置。

## 一步一步拆开

### 1. 从可重复计算的随机数开始

`rand()` 把二维格点投影到一个标量，再用正弦和 `fract` 打散。它不是真随机，但同一坐标永远得到同一结果，因此 Shader 每帧都能稳定重建纹理。

### 2. 四个格点插值成 Value Noise

先取得像素所在整数格子的四个角，再用 `u * u * (3 - 2u)` 平滑小数坐标。横向插值两次、纵向再插值一次，就得到连续的二维噪声。原作最后把结果平方，让低值区域更暗、亮斑更集中。

### 3. 六个频段组成 fBM

每一层都把坐标旋转并放大约两倍，再以不同权重相加。大尺度层决定云团，小尺度层补充边缘细节。原作的权重顺序不是严格递减：第三层权重重新升到 `0.25`，因此中频结构格外明显。

```ts
const sum = noise(p0.add(time))
  .mul(0.5)
  .add(noise(p1).mul(0.03125))
  .add(noise(p2).mul(0.25))
  .add(noise(p3).mul(0.125))
  .add(noise(p4).mul(0.0625))
  .add(noise(p5.add(sin(time))).mul(0.015625));
```

### 4. Domain Warp：让噪声扭曲噪声

先算最内层 `fbm(p)`，把它当成二维偏移加回 `p`；中层再计算一次，继续偏移最外层。规则网格被逐层推弯，孤立随机点就连成了潮汐般的方向性纹理。

```ts
const inner = fbm(p);
const middle = fbm(p.add(vec2(inner).mul(warp)));
const shade = fbm(p.add(vec2(middle).mul(warp)));
```

### 5. 用分段函数映射玫瑰色

原作采用 `kbinani/colormap-shaders` 的 `transform_rose`。它不是简单的两色渐变，而是为 R、G、B 各写一组分段线性函数，使暗部保持紫红，中段迅速升温，高值趋近白色。

## 可以亲手试什么

- **速度**：控制参与首尾噪声层的时间。
- **尺度**：改变初始 UV 的放大倍数，决定画面里能看到多少团块。
- **扭曲**：从 0 开始可以对比普通 fBM 与三层 domain warp。
- **对比度**：围绕中灰重映射最终噪声值，再送入玫瑰调色板。

## TSL 重写要点

六层 fBM 在 TypeScript 中显式展开，使每个节点权重和坐标变换都能直接阅读；没有生成 GLSL 字符串。原作的 `if / else` 调色板被改写为嵌套 `select()` 节点，因此 WebGPU 与 WebGL2 后端共享同一份 TSL 图。

## 性能观察

一次 `pattern()` 会调用三次 fBM，每次包含六次 value noise；而每次 value noise 又计算四个格点随机值。它没有纹理采样，却有较多三角函数。运行时的自适应 DPR 会比简单网格案例更早介入高分屏设备。

## 许可说明

主作品快照顶部没有自定义许可证，TSL 改编按 Shadertoy 默认 CC BY-NC-SA 3.0 发布。玫瑰调色板来自 MIT 许可的 `kbinani/colormap-shaders`，已保留 Copyright (c) 2015 kbinani；Domain Warp 思路链接并署名 Inigo Quilez 的文章，但没有选用或托管他带限制性声明的 Shadertoy 作品。
