---
title: 雨落窗前
subtitle: 让滑落的水珠擦开雾气，折射窗外的冷暖灯光
description: 将 BigWIngs 的 Heartfelt 改编为静音雨窗，用程序化水滴、有限差分和 mipmap 模糊解释玻璃表面的折射与拖痕。
publishedAt: 2026-09-17
difficulty: 进阶
caseType: 授权移植
tags:
  - 程序化雨滴
  - 有限差分
  - 折射偏移
  - Mipmap 模糊
source:
  title: Heartfelt
  author: BigWIngs / Martijn Steinrucken
  url: https://www.shadertoy.com/view/ltffzl
  license: CC BY-NC-SA 3.0（旧镜像源码显式声明）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 2025-05-29 旧镜像 Image pass 显式声明；1323 likes / 129121 views 为历史指标；用户批准静音、自制背景与 MIT 哈希替换
preview:
  poster: /previews/heartfelt.webp
  loop: /previews/heartfelt.webm
  alt: 深蓝色雾面玻璃上的透明雨滴折射冷蓝与暖金灯光，滑落的水珠留下一道道清晰拖痕
---

## 先看见什么

窗外的灯光模糊成冷暖色斑，玻璃上的水珠却有清楚的边缘。较大的水珠向下滑动，在雾面上擦出细长的通道。这个效果没有玻璃模型，也没有追踪光线穿过水滴：它用一张二维“雨滴高度图”同时控制背景偏移和模糊程度。

原作 **Heartfelt — BigWIngs / Martijn Steinrucken（2017）** 带有爱心剧情、照片、音乐和雨声。本例按明确批准的范围制作静音雨窗教学版：去掉剧情和闪电，用本地程序生成冷暖灯光背景，并将原作署名的旧 N13 哈希替换成 David Hoskins 的 MIT hash31。水滴位置与原作不同，原始 GLSL 和镜像证据保持原样。

与「海景」的海面高度场不同，这里的高度只用来偏移屏幕上的图像；与「熔彩流动」的 SDF 体积不同，这里不做 ray marching。重点是雨滴、拖痕、雾气三者如何共享一份数据。

## 一步一步拆开

### 1. 先准备玻璃后面的灯光

JavaScript 在一张 2048 × 1024 的 Canvas 上绘制 140 个径向渐变圆斑。固定种子的伪随机数决定位置和大小，每三个圆斑中有一个使用暖色。纹理只在案例初始化时生成一次，不需要网络图片，也不在每帧上传。

```ts
map.minFilter = THREE.LinearMipmapLinearFilter;
map.generateMipmaps = true;
const color = texture(background, coord).level(focus).rgb;
```

mipmap 是逐级缩小的纹理金字塔。选更高的层级，会读到细节更少的图像；在这里，它成为廉价的雾玻璃模糊。它不是物理景深，也不是高斯模糊。背景按 2:1 比例居中裁切，竖屏不会把圆形灯光压扁。

### 2. 把一滴雨放进一个小格子

让横坐标乘宽高比，两个坐标轴便使用相同尺度。再把空间分成窄而高的格子，用 floor 得到格子编号、fract 得到格子内部位置。每格的随机值决定雨滴横向位置、开始时间和摆动程度。

```ts
const grid = vec2(12, 2);
const id = floor(p.mul(grid));
const st = fract(p.mul(grid)).sub(vec2(0.5, 0));
const n = hash31(id.x.mul(35.2).add(id.y.mul(2376.1)));
```

hash31 的实现取自 Dave Hoskins 的 MIT Common pass，并保留版权声明。它替换原作中参数不同的旧变体，因此不能声称水滴分布与原作逐像素相同。原作另外的列偏移 sin/fract 保留，跨 GPU 的精确随机值仍可能略有差异。

### 3. 让水珠滑动，再留下拖痕

fract(time + n.z) 从零增到一后回到零。两个 smoothstep 相乘，生成非匀速的 sawtooth：水滴先缓慢积聚，再向下滑落。水滴中心后方有一条逐渐收窄的轨迹；轨迹旁还叠加细小水珠。

