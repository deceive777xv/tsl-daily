---
title: 逐格方境
subtitle: 把视线交给网格边界，用三个灰度看清体素空间
description: Branchless Voxel Raycasting 用三维 DDA 按格穿越程序化体素，以比较掩码选择推进轴，再按命中面朝向赋予灰度，构成旋转的阶梯空腔。
publishedAt: 2026-10-15
difficulty: 进阶
caseType: 授权移植
tags:
  - 体素遍历
  - 三维 DDA
  - 比较掩码
  - 布尔造型
  - 朝向着色
source:
  title: Branchless Voxel Raycasting
  author: fb39ca4
  url: https://www.shadertoy.com/view/4dX3zl
  license: CC BY-NC-SA 3.0（基于旧镜像快照）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 固定镜像初抓 2024-10-05、文件提交 2025-05-29；2026-10-15 全通道审阅并获批；历史 191 likes / 39540 views，指标采样日期未知；无自定义原作许可，上游 Lode 示例代码 BSD 两条款
preview:
  poster: /previews/branchless-voxel.webp
  loop: /previews/branchless-voxel.webm
  alt: 三种灰度的方块围出阶梯状球面和挖空方盒，相机环绕时显出空腔与各个面的朝向
---

## 先看见什么

白色的顶面、浅灰的侧面和较深的另一组侧面，共同围出一间由方块搭成的空间。中间的方盒被球挖空，远处的大球面也被网格切成阶梯。相机一边环绕，一边轻微升降，三种固定灰度就足以让空腔产生深度。

这里没有载入方块模型，也没有保存一张巨大的三维贴图。每个像素发出一条射线，程序不断问：“现在经过的这个格子是实体吗？”如果为空，就直接走到下一个网格边界。

已有「孔隙方城」按连续距离估计逐步接近分形表面；本例把空间先离散成格子，学习重点是 **怎样可靠地找到下一格**。标题里的 Branchless 特指选择推进轴时减少分支，整个程序仍有循环和命中判断。

## 一步一步拆开

### 1. 用球和方盒决定哪些格子被填满

先取当前格子的中心，再乘「体素边长」，还原成世界坐标。方盒距离与球的距离只用于判断这个中心是不是实体，最终只保留真或假：

```ts
const point = cell.add(0.5).mul(cellSize).toVar();
const edge = abs(point).sub(6);
const box = min(max(edge.x, max(edge.y, edge.z)), 0).add(length(max(edge, 0)));
const carvedBox = max(cavity.sub(length(point)), box);
const enclosure = float(25).sub(length(point));
return min(carvedBox, enclosure).lessThan(0);
```

`max` 把方盒和“球的外面”取交集，得到被挖空的方盒。最后的 `min` 再并上半径 25 大球外侧的实体，让镜头处在一个有边界的房间里。这里的负数表示实体，正数表示空；距离值没有拿去推进射线。

「体素边长」越小，曲面轮廓越细。球和方盒仍保持世界尺寸，所以它改变的是离散采样粒度。细网格会消耗更多格子的遍历预算，不保证所有参数组合都能在 64 次内走到实体。

### 2. 把相机与射线放进同一个网格

屏幕坐标映射到 -1 到 1，纵向再乘高宽比。「透视焦距」是射线的前向分量；增大它，视野就缩窄。相机与射线一起绕 y 轴旋转，镜头才会持续朝向场景中心。

```ts
const gridOrigin = origin.div(cellSize).toVar();
const cell = floor(gridOrigin).toVar();
const rayStep = sign(direction).toVar();
const delta = vec3(length(direction))
  .div(max(abs(direction), 0.000001))
  .toVar();
```

`floor` 给出起点所在的格子，`rayStep` 给出各轴朝正方向还是负方向走。`delta` 表示沿同一轴跨过相邻网格面的相对路程。所有轴共同带有射线长度这个因子；选择哪个轴先到达时，它不会改变比较结果。

网格坐标是整数值，但实现用浮点向量保存它，以统一后续向量运算。每次只加 -1、0 或 1。对平行于网格面的射线，用极小正数保护分母，避免原作可能出现的无穷值乘零；平行轴不会抢先成为下一次有效推进轴。

### 3. 比较三块边界，跳到最近的一块

`side` 保存起点到三个方向上第一块边界的相对路程。它同时考虑了起点在格子中的小数位置和射线朝向：

```ts
const side = rayStep.mul(cell.sub(gridOrigin)).add(rayStep.mul(0.5)).add(0.5).mul(delta).toVar();
```

接下来是原作的核心。把三个边界路程轮换，与另外两个分量的最小值比较，得到每个轴是否应该推进的 0/1 掩码：

```ts
mask.assign(step(side, min(side.yzx, side.zxy)));
side.addAssign(mask.mul(delta));
cell.addAssign(mask.mul(rayStep));
```

`step(edge, value)` 在 `value >= edge` 时返回 1，因此这里等价于原作 `lessThanEqual(side, min(...))`。下一次会到达哪块边界，就只增加相应轴的路程与格子编号。相等时可能有多个轴同时前进，保留了原作穿过棱或角的规则。

