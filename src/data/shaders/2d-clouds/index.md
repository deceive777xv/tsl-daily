---
title: 晴空云絮
subtitle: 用三角格噪声、折脊与分层遮罩，在一个平面上画出流动白云
description: 2D Clouds 把有正负的噪声与取绝对值的噪声相乘，再用独立细节控制云色。没有体积采样和外部纹理，也能形成蓬松的白云边缘。
publishedAt: 2026-09-19
difficulty: 进阶
caseType: 授权移植
tags:
  - Gradient Noise
  - fBM
  - Ridged Noise
  - Domain Warp
source:
  title: 2D Clouds
  author: drift
  url: https://www.shadertoy.com/view/4tdSWr
  license: CC BY-NC-SA 3.0（基于旧镜像快照的默认许可判断）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 2024-10-05 下载、2025-05-29 提交的 API 镜像；858 likes / 83564 views，指标精确采样日期未知；2026-09-19 审阅
preview:
  poster: /previews/2d-clouds.webp
  loop: /previews/2d-clouds.webm
  alt: 蓝天上铺开带有柔软灰影与细碎边缘的白云
---

## 先看见什么

蓝色天空从地平线方向的浅蓝渐变到高处的深蓝，白云边缘细碎，内部有柔和的灰影。云团缓慢漂移，也在局部改变形状。你看见的厚度来自二维颜色与遮罩，并没有一层真正占据三维空间的体积云。

这很适合从 JavaScript 进入 Shader：每个像素只需要一个坐标，重复调用噪声函数，再把几个标量组合成 RGB。与「玫瑰噪流」共有 fBM 和 Domain Warp 的思路；本例换用三角格梯度噪声，并把形状、折脊和颜色细节拆开，目标是自然白云。

## 一步一步拆开

### 1. 让三个角点贡献连续的梯度噪声

先把二维坐标斜切到三角形网格，再计算像素相对于三个顶点的位移 `a`、`b`、`c`。每个顶点通过 hash 得到一个二维梯度，位移与梯度做点积，便得到有正有负的贡献。

`max(0.5 - dot(a, a), 0)` 决定顶点影响范围，连续乘四次让贡献在边缘平滑归零。三个角点相加，就是后续各层复用的标量噪声。这里的 hash 是确定性的伪随机函数；原作使用 `sin` 加 `fract`，不同 GPU 的浮点三角运算可能让细节略有差异。

```ts
const h = max(vec3(0.5).sub(vec3(dot(a, a), dot(b, b), dot(c, c))), 0);
const contributions = vec3(
  dot(a, gradient(cell)),
  dot(b, gradient(cell.add(corner))),
  dot(c, gradient(cell.add(1))),
);
return dot(h.mul(h).mul(h).mul(h).mul(contributions), vec3(70));
```

### 2. 用七层 fBM 轻轻扭曲坐标

fBM 是多尺度噪声的加权和。每一层把坐标旋转并放大两倍，权重乘以 `0.4`。七层得到的 `q` 并不直接作为最终颜色，而是从后续采样坐标的两个分量中减去：云团因此有局部变化，而不是整张纹理匀速平移。

```ts
const q = warpNoise(base.mul(0.5));
const shapePosition = base.sub(q).add(time);
```

原作的矩阵乘在向量左侧。移植时展开成 `x' = 1.6x - 1.2y`、`y' = 1.2x + 1.6y`，避免把列主序矩阵误当成右乘而反转旋转方向。TSL 的 `toVar()` 保存循环状态，`assign()` 在 GPU 循环内更新；普通 JavaScript 赋值不能表达同样的逐像素迭代。

### 3. 把带符号的噪声和折脊信号组合成云形

形状分两路。`r` 对每层噪声取绝对值，把负谷折回正半轴，形成折脊；`f` 保留正负，让云形有空隙。两路各叠八层，但权重衰减不同。

```ts
const r = ridgeShape(shapePosition, time).toVar();
const f = signedShape(shapePosition, time).toVar();
f.mulAssign(r.add(f));
```

