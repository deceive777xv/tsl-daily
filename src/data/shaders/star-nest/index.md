---
title: 星巢
subtitle: 把反复折叠的 Kaliset 分形沿视线层层累加，点亮一片会呼吸的星云
description: Star Nest 不用纹理或模型，只让一个三维点反复经历绝对值、倒数与偏移，再把沿视线采到的变化量累积成有深度的彩色星雾。
publishedAt: 2026-09-05
difficulty: 高级
caseType: 授权移植
tags:
  - Kaliset 分形
  - 体积积分
  - 空间折叠
source:
  title: Star Nest
  author: Kali（Pablo Roman Andrioli）
  url: https://www.shadertoy.com/view/XlfGRj
  license: MIT（源码顶部显式声明）
  licenseUrl: https://opensource.org/license/mit
  evidence: 2025-05-29 旧镜像快照；唯一 Image pass 顶部明确标注 MIT；1414 likes / 103929 views
preview:
  poster: /previews/star-nest.webp
  loop: /previews/star-nest.webm
  alt: 深褐黑色宇宙中密集的金蓝星点和云雾向画面深处延伸
---

## 先看见什么

画面像一片没有边界的星云：近处有明亮、温暖的尘埃，远处是成簇的蓝白星点；视角缓慢漂移时，亮点不是贴在一张背景图上，而是显出前后层次。它们全部来自同一个很短的分形迭代式，没有纹理、粒子系统或三维模型。

## 一步一步拆开

### 1. 从屏幕像素发出一条视线

先把 `uv` 移到画面中心，并按宽高比修正 y 轴，再把它与 z 方向组合成一条视线。鼠标位置会改变两次二维旋转的角度，所以移动指针并不是拖动一张星空贴图，而是在分形空间里转头。

### 2. 把无限空间折回一个小单元

每个采样点先经过 `mod` 周期重复，再用 `abs(tile - value)` 镜像折叠。远处不同位置因此不断落回相似的局部结构；这一步负责制造星团在空间中反复出现的“大尺度秩序”。

```ts
point.assign(abs(vec3(tile).sub(mod(point, vec3(tile.mul(2))))));
```

### 3. 用 Kaliset 迭代制造细节

折叠后的点连续执行 17 次 `abs(p) / dot(p, p) - 0.53`。倒数会把靠近原点的区域剧烈放大，绝对值再把各象限折叠到一起。程序并不直接使用最终坐标，而是累加相邻两次 `length(p)` 的变化量；轨迹越不稳定，那里越像一团高能星尘。

### 4. 沿视线积累二十层星雾

外层循环把采样深度从 `0.1` 推到 `2.0`。每层都把分形活动量的三次方写进颜色，并让 R、G、B 使用 `s`、`s²`、`s⁴` 三种深度权重，于是近远样本自然分色，而不是套用一张调色板。

```ts
activity.assign(activity.mul(activity).mul(activity));
const depthColor = vec3(
  sampleDepth,
  sampleDepth.mul(sampleDepth),
  sampleDepth.mul(sampleDepth).mul(sampleDepth).mul(sampleDepth),
);
accumulated.addAssign(depthColor.mul(activity).mul(brightness).mul(0.0015).mul(fade));
```

### 5. 衰减决定“星”与“雾”的比例

每走一层，`fade` 都乘以 `0.73`；第七层之后，低活动区域还会被 `darkMatter` 进一步压暗。最后在灰度能量与深度彩色之间混合，就同时得到细亮星点、柔和雾带和清晰的纵深。

## 可以亲手试什么

- **漂移速度**：控制视点穿行速度；放慢后更容易辨认重复结构。
- **视野缩放**：改变视线张角，观察星巢从密集核心变为开阔星场。
- **折叠尺度**：改变空间重复单元，最直接地重组星团分布。
- **星云亮度**：放大活动量的发光贡献，不改变分形本身。
- **色彩分离**：在灰度星雾和按深度分离的彩色星云之间过渡。

## TSL 重写要点

TSL 版本用两个嵌套 `Loop` 保留原作 20 × 17 次迭代，并用 `toVar()`、`assign()`、`addAssign()` 表达采样点、活动量和颜色累积。指针被映射成围绕原作默认视角的小范围旋转；所有探索参数都是 uniform，不会因为拖动滑杆而重编译材质。

原始 GLSL、作者署名与 `License: MIT` 声明都保存在本案例目录。TSL 文件开头也再次明确标注原作作者和 MIT，避免把仓库的分层许可证误读成 Shadertoy 默认许可。

## 性能观察

每个像素固定进行 20 层体积采样，每层又有 17 次 Kaliset 更新，共 340 次分形迭代；它不访问纹理，但明显重于站内现有的二维案例。运行时会根据帧耗时自适应降低 DPR，移动端以约 30 fps 为目标；降低画质只减少像素数，不改变分形结构。

2026-09-05 本机基线使用 Ryzen 9 7950X3D、RTX 4080 SUPER 和无帧率上限的 headless Chromium，连续采样 120 帧：1440 × 900 下 WebGPU 平均 `6.05 ms`、强制 WebGL2 平均 `6.04 ms`；Pixel 7 的 412 × 915 视口以有效 DPR `1.5` 运行，WebGPU 平均 `6.04 ms`。这些数字用于以后发现相对性能回退；headless 与无上限计时不能代替真实屏幕的 60/30 fps 体验验收。

## 许可说明

原作唯一 Image pass 的源码顶部明确写有 `License: MIT`，因此该声明优先于 Shadertoy 的默认许可。本站保留 Pablo Roman Andrioli / Kali 的署名、原作链接和原始 GLSL 快照，TSL 改编也明确按 MIT 发布；中文赏析与本站生成的预览媒体仍按 CC BY-NC-SA 4.0 发布。

热度数据来自 `GabeRundlett/shadertoy-api-shaders` 的 2025-05-29 旧镜像提交：1414 likes、103929 views。本轮无法抓取当前 Shadertoy 页面，因此这些数值只作为历史选题证据，不代表当前状态。