原始源码的一条注释写成选择 largest，但实际代码选择的是 **最小** 路程。阅读时应以比较式为准。TSL 用数值掩码表达相同规则，让 WebGPU 和 WebGL2 都能生成对应运算。

### 4. 遇到实体后，保留最后跨过的面

最多查询 64 个格子；当前格子为空时才推进。原作命中后执行 `continue`，使剩余迭代一直重复同一格，状态不再变化。移植在同一点 `Break()`，省去后续无操作迭代，并显式初始化掩码。

```ts
Loop(64, () => {
  If(occupied(cell, cellSize, cavity), () => {
    Break();
  });
  mask.assign(step(side, min(side.yzx, side.zxy)));
  side.addAssign(mask.mul(delta));
  cell.addAssign(mask.mul(rayStep));
});
```

最后一次推进的轴说明射线穿过哪种朝向的面。原作把 x 面设为 0.5、y 面设为 1、z 面设为 0.75；多个轴并列时，后写入的 z 优先，其次是 y。它没有求梯度法线，也没有光源、投影阴影或物理反射。

有限预算仍然是近似：如果走满 64 次还没命中，画面会沿用最后一次跨面的灰度。体素很细或透视很广时，应该留意这类边界，而不是把所有像素都理解为精确交点。

### 5. 让三个灰度成为可读的立体线索

「朝向对比」以 0.75 为中心缩放三种面的差异。默认 1 保留原作，设为 0 就把所有面压成相同灰度，读者可以直接看到立体感失去了什么：

```ts
const face = mix(float(0.5).add(mask.y.mul(0.5)), 0.75, mask.z);
const displayGray = clamp(face.sub(0.75).mul(contrast).add(0.75), 0, 1);
return sRGBTransferEOTF(vec3(displayGray));
```

原作输出的是屏幕显示灰度；共用渲染器会编码 sRGB，所以先把显示值解码成线性颜色，避免中灰被重复提亮。「环绕速度」控制相机相位，默认从原作第 2 秒开始；它没有推动体素本身运动。

## 试着调一调

先暂停动画，把「体素边长」从 1 改到 2，看球面如何变成更粗的阶梯；再恢复默认。把「挖空半径」从 7.5 增大，观察方盒剩下的角和边怎样消失。最后把「朝向对比」降到 0，再恢复到 1，区分几何轮廓与面的明暗各自承担的空间线索。

「透视焦距」较小时，更多外围球面进入视野；它改变投影，不改变球的半径。调整「环绕速度」后恢复默认，会重置参数与动画起点。

## 性能与边界

每个像素最多进行 64 次格子占用查询，每次只组合球与方盒公式；不需要贴图、反馈 Buffer 或音频输入。命中可提前结束。较小体素通常让一条射线穿过更多格子，但实际开销还与视角、后端和设备有关，不能仅凭 Branchless 名称断言更快。

本站默认 WebGPU，支持强制 WebGL2 后备、自适应 DPR、桌面与移动布局。系统要求减少动态效果时先显示静态替身，读者可主动播放；页面隐藏时暂停。本机桌面与移动模拟、两个后端各暖机 3 秒并观察 120 个 RAF 间隔，平均约 6.06 ms，P95 为 6.1–6.2 ms；这是浏览器调度间隔，不是 GPU 耗时或真实手机性能。受控 45 ms 主线程负载使 DPR 从 1 降到 0.8。

完整结果见本案例 `VALIDATION.md`、`performance.json` 和 `reference-comparison.json`。受控隐藏事件下，800 ms 内 GPU 提交数保持不变，恢复后继续提交；但真实切换标签页时，此环境仍报告 `document.hidden=false`，所以 **原生后台标签页暂停仍未验证通过**。受控事件通过不等于原生行为通过。

## 来源与改编

原作是 **Branchless Voxel Raycasting — fb39ca4（4dX3zl）**。固定旧镜像中只有一个 Image pass，零外部输入；历史 191 likes / 39540 views 的采样日期未知。镜像 README 初抓日期为 2024-10-05，文件提交日期为 2025-05-29，本次于 2026-10-15 完整审阅并获用户批准。当前原作页面未能通过浏览工具打开，未把旧计数或许可判断说成当前核验。

原作没有自定义许可，按用户批准的旧镜像流程采用 **CC BY-NC-SA 3.0（基于旧镜像快照）**；明确引用的 Lode Vandevenne 示例代码另保留 BSD 两条款许可，原作对 kzy 的优化建议致谢也一并保留。中文讲解为本站独立撰写，没有翻译或复制上游教程正文、插图。

完整 GLSL 与镜像按原始字节保存。TSL 新增五个教学参数、有限分母保护、确定性状态初始化和命中提前结束，默认几何、相机、推进掩码、并列规则与三档灰度沿用原作。框架 MIT，原创中文与本站生成媒体 CC BY-NC-SA 4.0；授权改编遵循来源许可，站点永久非商业。详见本案例 `LICENSE.md`。
