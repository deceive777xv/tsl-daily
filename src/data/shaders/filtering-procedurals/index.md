---
title: 远纹清晰
subtitle: 用相邻射线估算像素覆盖的纹理范围，让细密图案在远处也能稳定成像
description: Filtering procedurals 在同一个球面与拼色地面上对照单次取样和自适应过滤，展示怎样单独增加材质采样，避免重复求交与光照。
publishedAt: 2026-10-11
difficulty: 高级
caseType: 授权移植
tags:
  - 射线微分
  - 程序纹理
  - 自适应采样
  - 解析求交
source:
  title: Filtering procedurals
  author: iq / Inigo Quilez
  url: https://www.shadertoy.com/view/MdjGR1
  license: MIT（基于旧镜像中的显式声明）
  licenseUrl: https://opensource.org/license/mit
  evidence: 2024-10-05 初次下载；2025-05-29 镜像提交；2026-10-11 完整审阅；历史 216 likes / 55313 views，精确采样日期未知；唯一 Image pass 顶部含完整 MIT 声明
preview:
  poster: /previews/filtering-procedurals.webp
  loop: /previews/filtering-procedurals.webm
  alt: 金色球面与拼色地面被黑色分界线分成两半，右侧远处的细纹经过自适应过滤
---

## 先看见什么

球和地砖在两边是同一套几何、同一套光照。左侧每个像素只问一次“这个位置是什么颜色”，细纹缩到比像素还小时容易变成杂点；右侧先估算这个像素覆盖了多少纹理，再取几个样本求平均。环绕相机时，可以对照地砖远端与球面边缘的变化。

这次的目标是减少**程序纹理的走样**。它没有给整幅画面做超采样，也不会自动消除球体轮廓的一切锯齿。

## 一步一步拆开

### 1. 用方程直接找到球与地面

四个球和一个平面组成场景。射线为 `origin + t * direction`，方向已归一化；代入球方程后得到一元二次方程。判别式为正时，取较近的正根，再与地面的交点比较。

```ts
const offset = origin.sub(sphere.xyz);
const b = dot(direction, offset);
const h = b.mul(b).sub(dot(offset, offset).sub(sphere.w.mul(sphere.w)));
If(h.greaterThan(0), () => {
  distance.assign(b.negate().sub(sqrt(h)));
});
```

这里不需要 SDF 步进。求交函数返回距离、材质编号、球编号和遮蔽量；命中位置与法线供后面的材质和光照共同使用。

### 2. 把世界位置变成拼色地砖与颗粒

命中位置乘以默认尺度 64，得到程序纹理坐标。`floor` 找到格子编号，`fract` 找到格子内的位置；格子编号决定颜色，接缝来自两轴的 `smoothstep`。三维梯度噪声给砖面和球面添加细颗粒：八个格点各有一个伪随机方向，将它与局部偏移点积，再沿三轴插值。

增加纹理尺度会让一个像素覆盖更多细节。如果始终只取一个点，细节数量增加并不等于画面更清楚，反而会更容易闪烁。

### 3. 用旁边两个像素估算覆盖范围

中心射线已经找到表面。再生成向右一个像素、向上一个像素的射线，让它们与**命中点的切平面**相交。它们落到纹理坐标后，与中心坐标的差分别记作 `deltaX` 和 `deltaY`。

```ts
const planeOffset = dot(origin.sub(position), normal);
const positionX = origin.sub(directionX.mul(planeOffset.div(safeX)));
const deltaX = positionX.sub(position).mul(scale);
```

`safeX` 是相邻射线与法线的点积，接近零时加一个保留符号的保护下限。切平面是局部近似：球面边缘会放大这个覆盖范围，远处地面也会覆盖很多纹理格子。原作默认采用这条相邻射线路径，移植没有改成屏幕导数。

### 4. 只对材质多取几个点

每轴采样数是 `1 + floor(clamp(过滤范围 × 坐标差长度, 0, 上限 - 1))`。默认过滤范围 4、每轴上限 10，因此最密处最多有 100 个材质样本。样本沿像素覆盖的两个方向展开，在**线性材质颜色**上求平均。

```ts
Loop(
  { start: int(0), end: countY, type: 'int', condition: '<' },
  { start: int(0), end: countX, type: 'int', condition: '<' },
  ({ i: sampleY, j: sampleX }) => {
    const offset = deltaX
      .mul(float(sampleX).div(float(countX)))
      .add(deltaY.mul(float(sampleY).div(float(countY))));
    sum.addAssign(materialAt(coordinates.add(offset), material));
  },
);
```

采样上限设为 1 后，右侧也回到单次取样。它适合观察过滤究竟改变了什么。这里保留原作从覆盖区域起点开始的网格分布，没有添加随机抖动或时间累积。

### 5. 合并光照，再输出显示颜色

漫反射、背光、解析球影与遮蔽只计算一次，再与平均后的材质相乘。最后混入距离雾，执行原作 `pow(color, 0.4545)` 显示曲线。移植将显示颜色做 sRGB 解码，交给共享渲染器的 sRGB 输出，避免再编码一次。

黑线是原作的对照标记。分界设为 0 或 1 时隐藏标记，可全屏查看过滤或单次取样。原作按下鼠标改变分界；本站通过明确的参数滑块操作，移动端也能比较。

## 可以亲手试什么

- **动画速度**：相机绕中心球旋转，观察细纹随距离变化；零值回到原作第 7 秒。
- **纹理尺度**：增加表面细节密度，留意远处地砖是否出现杂点。
- **每轴采样上限**：从 1 增到 10，比较过滤收益与材质计算成本；总上限是它的平方。
- **过滤范围**：决定坐标差要换成多少样本，默认 4；它不是模糊半径，也不改变几何。
- **对照分界**：左侧单次取样、右侧自适应过滤；0 和 1 可切换两种全屏观察。

## 性能观察与验证边界

求交只检查四个球与一个平面，但程序噪声会访问八个格点；在最多 100 个样本的区域，材质仍可能很贵。这个方法节省的是反复求交与光照的成本，**不保证总开销恒定**。远处、高纹理尺度和较大的过滤范围都可能增加采样数。共享运行时会通过降低 DPR 控制帧负担；减少动态偏好默认展示海报，用户可手动播放。

实际后端、浏览器测试、媒体与本机基线记录在同目录 `VALIDATION.md`、`performance.json`。RAF 间隔是调度观察，不是 GPU 时间戳或真实手机性能。隐藏暂停的受控事件结果与原生后台标签页能力分别记录；自动化环境若始终报告 `document.hidden=false`，就不宣称原生后台验证通过。

## 来源与许可

[Filtering procedurals — iq / Inigo Quilez（MdjGR1）](https://www.shadertoy.com/view/MdjGR1) 的固定旧镜像来自 GabeRundlett/shadertoy-api-shaders，提交 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`。README 记载下载于 2024-10-05，文件提交于 2025-05-29；历史 **216 likes / 55313 views** 的精确采样日期未知。

2026-10-11 已完整审阅唯一 Image pass 的 350 行与元数据：零外部输入，顶部明确含 **MIT / Copyright © 2013 Inigo Quilez**，未发现额外限制或第三方源码、素材引用。当前原作页面返回 HTTP 402，未核验当前版本。原作与 TSL 改编遵循此固定快照中的显式 MIT；这不适用于 iq 的其他作品。中文赏析与生成媒体 CC BY-NC-SA 4.0，框架 MIT，站点永久非商业。
