---
title: 金线分域
subtitle: 先找到最近的特征点，再沿两点的垂直平分线计算细胞边界距离
description: Voronoi - distances 用两轮邻域搜索生成金色细胞边界与灰色等距纹，展示为什么到特征点的距离和到细胞边界的距离是两回事。
publishedAt: 2026-10-13
difficulty: 进阶
caseType: 授权移植
tags:
  - Voronoi
  - Worley
  - 边界距离
  - 等距线
source:
  title: Voronoi - distances
  author: iq / Inigo Quilez
  url: https://www.shadertoy.com/view/ldl3W8
  license: MIT（基于旧镜像中的显式声明）
  licenseUrl: https://opensource.org/license/mit
  evidence: 2024-10-05 初次下载；2025-05-29 镜像提交；2026-10-13 完整审阅；历史 575 likes / 122212 views，精确采样日期未知；唯一 Image pass 顶部含完整 MIT 声明；使用源码自带程序哈希替代输入贴图
preview:
  poster: /previews/voronoi-distances.webp
  loop: /previews/voronoi-distances.webm
  alt: 金色多边形边框围住灰色等距条纹，橙色特征点移动时细胞形状随之改变
---

## 先看见什么

金色线条把画面分成不规则多边形，每个区域里有一个橙色点。点位移动，邻接关系和边框也跟着变化；灰色条纹沿边界一层层向内收缩。条纹并非以橙点为圆心的圆环，它们显示的是**到最近细胞边界的距离**。

Voronoi 分区的规则很直接：把每个像素交给离它最近的特征点。本例在这条规则之后再走一步，找到当前像素离分区边缘还有多远。这使边框宽度和内部条纹拥有同一个几何依据。

## 一步一步拆开

### 1. 给每个整数格子放一个特征点

`floor` 得到格子编号，`fract` 得到像素在格子中的局部坐标。哈希函数将格子编号映射为两个 `[0, 1)` 数值，作为点位的相位。原作已有这段程序哈希作为贴图方案的替代代码；本移植按用户批准的方案启用它，不请求原噪声图片。

```ts
const seed = fract(
  sin(vec2(dot(cell, vec2(127.1, 311.7)), dot(cell, vec2(269.5, 183.3)))).mul(43758.5453),
);
const animated = sin(time.add(seed.mul(6.2831)))
  .mul(0.5)
  .add(0.5);
```

同一格子总能重建同一组相位，因此动画不会每帧重新抽签。正弦将点限制在自己的格子内；两个分量拥有不同相位，会画出不同的运动轨迹。正弦哈希会放大浮点差异，它适合这份来源的复现，并不保证不同 GPU 得到逐像素一致的结果。

### 2. 第一轮搜索：记住最近的点在哪里

检查当前格子周围的 `3 × 3` 邻域。`neighbor + offset - fraction` 是从像素指向候选点的向量，点积 `dot(r, r)` 是距离平方。比较平方距离即可判断远近，不必每次开平方。

```ts
If(squared.lessThan(nearestSquared), () => {
  nearestSquared.assign(squared);
  nearestVector.assign(candidate);
  nearestCell.assign(neighbor);
});
```

除了最小距离，还要保存胜出格子和指向该点的向量。若直接把最近点距离用于着色，会得到围绕点的距离变化；它还没有告诉我们两块细胞在哪里交界。

### 3. 第二轮搜索：把两点之间的平分线变成距离

两点距离相等的位置是一条垂直平分线。设从像素指向最近点的向量为 `a`，指向另一个候选点的向量为 `b`：`(a + b) / 2` 指向两点的中点，`normalize(b - a)` 是平分线的单位法向。两者的点积就是像素到这条线的有符号距离。

```ts
const separation = candidate.sub(nearestVector);
If(dot(separation, separation).greaterThan(0.00001), () => {
  const midpoint = nearestVector.add(candidate).mul(0.5);
  distance.assign(min(distance, dot(midpoint, normalize(separation))));
});
```

