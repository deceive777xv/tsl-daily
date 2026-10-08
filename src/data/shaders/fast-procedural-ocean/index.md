---
title: 逐波海面
subtitle: 从一条指数波开始，用导数拖拽长出细碎的海浪
description: Very fast procedural ocean 不依赖噪声或贴图，而是沿不同方向叠加指数波，用逐层坐标拖拽、有限差分法线和天空反射构造海面。
publishedAt: 2026-10-08
difficulty: 高级
caseType: 授权移植
tags:
  - 指数波叠加
  - 导数坐标拖拽
  - 高度场求交
  - 有限差分法线
  - Fresnel 反射
source:
  title: Very fast procedural ocean
  author: afl_ext
  url: https://www.shadertoy.com/view/MdXyzX
  license: MIT（基于旧镜像中的显式声明）
  licenseUrl: https://opensource.org/license/mit
  evidence: 2025-05-29 固定镜像，源码顶部 afl_ext 2017–2024 / MIT；历史 818 likes / 199459 views，精确采样日期未知；ACES 上游另行归档
preview:
  poster: /previews/fast-procedural-ocean.webp
  loop: /previews/fast-procedural-ocean.webm
  alt: 清蓝天空下，低处的太阳在深蓝海面投下细碎亮斑，近处的波峰与暗谷交错，远处波浪逐渐变得平缓
---

## 先看见什么

这片海没有贴图，也没有实际的水面网格。近处是细碎的蓝色波峰与暗谷，远处的纹理逐渐收敛成平缓的地平线；太阳在天空移动时，水面上的亮斑也随之变化。

Three.js 只负责一个覆盖视口的平面。每个像素先发出视线，再查询数学海面、估算法线、反射天空，最后得到颜色。原作名称中的 “Very fast” 是作者给作品的名称；本案例没有测量它相对其他海面算法的速度优势。

已有《海景》（Seascape）也讲海面、高度场和 Fresnel 反射，但它使用噪声扰动的波形与高度差夹逼求根。这里不采样噪声，重点是**指数波、导数驱动的坐标拖拽，以及高度差推进**。先理解这些不同的建模选择，再比较最终的海面观感。

## 一步一步拆开

### 1. 把一条正弦波变成窄峰、宽谷

设 `x` 是当前方向上的相位，`exp(sin(x) - 1)` 把正弦波压到约 `0.135…1`。数值一直为正，波峰相对集中，波谷比较宽。先只看这一条曲线，比直接面对整片海更容易理解。

```ts
const x = dot(direction, position).mul(frequency).add(phase);
const wave = exp(sin(x).sub(1));
const dragSignal = wave.mul(cos(x)).negate();
```

第二行描述高度，第三行提供拖拽信号。对相位 `x` 求导，得到 `exp(sin(x)-1) * cos(x)`；源码取它的负值。它**不是完整的空间梯度**：对空间坐标求导还需要频率和方向，且后续层还有坐标变换。这里沿用原作把相位导数当作形状控制的做法。

### 2. 每一层都拖动下一层的采样点

把许多方向的波直接相加，会看见过于规整的交叉条纹。原作在采样一层之后，沿当前方向移动坐标，再把这个新位置交给下一层。

```ts
point.addAssign(direction.mul(sample.y).mul(weight).mul(drag));
sum.addAssign(sample.x.mul(weight));
weights.addAssign(weight);
weight.mulAssign(0.8);
frequency.mulAssign(1.18);
timeMultiplier.mulAssign(1.07);
```

大波的权重较高；越往后，波越密、权重越低、时间速度略快。方向用 `sin(angle), cos(angle)` 生成，角度每层增加固定的大数。这是确定性的方向序列，没有随机纹理。最后用 `sum / weights` 归一化，避免增加层数时平均高度持续增长。

试着把“波形拖拽”降到 0，再恢复到 0.38。波仍存在，但相互牵连的皱褶会改变。“起始频率”则改变空间密度，时间速度与每层的相对频率增长保持独立。

### 3. 从水层上边界开始寻找交点

归一化的波值被映射为 `waves * depth - depth`，所以海面始终位于高度 `−depth` 与 `0` 之间。相机高于这个范围；朝下的视线先与高度 0 的平面相交，然后沿视线向前查询。

```ts
const height = waves(point.xz, int(12), time, drag, scale).mul(depth).sub(depth);
If(height.add(0.01).greaterThan(point.y), () => {
  distance.assign(length(point.sub(origin)));
  Break();
});
point.addAssign(direction.mul(point.y.sub(height)));
```

这里的 `point.y - height` 是**竖直高度差**，并不是到曲面的最短距离，因此这是一种实用近似，不能套用严格 SDF 的距离保证。最多推进 64 次；未命中时沿用上边界交点，保留原作的远处近似。

原始代码还求了下边界交点，用两个平面交点构造方向，但没有在下平面执行额外的终止判断。移植保留这个计算，只在两个截断交点几乎重合时改用视线，避免地平线附近归一化零向量；没有宣称这是严格的区间求根。天空像素跳过整个海面求交流程。

### 4. 用更细的波层计算反光

求交只使用 12 层波，法线默认使用 36 层。我们在交点左右各取一个很近的高度样本，把两条局部切线叉乘并归一化，得到表面朝向。这样交点较便宜，亮斑仍能包含细碎变化。

