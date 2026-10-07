---
title: 霓虹山路
subtitle: 从三角格点的高度插值，走进反射着落日的程序化山路
description: another synthwave sunset thing 在单个程序化通道中组合三角高度场、射线求交、反射和距离雾，让霓虹网格延伸到条纹落日。
publishedAt: 2026-10-07
difficulty: 高级
caseType: 授权移植
tags:
  - 三角高度插值
  - 高度场求交
  - 有限差分法线
  - Fresnel 反射
  - 距离雾
source:
  title: another synthwave sunset thing
  author: stduhpf
  url: https://www.shadertoy.com/view/tsScRK
  license: CC BY-NC-SA 3.0（基于旧镜像快照）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 基于 2025-05-29 旧镜像快照；完整唯一 Image pass 无自定义许可、无外部输入；历史 248 likes / 352994 views，精确采样日期未知
preview:
  poster: /previews/synthwave-sunset.webp
  loop: /previews/synthwave-sunset.webm
  alt: 紫红夜空下，黄色条纹落日悬在地平线上，粉紫色三角网格沿着低平山路延伸，两旁地形缓缓起伏
---

## 先看见什么

一轮被横条切开的黄色太阳，紫红色天空，像霓虹灯管一样的三角边线。相机沿中央低平的通道前进，两侧的山坡起伏，远处网格逐渐融进地平线。

画面里没有实际的山体网格或贴图。Three.js 只画一个铺满视口的平面；每个像素在 TSL 中发出一条射线，寻找它与数学地形的交点，再计算那个位置的颜色。原作默认关闭音频采样，本案例沿用静音、无外部输入的范围。

Cyber Fuji 2020 用二维距离场和透视坐标拼出复古山景；这里的山路是具有高度、法线和反射方向的三维数学曲面。Seascape 用层叠波形形成连续海浪；这里强调三角平面的插值与边线。

## 一步一步拆开

### 1. 让屏幕坐标变成视线

把 UV 从 0–1 改成 -1–1，再用视口宽高比修正横坐标。视线的 z 分量固定为 `4 / 3`，归一化后就得到每个像素的方向。时间推进相机的 z 坐标，方向保持朝前，所以读者感觉自己走在山路中。

```ts
const screen = uv().mul(2).sub(1).toVar();
screen.x.mulAssign(resolution.x.div(resolution.y));
const origin = vec3(0, 1, time.mul(10).sub(20000));
const direction = normalize(vec3(screen, 4 / 3));
```

`-20000` 是原作选择的起始世界位置，用来落在特定随机地形段。它不是视距。时间从原作第 2 秒开始，以便海报、默认参数和原作参考画面能使用同一构图。

### 2. 给三角格点分配高度

先把水平坐标改写到斜网格中。`floor` 找出格点单元，`fract` 给出单元内位置；两分量之和是否超过 1，决定像素属于单元的哪一半三角形。

```ts
point.x.mulAssign(Math.sqrt(3 / 2));
point.y.subAssign(point.x.mul(0.5));
const fraction = fract(point);
const upper = dot(fraction, vec2(1)).greaterThan(1);
const da = select(upper, vec2(1).sub(fraction), fraction);
```

每个三角形的三个顶点用同一个 Hash 函数得到可重复的随机高度。再做分段线性插值，一个单元就成为两个平面。`smoothstep(1, 8, abs(point.x))` 让中央格点趋近平坦，形成通道；时间只调制顶点高度，同一格点不会每帧重新抽取随机数。

插值函数同时返回一个三角边界距离的近似量。颜色阶段用它画边线，因此无需生成线段、额外 Draw Call 或 Bloom。

### 3. 沿射线寻找地形

地形函数返回当前位置的 y 坐标与插值高度之差：大于零表示点在曲面上方。射线沿这个高度差的一半前进，在足够接近曲面时停止。

```ts
const sample = field(point, time, height);
distance.addAssign(sample.x.mul(0.5).div(max(height, 1)));
If(abs(sample.x).lessThan(distance.mul(0.003)), () => {
  hit.assign(vec2(distance, sample.y));
  Break();
});
```

这个高度差不是严格的欧氏 SDF，不能直接套用“步长等于最近表面距离”的结论。原作采用半步推进；教学参数把山坡加高时，进一步缩短步长以减少穿过曲面的机会。默认高度为 1 时，步长与原作一致。

停止阈值随射线距离增长，远处允许更大的误差；150 单位视距和最多 500 次迭代限制最坏成本。高度场的边线仍是数学遮罩，不代表真正增加了几何顶点。

低地形仍然需要保留相机下方的路面。求交上界使用 `2 * max(height, 1)`，避免高度参数小于 0.5 时，相机一开始就被判定为越界。这个边界是退出搜索的优化，不能随着地形缩小而穿过相机。

### 4. 用坡度和反射说明表面朝向

