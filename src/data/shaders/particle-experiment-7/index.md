---
title: 青弧粒场
subtitle: 让一百个光点分组向外推进，用距离平方倒数织出青绿短弧
description: Particle Experiment 7 用极坐标放置解析粒子，以整数分组共享径向相位，再将每个光点的反距离贡献与颜色逐次混合，生成向外舒展的青绿色弧簇。
publishedAt: 2026-10-20
difficulty: 进阶
caseType: 授权移植
tags:
  - 解析粒子
  - 径向运动
  - 反距离辉光
  - 加权混色
source:
  title: Particle Experiment 7
  author: aiekick / Stephane Cuillerdier
  url: https://www.shadertoy.com/view/MddGWN
  license: CC BY-NC-SA 3.0（基于旧镜像中的显式声明）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 2024-10-05 初抓、2025-05-29 提交的固定旧镜像；完整唯一 Image pass 显式声明 CC BY-NC-SA 3.0，无输入；历史 110 likes / 35450 views，精确采样日期未知；2026-10-20 审阅并获批
preview:
  poster: /previews/particle-experiment-7.webp
  loop: /previews/particle-experiment-7.webm
  alt: 近黑背景中，青绿光点组成一簇簇短弧，中心光团向外缘逐渐散开
---

## 先看见什么

近黑的画面里，青绿色光点成组排成短弧：有的聚在中心，有的已经向外舒展。它们没有各自独立的运动速度；相邻编号共享一段相位，因此在同一半径上形成断续的圆弧。每个像素都重新计算这些粒子的位置，无需保存上一帧。

「星网之间」侧重网格邻点连线与多层视差，「熔彩流动」寻找三维球体的平滑表面。本例学习**二维解析粒子、整数分组和加权光场**。距离平方倒数的辉光也在既有案例中出现，这次重点是如何组织一百个光点，让位置、颜色与光强各司其职。

## 一步一步拆开

### 1. 给光点一个共同的二维舞台

先把屏幕中心移到原点，再以画面高度统一两轴尺度。取景尺度默认 6，对应原作的 `z`：

```ts
const point = uv().mul(2).sub(1).mul(resolution).div(resolution.y).mul(zoom).toVar();
```

横屏会容纳更多左右空间，竖屏保留同样的纵向范围，因此可能裁掉左右外缘。这是原作的取景方式。调大「取景尺度」相当于后退，光点会缩小；它与改变粒子运动范围是两件事。

### 2. 让相邻编号共享一段相位

粒子编号 `i` 是整数。原作以一个缓慢变化的正弦计算 `evolution`，截成整数后拿来做除数：

```ts
const groupSize = int(max(evolution, 1)).toVar();
const group = float(i.div(groupSize)).toVar();
const cycle = fract(
  time
    .add(5)
    .mul(0.51)
    .add(sin(group.mul(692.7398)).mul(48934.4238)),
).toVar();
```

假设 `groupSize` 为 8，整数除法会让编号 0–7 得到组号 0，8–15 得到组号 1。组号经过正弦和取小数产生固定的相位偏移，再由时间推动循环。`cycle` 从 0 走向 1 后回到 0，让光点反复从中心向外移动。

必须先完成**整数除法，再转为浮点数**。若先把 `i` 转成浮点数，每个粒子都会得到不同相位，短弧的分组关系就改变了。`groupSize` 随时间缓慢变化，但转换成整数时会跳级；这种分组改变属于原作动态。

### 3. 把组内光点排成一段圆弧

编号决定角度，同组共享的 `cycle` 决定半径：

```ts
const angle = float(i).mul(6.28).div(float(particleCount));
const center = vec2(cos(angle), sin(angle)).mul(cycle).mul(spread);
const relative = point.sub(center).toVar();
```

相邻编号拥有相邻角度，因此同半径的几个点自然连成短弧。角度常量保留原作的 **6.28**，没有替换为更精确的整圆常量。默认一百个粒子；「粒子数量」同时改变角度间隔和循环上限。「扩散范围」默认 4，对应原作名为 `duration` 的变量，它实际也决定径向外沿。

### 4. 累加光强，同时保持颜色的贡献比例

每个粒子产生一个随距离平方衰减的场：

```ts
const contribution = radius.div(max(dot(relative, relative), 0.000001)).toVar();
total.addAssign(contribution);
blendedColor.assign(mix(blendedColor, particleColor, contribution.div(total)));
```

这里名为 `radius` 的量是光场贡献系数，并非硬边圆盘的几何半径。它保留原作从 0.84 到 1.6 的插值，但插值系数是 `cycle / spread`，并不一定走完整个 0–1 区间；颜色也使用这个系数。因此不能把它误读成“每个粒子完整经历绿到蓝的生命周期”。

