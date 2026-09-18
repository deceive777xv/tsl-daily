---
title: 叠环流彩
subtitle: 反复折叠一张坐标纸，让彩色光环在不同尺度间相互嵌套
description: 拆解 kishimisu 的 Shader Art Coding Introduction，用递归平铺、距离波和反幂辉光，从一个圆形距离场长出层层彩色纹样。
publishedAt: 2026-09-18
difficulty: 入门
caseType: 授权移植
tags:
  - 递归平铺
  - 距离波
  - 反幂辉光
  - 余弦调色板
source:
  title: Shader Art Coding Introduction
  author: kishimisu
  url: https://www.shadertoy.com/view/mtyGWy
  license: CC BY-NC-SA 3.0（基于旧镜像快照的默认许可判断）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 2025-05-29 镜像唯一 Image pass 无自定义许可证；历史 1305 likes / 138973 views；2026-09-18 用户明确批准
preview:
  poster: /previews/shader-art-introduction.webp
  loop: /previews/shader-art-introduction.webm
  alt: 黑色背景上的青蓝、金色与粉色圆环递归嵌套，在交汇处形成明亮的菱形纹样
---

## 先看见什么

画面像一张不断变色的光环织物：大圆环之间嵌着小圆环，小圆环的交点又长出更细的菱形。没有粒子、模型或图片，每个像素只回答一个问题：我在反复折叠后的坐标里，离这一格的中心有多远？

原作 **Shader Art Coding Introduction — kishimisu** 是作者第一部 Shader 创意编程视频的配套作品。这里以原作第 2 秒为初始构图，用 TSL 拆解其二维递归纹样。与「星巢」沿视线累计三维分形不同，这里只在二维坐标上迭代；与「菱波交织」的一层规则格子不同，这里把上一层坐标继续缩放、取小数，图案的复杂度来自递归过程。

## 一步一步拆开

### 1. 给每个像素一张以中心为原点的坐标纸

UV 从左下角的零走到右上角的一。乘二减一，把画面中心放到原点；再将横坐标乘以宽高比，保证横向和纵向的一单位同样长。否则圆环会随屏幕比例变成椭圆。

```ts
const original = uv()
  .mul(2)
  .sub(1)
  .mul(vec2(resolution.x.div(resolution.y), 1))
  .toVar();
const position = original.toVar();
const radius = length(original).toVar();
```

保留两份坐标很重要：original 始终描述像素在整幅画中的位置，position 则会在下一步被反复折叠。toVar 创建着色器里的局部变量；这里需要改变 position，而不希望更改 original。

### 2. 用 fract 递归折叠坐标

fract 取小数部分，即 x − floor(x)，对负数也会得到零到一之间的结果。先乘平铺倍率，再取 fract，最后减 0.5，每个小格的坐标便重新落到中心对称的区间。

```ts
Loop(6, ({ i }) => {
  If(float(i).lessThan(layers), () => {
    position.assign(fract(position.mul(tiling)).sub(0.5));
    // 在本层坐标上计算颜色，再继续折叠。
  });
});
```

关键是下一层使用已经折叠过的 position，而不是每次从 original 开始。默认倍率 1.5 不是整数，因此各层边界不会整齐重合。把「递归层数」设为一，再逐级增加，就能观察大纹样如何被更细的结构补充。这是有限次递归形成的分形式纹样，并非无限精度的数学分形。

### 3. 把到格子中心的距离变成光环

length(position) 是圆形的距离场。乘 exp(−radius)，让同样的小格在离画面中心较远的位置得到更小的距离值；这改变了波纹分布，不是直接让边缘颜色变暗。随后对距离取正弦：正弦每次穿过零，就画出一圈亮线。

```ts
const distance = length(position).mul(exp(radius.negate()));
const ring = abs(sin(distance.mul(frequency).add(elapsed)).div(frequency));
```

frequency 同时出现在正弦内部和分母中，保留原作的距离波形式；调整它会一起改变环的间隔和距离数值尺度。elapsed 进入相位，让零点随时间移动，形成看似呼吸的圆环。

### 4. 用倒数画出亮线周围的辉光