“法线层数”在 12 到 48 之间变化，只影响这部分查询，求交仍是 12 层。它适合观察几何定位与表面着色细节怎样分工；不是给整个海面增加真实顶点。层数越多，需要计算的指数、正弦、余弦越多。

原作还按交点距离把法线混向朝上的方向，压低远处过细的反光变化。这个混合结果没有再次归一化，移植也保持了这一视觉近似，不能把它描述成严格物理的法线或抗锯齿方案。

### 5. 让天空出现在水面，再压缩亮度

视线经过 `reflect(ray, normal)` 获得反射方向，向上查询程序化天空和高次幂太阳。越贴着海面看，Fresnel 近似越接近强反射；朝下看时则留下较弱的反射与一项蓝色散射近似。

```ts
const fresnel = pow(float(1).sub(max(0, dot(normal.negate(), ray))), 5)
  .mul(0.96)
  .add(0.04);
color.assign(reflection.mul(fresnel).add(scattering));
return sRGBTransferEOTF(acesDisplay(color.mul(2)));
```

天空、太阳、散射都来自简化公式，不是完整的大气或水下体积模拟。太阳和镜面亮斑的局部白色区域来自原作的亮度压缩；如果整张图都变白，才需要回查颜色范围与曝光。

`acesDisplay` 保留来源的输入矩阵、有理拟合、输出矩阵和 `1/2.2` 幂。GLSL 的 `mat3` 构造参数按列排列，移植用明确的行点积表达，避免矩阵转置。结果已经是原作的显示颜色，因此先解码到线性空间，再交给站点统一输出 sRGB；没有再叠加一套引擎 ACES 曝光。

## 参数怎么试

| 参数     | 建议观察                                     | 默认值 |
| -------- | -------------------------------------------- | ------ |
| 时间速度 | 0 冻结源时间；恢复后波浪、相机和太阳一起推进 | 1      |
| 波高范围 | 加深负高度范围，同时改变表面坡度             | 1      |
| 波形拖拽 | 0 与 0.38 对比直接叠加和逐层扭曲             | 0.38   |
| 起始频率 | 对比大波疏密，后续波层仍逐层乘 1.18          | 1      |
| 法线层数 | 对比细碎亮斑与计算成本，求交层数保持 12      | 36     |

默认从原作第 7 秒开始。拖动画面会改变相机方向；移动端保持同一默认俯仰角，去掉原作按绘制宽度 600 像素切换相机的分支，避免 DPR 改变构图。新增相机拖拽采用居中坐标和受限俯仰，不照搬 Shadertoy 的鼠标坐标语义。短循环的往返播放属于预览媒体编辑，交互画面仍按时间向前运行。

## 性能与验证怎么读

成本主要来自每个海面像素的多次波查询：最多 `64 × 12` 层求交，加上三次法线高度查询。实际常提前命中，天空像素直接走另一条路径。降低绘制分辨率通常比只降低法线层数影响更大；参数范围是教学范围，不是对任意极端频率和波高的求交准确性保证。

本站默认选择 WebGPU，并支持强制 WebGL2。减弱动态偏好先显示海报，用户点播放后才初始化 GPU；隐藏时暂停与自动 DPR 由公共运行时处理。本案例的实测数值、原始 GLSL 对照、桌面与移动视口结果记录在同目录 `VALIDATION.md`、`performance.json` 和 `browser-evidence.json`。RAF 间隔用于本机调度基线，不等于 GPU 执行时间或真实手机表现。

受控 `visibilitychange` 检查可以验证隐藏后停止 GPU 提交、恢复后继续。自动化浏览器切换标签页时仍报告 `document.hidden=false`，因此**原生后台标签页隐藏未验证**；没有把受控检查写成真实切后台证据。移动视口也来自桌面 GPU 上的浏览器模拟，不代表真实手机性能。

## 来源和许可

原作是 **Very fast procedural ocean — afl_ext（MdXyzX）**，主作源码顶部显式写有 `afl_ext 2017-2024` 和 `MIT License`。基于 2025-05-29 固定旧镜像，2026-10-08 抓取、完整检查唯一 Image pass；历史 **818 likes / 199459 views**，精确指标采样日期未知。当前原作页面返回 403，当前版本、许可和热度未复核。

主作自引用 **ACES Cinematic Tonemapping — afl_ext（XsGfWV）**，其独立示范没有自定义许可，按 **Shadertoy 默认 CC BY-NC-SA 3.0（基于旧镜像快照）** 单独归档。它的其他视觉代码没有移植。拟合矩阵与系数匹配 Stephen Hill 的 MIT 实现，保留 Baking Lab 的 MJP / David Neubelt 署名和完整通知；这是补充的代码匹配推断，原作并未直接署名 Hill。

2026-10-08 用户对完全相同的作品名与 ID 明确回复“批准”，接受该旧镜像证据继续制作一个案例。完整原始 GLSL、镜像、许可证和补充上游档案均随案例保留。TSL 改编及其海报、无声短片采用 MIT；中文原创赏析采用 CC BY-NC-SA 4.0。站点永久非商业，PR 合并由用户决定。
