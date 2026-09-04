---
title: 光栅涌流
subtitle: 三次相位错位，把一张规则网格推成流动的霓虹隧道
description: 这个不足二十行的片元程序没有噪声纹理，也没有复杂几何；它只用极坐标式位移、周期折叠和距离倒数，制造出高速涌动的光栅。
publishedAt: 2026-09-03
difficulty: 入门
caseType: 授权移植
tags:
  - 周期重复
  - 距离场
  - 极坐标
source:
  title: Creation by Silexars
  author: Danguafer（Danilo Guanabara / Silexars）
  url: https://www.shadertoy.com/view/XsXXDn
  license: CC BY-NC-SA 3.0（Shadertoy 默认许可）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 2025-05-29 API 快照；源码顶部无自定义许可证；1676 likes / 748560 views
preview:
  poster: /previews/creation-by-silexars.webp
  loop: /previews/creation-by-silexars.webm
  alt: 黑色背景上的红绿蓝发光网格向画面中心连续卷曲和涌动
---

## 先看见什么

画面像一块被吸入中心的发光方格纸。红、绿、蓝三层几乎重合，但各自相差 `0.07` 的时间相位，于是高亮边缘出现轻微色散。原作真正厉害的地方，是把“网格”“流动”和“发光”压缩进了极少的数学操作。

## 一步一步拆开

### 1. 先把屏幕中心放到原点

`uv` 保留 0–1 坐标用于生成重复网格；`p` 则减去 `0.5`，并用宽高比修正 x 轴。这样 `length(p)` 才表示像素到画面中心的几何距离，而不会在宽屏上变成椭圆。

### 2. 沿径向推动 UV

位移方向是 `p / length(p)`，也就是从中心指向当前像素的单位向量。位移强度由两个正弦波相乘：一个控制整体呼吸，另一个让不同半径上的点出现交替波峰。

```ts
const radius = max(length(centered), 0.0001);
const wave = sin(phase)
  .add(1)
  .mul(abs(sin(radius.mul(9).sub(phase.mul(2)))));
const warpedUv = baseUv.add(centered.div(radius).mul(wave).mul(warp));
```

### 3. 把无限平面折回一个方格

`mod(warpedUv, 1) - 0.5` 把所有坐标折回同一个以原点为中心的单元。对这个局部坐标取长度，就得到每个方格中心附近的距离。

### 4. 用距离倒数画出强光

`0.01 / distance` 在格点附近迅速变亮，天然产生尖锐光核与长尾辉光。最后再除以到屏幕中心的距离，中心吸力会进一步增强。

### 5. 用相位而不是调色板分离 RGB

原作循环三次，每次只把时间相位推进 `0.07`，然后分别写入 R、G、B。TSL 版本把这三次计算展开，生成的节点图更直接，也更便于逐通道阅读。

## 可以亲手试什么

- **速度**：改变时间推进率；降到很低时，更容易观察径向波的结构。
- **扭曲**：控制 UV 被径向波推开的距离。
- **辉光**：改变距离倒数的分子，决定网格有多亮。

## TSL 重写要点

这里没有把 GLSL 字符串塞进 Three.js，而是用 `uv()`、`sin()`、`mod()`、`length()` 等 TSL 节点构造材质的 `colorNode`。参数也是节点 uniform，所以滑杆变化不会重新编译整个 Shader。

## 性能观察

每个像素只执行三份相同的二维数学，没有纹理采样、动态循环或分支，是非常轻量的全屏案例。高分辨率设备上的主要成本来自像素数量，因此运行时仍会依据帧耗时自适应 DPR。

## 许可说明

热度数据与源码来自 2025-05-29 的公开 API 快照。快照中的代码顶部没有自定义许可证，但明确要求复用时署名 Danilo Guanabara；本页保留该署名，并依 Shadertoy 无自定义许可证时的默认规则按 CC BY-NC-SA 3.0 发布移植代码。若原作当前许可已变化，应以当前源码顶部声明为准并重新审查。