ring 越接近零，像素越靠近亮环。将小常数除以 ring，零点周围会变亮；再做 1.2 次幂，强化明暗反差。这个辉光是每个像素直接计算的亮度曲线，没有模糊纹理，也不是额外的 Bloom pass。

```ts
const light = pow(glow.mul(0.01).div(max(ring, 0.0001)), 1.2);
color.addAssign(palette.mul(light));
```

原作在零点有除零奇点。运行版给分母加 0.0001 的下限，防止 Infinity/NaN；这只约束极亮的线心。最终 RGB 截断到零至一，所以交点可能呈白色。「辉光宽度」以原作为一倍；将它降低，可以更清楚地看到彩色线条；层数和辉光都较高时，亮区会明显增多。

### 5. 给每层光环分配不同的颜色相位

三个余弦波分别控制红、绿、蓝。它们使用相同频率，但相位偏移不同，合成颜色便会在青、紫、金等色调间连续变化。颜色索引还叠加原始半径、层编号和时间，让不同位置、不同层的颜色错开。

```ts
const phase = radius.add(float(i).mul(0.4)).add(elapsed.mul(0.4));
const palette = cos(
  vec3(phase)
    .add(vec3(0.263, 0.416, 0.557))
    .mul(6.28318),
)
  .mul(0.5)
  .add(0.5);
```

这是对 [Inigo Quilez 余弦调色板数学概念](https://iquilezles.org/articles/palettes/)的独立 TSL 表达，保留原作对该概念的署名；不引入其其他 Shader 或文章素材。各层用加法合成后，显示编码 RGB 先解码一次，再交给站点 renderer 输出，避免重复 gamma 转换改变外观。

## 参数怎么读

| 参数     | 建议观察                                                |
| -------- | ------------------------------------------------------- |
| 流动速度 | 设为零停在原作第 2 秒；它同时影响光环与颜色，不改变层数 |
| 递归层数 | 从一增加到六，辨认每一层新增的小圆与交点                |
| 平铺倍率 | 比较 1.5 与整数 2，观察跨层边界的错位关系               |
| 光环频率 | 比较同一格里亮环的密度，同时留意光晕尺度的变化          |
| 辉光宽度 | 从低值增加，看细线变亮、变宽并在交点叠加                |

## 性能与播放

这是一个无纹理输入的单通道程序。默认执行四层，最大六层；每层包含距离、指数、正弦、三通道余弦和反幂运算。增加层数会增加有效计算，改变平铺倍率不会增加循环次数，但高频细节更容易受采样分辨率影响。此版本没有额外多重采样，细纹可能随动画出现轻微闪烁；降低层数或提高画质可以对比这种变化。

站点默认 WebGPU，并提供 WebGL2 后备。竖屏沿用按高度归一化的原作坐标，圆形保持比例、横向视野收窄。减少动态效果时先显示静态海报，读者可以主动播放；隐藏暂停与自适应 DPR 沿用站点机制。性能基线和实际验证范围见同目录 VALIDATION.md。RAF 间隔反映浏览器调度，不等于 GPU 执行时间，也不代表真实手机性能。

## 镜像与改编

[原作](https://www.shadertoy.com/view/mtyGWy)的固定旧镜像来自 GabeRundlett/shadertoy-api-shaders：README 标注下载于 2024-10-05，文件提交于 2025-05-29；1305 likes / 138973 views 是历史指标，精确采样日期未知。2026-09-18 已检查完整唯一 Image pass，未发现自定义许可证；依用户批准的流程，按 Shadertoy 默认 CC BY-NC-SA 3.0 判断，明确基于旧镜像快照，未声称核验当前原作状态。

原始 GLSL 与镜像保持原样。运行版增加五个参数、分母下限、初始时间偏移与色彩空间适配。海报和无声短循环来自真实浏览器；短循环通过首尾交叉淡化衔接，不宣称原公式在该时长严格周期。许可、批准记录及概念署名详见「来源与许可」。派生实现与媒体 CC BY-NC-SA 3.0，独立中文赏析 CC BY-NC-SA 4.0，框架 MIT，站点永久非商业。