`f * (r + f)` 是视觉塑形，不是物理密度方程。可以把它理解为让粗糙边缘影响另一张柔和噪声图：既保留蓝天的空洞，也让白云边缘有层次。

### 4. 让形状与颜色细节各司其职

另外两组七层噪声在两倍、三倍尺度上采样，并以不同速度演化，合成颜色细节 `detail`。云层颜色使用略偏暖的白色，亮度来自固定底值与细节信号；这不是法线、太阳方向或散射计算。

遮罩由云量偏移、形状放大以及细节相加，再截断到零至一：

```ts
const mask = clamp(cover.add(alpha.mul(f).mul(r)).add(detail), 0, 1);
const display = mix(sky, clamp(sky.mul(0.5).add(cloud), 0, 1), mask);
```

因此「云层不透明度」不是材质的 alpha。最终像素始终不透明，这个参数影响蓝天与云色的内部混合。

### 5. 对齐坐标与显示颜色

横坐标乘宽高比，让横屏与竖屏中的噪声尺度保持一致。天空颜色沿纵向插值，云层覆盖在其上。原作输出是显示编码 RGB，运行版使用 `sRGBTransferEOTF` 解码一次，再交由渲染器输出 sRGB，避免重复编码导致画面发白。

默认尺度 `1.1`、云量 `0.2`、不透明度 `8`、细节明暗 `0.3` 与原作一致。初始时刻为原作第 2 秒。暂停后调参，可以更清楚地看见每个信号对同一幅云形的影响。

## 试着这样调

- 降低云量：看蓝天缝隙如何从边缘扩大。
- 增加云团尺度：这是采样频率，数值越大，云团看起来越小。
- 固定云量后调不透明度：观察边缘过渡和内部覆盖变化。
- 将细节明暗设为零：形状仍然存在，但独立的颜色细节减弱。
- 暂停后恢复默认参数，再播放：对照形状、色彩与速度的不同职责。

## 性能观察

单 pass、没有纹理访问，但并不意味着免费。默认每个像素执行 37 次三角格噪声采样：七层坐标扭曲、两组八层形状、两组七层颜色，每次噪声又需要三个梯度。像素数量与 DPR 会直接放大成本。TSL 使用带布局的 `Fn` 与固定上界 `Loop`，避免把所有循环展开成巨大的表达式。

本机 Ryzen 9 7950X3D / RTX 4080 SUPER 上，生产构建的桌面与移动模拟、WebGPU 与 WebGL2 四组采样均约 6.06ms，p95 6.1–6.2ms。每组预热三秒后采样 120 个 RAF 间隔；这衡量浏览器调度，不能当作 GPU 执行耗时或真实手机帧率。持续受控慢帧会使 DPR 从 1 降至 0.8。完整记录见同目录 `VALIDATION.md`、`performance.json` 和 `browser-evidence.json`。

降动效首屏海报与手动播放已通过验证。受控隐藏事件能停止 GPU 提交并恢复；但本机自动化浏览器在最小化、切换真实标签页时仍报告 hidden=false，因此真实后台暂停路径尚未验证，不能把事件模拟等同于真实切换通过。

## 来源与改编

[2D Clouds — drift](https://www.shadertoy.com/view/4tdSWr)。镜像仓库 GabeRundlett/shadertoy-api-shaders 记载下载于 2024-10-05，文件提交于 2025-05-29。858 likes / 83564 views 是历史指标，精确采样日期未知。本次于 2026-09-19 阅读完整单 pass 源码，未见自定义许可，按 **CC BY-NC-SA 3.0（基于旧镜像快照）** 判断；当前原作页面返回 HTTP 402，未核验当前版本。

用户明确批准此标题与 ID 后进行移植。保留原始 GLSL、原始镜像字节与 drift 署名；新增五个教学参数和显示颜色适配。无外部纹理、模型或音频。WebM 是浏览器实录加短首尾交叉淡化，原作噪声动画并非严格周期。完整许可及批准记录见 `LICENSE.md`。