`total` 是已经见过的粒子贡献之和。每次以「新贡献 / 新总和」混合颜色，等价于逐次维护贡献加权的平均色。近处的光点权重大，远处的权重小；这不是简单地把一百种 RGB 相加。分母下限只避免正好落在光点中心时除零。

### 5. 分开控制色彩方向与显示亮度

循环结束后，原作先把总贡献除以粒子数，再归一化颜色，并用一段下降的三次曲线调整亮度：

```ts
const energy = total.div(float(particleCount)).toVar();
const hue = blendedColor.div(max(length(blendedColor), 0.000001));
const taper = float(1).sub(smoothstep(0, 1, clamp(energy, 0, 0.4)));
const displayRGB = clamp(hue.mul(energy).mul(taper).mul(glow), 0, 1);
```

颜色归一化保留 RGB 向量的方向，`energy` 负责强弱。原作先把用于曲线的值限制到 0.4，所以这段曲线**不会把高能量完全压回零**；明亮核心仍可能到达显示上限。TSL 显式写出 `1 - smoothstep(0, 1, x)`，避免使用原作上下界反转的 `smoothstep`。输出先经 `sRGBTransferEOTF` 解码，再交给共享渲染器做 sRGB 编码。

原作只写 RGB，本案例显示为不透明画布。默认重置对应原作第 7 秒；速度只改变后续时间推进。原来的鼠标覆盖由「取景尺度」「扩散范围」滑块替代，不加入鼠标悬停驱动。

## 可以亲手试什么

- **粒子数量**：从 24 加到 100，观察角度间隔、弧段密度与每帧循环成本一起变化；总贡献仍按数量平均。
- **扩散范围**：拉开运动外沿，同时观察颜色权重也会改变，这是原作 `duration` 同时参与两处计算的结果。
- **取景尺度**：保持运动参数不动，改变画幅容纳的范围，区分摄影取景与粒子运动。
- **辉光强度**：只调整最终亮度；暂停后可与位置变化分开比较。
- **扩散速度**：设置为零回到固定来源时刻，再恢复默认值观察短弧如何重新分组。

## 性能观察

每个像素默认遍历一百个粒子，计算角度、相位、距离与颜色权重；粒子数量直接决定循环次数。它没有粒子缓冲区，也没有少量顶点带来的传统粒子绘制优势。增加画布像素数和增加粒子数都会增加工作量；高 DPR 下可先降低画质，再比较粒子数的效果。

本机 Ryzen 9 7950X3D / RTX 4080 SUPER、Chromium 151 中，桌面 1440×900 与移动模拟 412×915 的 WebGPU/WebGL2 四组都在预热 3 秒后采样 120 个 RAF 间隔，平均约 6.06 ms、P95 约 6.1 ms。WebGPU 实际使用 nvidia/lovelace 非回退适配器。以上是浏览器调度间隔，不能当作 GPU 时间或真实手机性能。

移动自动 DPR 达到 1.5；另外施加每帧 45 ms、130 帧的受控主线程负载，DPR 从 1 降至 0.8，用于验证画质反馈路径。减少动态偏好下先显示海报，手动播放再启动后端。受控隐藏事件期间提交计数保持不变，恢复后继续增长；本环境真实第二标签页置前时仍报告 `document.hidden=false`，因此**原生后台标签页暂停尚未验证**。

相同 1440×900、第 7 秒的原始 GLSL 与 TSL WebGL2 平均 RGB 字节差约 0.0171，最大差 237；WebGPU 与 WebGL2 平均约 0.0158，最大差 237。整体弧段与光晕一致，少量亮点核心存在稀疏差异，不宣称逐像素相同。完整数值、参数恢复与移动视口记录见 [验证档案](https://github.com/deceive777xv/tsl-daily/blob/main/src/data/shaders/particle-experiment-7/VALIDATION.md)。

## 来源与改编

原作 **Particle Experiment 7 — aiekick / Stephane Cuillerdier（MddGWN）**，唯一 79 行 Image pass，无外部输入；源码明确声明 CC BY-NC-SA 3.0。许可判断基于 2024-10-05 初抓、2025-05-29 提交的旧镜像快照，2026-10-20 完整审阅并获用户批准；历史 110 likes / 35450 views 的精确采样日期未知。当前原作页面返回 HTTP 402，没有绕过访问控制，也未核验作者当前说明。

原始 JSON 与 GLSL 按字节保存。TSL 保留默认一百粒子、整数分组、相位常量、角度、位置与加权混色；增加有限分母保护、显式下降曲线、显示范围约束和五个教学参数。海报与短循环来自实际 TSL 画布；预览片段往返剪辑只影响媒体。署名、许可与修改说明见 [许可证档案](https://github.com/deceive777xv/tsl-daily/blob/main/src/data/shaders/particle-experiment-7/LICENSE.md)。站点永久非商业，合并 PR 是最终发布批准。
