---
title: 墨光双流
subtitle: 黑白方块沿相反方向流动，用尺寸、速度与柔光描出前后层次
description: 将 movAX13h 的 I/O 改编为无音乐黑白版本，用圆角矩形距离、随机深度与加法柔光解释二维视差。
publishedAt: 2026-09-15
difficulty: 入门
caseType: 授权移植
tags:
  - 圆角矩形距离
  - 分层视差
  - 加法辉光
  - 伪随机分布
source:
  title: I/O
  author: movAX13h
  url: https://www.shadertoy.com/view/XsfGDS
  license: CC BY-NC-SA 3.0（基于旧镜像的默认许可判断）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 2025-05-29 旧镜像唯一 Image pass 无自定义许可；224 likes / 27957 views 为历史指标；用户批准黑白无音乐改编
preview:
  poster: /previews/io-monochrome.webp
  loop: /previews/io-monochrome.webm
  alt: 黑色背景上的两列灰白圆角方块沿相反方向流动，较近的方块更大、更亮，边缘带有柔和光晕
---

## 先看见什么

黑色背景上，两列灰白方块朝相反方向穿行。近处的方块更大、更亮、移动更快，远处的方块细小而暗淡。它们没有真实三维位置，但眼睛会把这些线索合成前后层次。

原作 **I/O — movAX13h（2013）** 在左右两侧使用粉红和青蓝色，并让音乐振幅驱动柔光。本例按用户批准的方向统一为黑白，以“亮度脉冲”滑块替代声音输入。滑块只提供一个手动数值，不自动分析音乐，也不请求原作音轨。原作 GLSL 快照保持原样，方便对照改编前后的计算。

与「菱波交织」的规则网格相位不同，这里每个方块拥有独立的随机深度和运动周期；与「镜间流光」的镜头鬼影不同，这里的光来自移动矩形的轮廓与重叠。

## 一步一步拆开

### 1. 先让两个坐标轴使用相同的尺度

UV 的两个方向都在 0 到 1 之间，但屏幕不一定是正方形。中心归零后，让横坐标乘宽高比，圆角才不会被拉成椭圆。

```ts
const aspect = resolution.x.div(resolution.y);
const fit = aspect.lessThan(1).select(aspect, 1);
const p = uv().sub(0.5).mul(vec2(aspect, 1)).div(fit);
```

桌面以画面高度为单位。竖屏时额外除以宽高比，把双列构图缩到屏幕宽度内；形状仍保持比例，垂直方向会留出更多空间。这样不会把整幅宽屏图硬压成窄图。

### 2. 给每个方块一张固定的“身份卡”

原作把 sin 乘大常数后取 fract 得到伪随机值，这会放大微小浮点误差。本例使用 Three.js 内建的整数 hash，以循环编号作为种子，得到可重复的伪随机值。深度因子 z 同时控制尺寸、速度和亮度。原作的深度差为 0.7，对应约 0.3 到 1 的层次。

```ts
const z = float(1).sub(depth.mul(hash(uint(i).add(1))));
const tickTime = elapsed.mul(z).mul(0.7).add(index.mul(1.23753));
const tick = floor(tickTime);
```

编号不变，深度也不变。floor(tickTime) 只在方块完成一个周期时变化，用它重新选择横向位置和高度，避免每一帧都随机跳动。整数种子保持随机序列稳定；横向位置与高度分别使用不同偏移种子。具体方块分布与原作不同，但近大远小、近快远慢的规则保留。最终浮点着色仍可能有一个颜色级的舍入差。

### 3. 用 sawtooth 把方块送回起点

fract(tickTime) 从 0 增长到 1，再回到 0，形成锯齿波。减去 0.5 后，它就成为上下移动的位置。用屏幕左右侧的符号翻转方向，便得到两股相反的流。

```ts
const y = sign(p.x)
  .mul(1.6)
  .mul(float(0.5).sub(fract(tickTime)));
const height = hash(uint(tick).add(917)).mul(0.1).add(0.04);
const size = vec2(0.04, height).mul(z).mul(1.8);
```

z 越大，方块越大、移动越快。这是二维视差线索，不是相机透视，也没有景深模糊。循环归位与重新随机是原作运动的一部分；导出视频另做首尾淡化，不能把两者当作天然闭合的动画。

### 4. 一份矩形距离，拆出实体和柔光

把像素移到方块中心，取绝对值后减去半尺寸。矩形外的分量大于零，取其长度，再减去圆角半径。

```ts
const b = length(max(abs(p.sub(center)).sub(size), vec2(0))).sub(0.01);
const body = float(1).sub(smoothstep(0, 0.002, b));
const halo = float(1).sub(smoothstep(0, 0.22, b));
```

实体的过渡很窄，光晕的过渡更宽。这一距离构造在方块内部会饱和为固定负值，适合做遮罩，但不要直接称为完整的内部有符号距离。

原始 GLSL 使用反向 smoothstep，并将变量 b 放入亮边的上界。不同后端对非递增边界的结果可能不同。TSL 将前两项改写成 1-smoothstep；亮边用显式三次插值，并给分母加正数下限。原始 GLSL 不修改，修正只用于运行版本。

### 5. 把亮度相加，再统一为灰阶

每个方块贡献实体、柔光和亮边，最后减去少量颗粒。为了保持黑白，所有计算累计到一个标量，最终广播到三个颜色通道。

```ts
color.addAssign(dust.mul(0.28).add(block.mul(z)).add(shine));
return sRGBTransferEOTF(vec3(clamp(color.sub(grain), 0, 1)));
```

显示值先解码为线性颜色，再由站点 renderer 编码输出，避免重复 gamma 处理。加法重叠仍会让局部高光接近白色；提高参数时留意细节是否被压平。

## 参数怎么读

| 参数     | 建议观察                                   |
| -------- | ------------------------------------------ |
| 流动速度 | 设为零冻结初始画面，再比较远近层的速度     |
| 方块数量 | 从 20 增到 100，看重叠增加与计算量变化     |
| 柔光强度 | 设为零仅看实体，再逐渐找回亮边和光晕       |
| 亮度脉冲 | 手动替代音频振幅；零值留下无光晕的灰白方块 |
| 景深差异 | 设为零统一尺寸和速度，再增加随机层次       |

## 性能与播放

每个像素检查 20 至 100 个方块，默认 70 个；没有纹理、音频、三维 raymarch 或多 pass。计算量近似随方块数量与画布像素数相乘增长：数量加倍和 DPR 加倍不是同一种开销，后者约使像素数变为四倍。

站点默认 WebGPU，支持 WebGL2 后备，采用共享的自动 DPR、减少动态效果和隐藏页面暂停机制。本机实测、浏览器覆盖与可见性测试的适用范围记录于源码同目录的 VALIDATION.md；调度间隔不能当成 GPU 执行时间或真实手机性能。

## 镜像与改编

原作：[I/O — movAX13h](https://www.shadertoy.com/view/XsfGDS)。依据 GabeRundlett/shadertoy-api-shaders 的固定旧镜像：README 记载下载于 2024-10-05，文件提交于 2025-05-29，历史 224 likes / 27957 views 的精确采样日期未知。本次于 2026-09-15 审阅；当前 Shadertoy 页面返回 HTTP 402，未核验当前源码与热度。

按已批准流程采用 **CC BY-NC-SA 3.0（基于旧镜像默认许可判断）**。保留作者署名，本站永久非商业；原始代码、改编与派生预览遵循来源 ShareAlike，独立中文赏析 CC BY-NC-SA 4.0，框架 MIT。音频输入不在获批复用范围内。详细证据见「来源与许可」，可从播放器直接查看完整 TSL。