围绕胜出格子检查 `5 × 5` 邻域，并取最小值，就得到原作使用的细胞边界距离。需要跳过最近点自身，否则 `b - a` 为零，无法归一化。这里保留原作的有限搜索窗口和 `0.00001` 排除阈值；这是这份网格点位构造的实现，不是任意点集的完整 Voronoi 算法。

### 4. 用同一份边界距离画边框和等距纹

距离接近零的地方属于细胞边缘。`smoothstep(width, 1.75 × width, distance)` 把金色边框平滑混入灰色内部。默认宽度 `0.04` 对应原作的 `0.04 → 0.07` 过渡。

```ts
const gray = distance.mul(sin(distance.mul(contours)).mul(0.5).add(0.5));
const color = mix(gold, vec3(gray), smoothstep(border, border.mul(1.75), distance));
```

条纹的间距由边界距离控制，所以会跟随多边形的边缘收缩。边框宽度以细胞坐标为单位；增大细胞密度时，同一宽度占用的屏幕像素会变少。`smoothstep` 提供了过渡，但高频条纹仍可能走样，本例没有增加全屏超采样。

### 5. 标出特征点，观察分区怎样随它移动

第一轮留下的最近点向量还可以用于画橙色标记：它的长度越小，像素越靠近特征点。点位运动参数在固定哈希点和正弦动画之间插值；归零后，动画时间仍推进，分区却保持静止。

原作直接输出显示颜色。TSL 实现先裁剪到 `[0, 1]`，再通过 `sRGBTransferEOTF` 解码，由共享渲染器执行 sRGB 输出，避免第二次编码改变灰色条纹的亮度。五个参数的默认值在静止重置时对应源码程序哈希版本的第 7 秒。

## 可以亲手试什么

- **动画速度**：观察细胞的边数怎样随点位运动变化；零值回到第 7 秒。
- **细胞密度**：增大到 16，比较更细的边界与更高的屏幕纹理频率。
- **边框宽度**：从细线到宽边，留意它怎样挤占内部等距纹。
- **等距线频率**：只改变距离到亮度的映射，不改变细胞几何。
- **点位运动**：从 1 拉到 0，对照运动的分区与固定随机分区。

## 性能观察与验证边界

每个像素执行两轮搜索，共 9 与 25 次候选查询；第二轮还包含归一化。增加密度不会增加循环次数，却会让同一像素覆盖更多细节。提高 DPR 则会直接增加需要计算的像素数。减少动态偏好默认展示海报，用户仍可手动播放；共享运行时根据帧负担调整 DPR。

本机性能、两种后端、参数变化与恢复、媒体和来源对照记录在同目录 `VALIDATION.md`、`performance.json` 和 `reference-comparison.json`。RAF 间隔是浏览器调度观察，不是 GPU 时间戳或真实手机测试。受控隐藏事件与原生后台标签页能力分别记录；若自动化环境始终报告 `document.hidden=false`，就不宣称原生后台暂停已验证。

## 来源与许可

[Voronoi - distances — iq / Inigo Quilez（ldl3W8）](https://www.shadertoy.com/view/ldl3W8) 的固定旧镜像来自 GabeRundlett/shadertoy-api-shaders，提交 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`。README 记载初次下载于 2024-10-05，文件提交于 2025-05-29；历史 **575 likes / 122212 views** 的精确采样日期未知。

2026-10-13 完整审阅唯一 Image pass 的 102 行和元数据，顶部包含 **MIT / Copyright © 2013 Inigo Quilez**，未发现附加限制或第三方源码引用。原作有一个噪声贴图输入；其单独授权未核验，所以本例使用原源码已经提供的程序哈希，不下载或托管该图片。这会改变具体点位布局，保留两轮边界距离算法与绘制方法。原始快照保持不变，不能把程序哈希版截图称为未改动原作的截图。

用户于 2026-10-13 明确批准该标题、ID 与替代方案。当前原作页面返回 HTTP 402，未核验当前版本；原作及 TSL 改编遵循此固定快照的显式 MIT，不适用于 iq 的其他作品。中文赏析与生成媒体采用 CC BY-NC-SA 4.0，框架 MIT，站点永久非商业。