```ts
const y = saw(0.85, fract(time.add(n.z)))
  .sub(0.5)
  .mul(0.9)
  .add(0.5);
const main = falling(0, 0.4, d);
return vec2(main.add(droplets.mul(r).mul(front)), trail);
```

返回值的 x 存水滴遮罩，y 存拖痕强度。静止水珠与两种不同尺度的流动层相加，避免整张玻璃看起来像单一的重复网格。“雨量”控制三层权重，零值明确清空全部水滴。

原作多次使用反向 smoothstep；这在 GLSL 中没有跨后端的保证。运行版统一改成递增边界的 1 − smoothstep，拖痕宽度为零时给分母留一个小下限。档案中的原始 GLSL 不作修改。

### 4. 用邻居的高度差偏移背景

一张灰度高度图还不能产生折射。再向右、向上各取一次雨滴值，减去当前值，得到局部坡度。这就是有限差分（finite difference）。坡度指向水滴变化最快的方向，用它偏移背景 UV，边缘便像透镜一样扭曲灯光。

```ts
const cx = drops(p.add(vec2(0.001, 0)), t, rain).x;
const cy = drops(p.add(vec2(0, 0.001)), t, rain).x;
const normal = vec2(cx.sub(c.x), cy.sub(c.x)).mul(refraction);
```

这里的 normal 是二维偏移量，不是经过物理折射公式求出的三维法线。差分没有除以步长，步长和折射强度共同决定外观。将“折射强度”设为零，可以单独看雾气被水珠擦开的效果。

### 5. 水珠与拖痕让雾面局部清晰

雾面使用较高的 mip 层级；水滴主体使用较低层级；拖痕从雾气中减掉一部分模糊。这样，同一份遮罩同时决定“往哪里看”和“看得多清楚”。

```ts
const focus = mix(max(float(6).mul(fog).sub(c.y), 0), float(2).mul(fog), smoothstep(0.1, 0.2, c.x));
const color = texture(background, coord).level(focus).rgb;
```

最终加一点暗角。Canvas 保存的显示 RGB 按数值纹理读取，合成结束后只解码一次，再交给 renderer 输出，避免重复 gamma 转换。没有额外的画面渲染 pass；背景纹理的 mipmap 在初始化时生成。

## 参数怎么读

| 参数     | 建议观察                                           |
| -------- | -------------------------------------------------- |
| 下落速度 | 设为零固定初始时刻；比较水滴积聚与滑动的节奏       |
| 雨量     | 从零开始，看静止水珠和两层流动雨滴依次出现         |
| 玻璃雾气 | 比较背景、拖痕和水滴内侧的清晰度差异               |
| 折射强度 | 设为零隔离模糊变化；再看水滴边缘如何拉扯灯光       |
| 雨滴密度 | 数值越大，水滴越小、同屏越多；并不增加代码中的层数 |

## 性能与播放

每个像素求三次雨滴场：中心和两个差分位置。每次包含静止水珠及两层流动水滴，最后做一次有明确 LOD 的背景采样。提高雨滴密度不会增加层数，但细小高频水珠更容易受分辨率影响。DPR 加倍会让待计算像素数约增至四倍。

站点默认 WebGPU，支持 WebGL2 后备、移动视口、自适应 DPR 和减少动态效果。性能基线与浏览器验证范围见同目录 VALIDATION.md；RAF 调度间隔不代表 GPU 执行时间，也不能代替真实手机测量。隐藏页面沿用站点暂停机制，实测与受控事件检查会分别记录。

## 镜像与改编

[原作 Heartfelt](https://www.shadertoy.com/view/ltffzl) 的旧镜像源码明确声明 CC BY-NC-SA 3.0。GabeRundlett/shadertoy-api-shaders 的 README 记载下载于 2024-10-05，文件提交于 2025-05-29；1323 likes / 129121 views 是历史数值，精确采样日期未知。本次于 2026-09-17 审阅，当前 Shadertoy 页面返回 HTTP 402，未核验当前源码与热度。

本例不请求、托管或播放原作照片、音乐及雨声。完整来源链、MIT 哈希声明、用户批准记录和修改范围见「来源与许可」。派生代码与预览遵循 CC BY-NC-SA 3.0，独立中文赏析 CC BY-NC-SA 4.0，网站框架 MIT，站点永久非商业。