在交点和三个相邻位置采样高度差，通过有限差分估计法线。法线与光线方向的点积给出明暗；`reflect` 则告诉我们表面朝哪个天空方向看。

```ts
const reflected = sky(reflect(direction, normal), time, sunSize, float(1));
const fresnel = pow(max(float(1).add(dot(direction, normal)), 0), 5)
  .mul(0.95)
  .add(0.05);
surface.assign(mix(surface, reflected, fresnel));
```

这是一种 Schlick 风格的 Fresnel 近似：掠射角下更强地混入天空，正面更多保留地形底色。它帮助画面呈现湿亮的复古质感，但不是完整的能量守恒材质。

### 5. 把边线、雾和落日合成

三角边界处改用粉紫色。距离雾按 RGB 通道分别衰减，所以网格逐渐融入紫红天空，远近关系同时来自透视缩小与颜色变化。

```ts
const edge = float(1).sub(smoothstep(0, 0.05, hit.y));
surface.assign(mix(surface, vec3(0.8, 0.1, 0.92).mul(glow), edge));
const fog = exp2(vec3(-0.14, -0.1, -0.28).mul(hit.x).mul(fogDensity));
const skyColor = vec3(sky(direction, time, sunSize, float(0)));
color.assign(skyColor.mul(vec3(1).sub(fog)).add(surface.mul(fog)));
```

太阳由视线方向到太阳方向的距离画成圆盘，再由竖直方向的正弦遮罩切出条纹。天空星点来自四层程序化网格。原作的反向 `smoothstep` 被等价改写成 `1 - smoothstep(低阈值, 高阈值, x)`，使 WGSL 与 GLSL 都使用定义明确的阈值顺序。

原作直接输出显示用 RGB。TSL 使用 `sRGBTransferEOTF` 把它转换到线性颜色，再由站点统一输出 sRGB，避免把同一颜色重复编码。CineShader 的深度 alpha 不用于本案例显示。

## 可以怎样探索

| 参数     | 观察重点                                         |
| -------- | ------------------------------------------------ |
| 行进速度 | 相机前进与格点起伏的节奏；0 固定在起始构图       |
| 地形高度 | 三角平面怎样从平地变成坡面，以及法线如何改变反射 |
| 网格亮度 | 边线强度与地形本身的区别                         |
| 太阳大小 | 圆盘角半径怎样改变地平线构图                     |
| 雾密度   | 远处地形怎样消失，颜色如何制造纵深               |

暂停后仍可改变参数，便于比较同一个时刻。恢复默认参数重置五个数值与时间。没有启用原作的音频可视化、立体视图或其他编译开关。

## 性能观察

主要成本来自每个像素的高度场求交、四次法线采样和程序化天空。500 次是上限，不是每个像素都会跑满的固定次数；改变网格亮度或太阳大小不会增加通道数量。降低 DPR 会同时减少这些像素计算。

本机 Windows、Ryzen 9 7950X3D / RTX 4080 SUPER、Chromium 151.0.7922.34，在预热约 3 秒后采样 120 个 RAF 间隔：

| 视口与画布                      | WebGPU 平均 / p95 | WebGL2 平均 / p95 |
| ------------------------------- | ----------------: | ----------------: |
| 桌面 1440×900，画布 1440×900    |     6.06 / 6.2 ms |     6.06 / 6.1 ms |
| 移动模拟 412×915，画布 618×1372 |     6.06 / 6.1 ms |     6.06 / 6.1 ms |

RAF 间隔只能描述浏览器调度，不能当作 GPU timestamp 或实体手机性能。受控约 45ms 主线程负载使自适应 DPR 从 1 降到 0.8；移动模拟的实际 DPR 上限为 1.5。

开启系统减少动态效果时先展示海报，再由读者主动播放。受控隐藏事件下 GPU 提交暂停并在恢复后继续；本机自动化浏览器切换标签和最小化窗口仍报告页面可见，真实后台隐藏行为未获验证。完整原始结果和限制记录在 `performance.json` 与 `VALIDATION.md`。

## 原作与许可

[another synthwave sunset thing — stduhpf](https://www.shadertoy.com/view/tsScRK)。固定镜像来自 GabeRundlett/shadertoy-api-shaders：README 记载初次下载于 2024-10-05，文件提交于 2025-05-29；248 likes / 352994 views 是历史数值，精确采样日期未知。2026-10-07 检查了完整唯一 Image pass，未见自定义许可或上游署名，按 **CC BY-NC-SA 3.0（基于旧镜像快照）** 判断。当前原作页面抓取返回 HTTP 402，未核验当前版本或热度。

用户在 2026-10-07 明确批准这个标题与 `tsScRK`，同意按该镜像证据继续。原始 GLSL、TSL 改编与生成预览遵循来源 CC BY-NC-SA 3.0；独立中文赏析采用 CC BY-NC-SA 4.0，框架 MIT，网站永久非商业。完整证据见 `LICENSE.md`。
