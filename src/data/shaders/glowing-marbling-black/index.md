---
title: 银纹流墨
subtitle: 九次余弦扭曲，把对角条纹揉成流动的银白褶皱
description: glowingMarblingBlack 用逐次更新的二维坐标、递减的余弦位移与正弦倒数亮度，在深色底上生成连续流动的银白大理石纹。
publishedAt: 2026-10-10
difficulty: 入门
caseType: 授权移植
tags:
  - 坐标扭曲
  - 三角函数叠加
  - 等值线发光
source:
  title: glowingMarblingBlack
  author: nasana
  url: https://www.shadertoy.com/view/WtdXR8
  license: CC BY-NC-SA 3.0（基于旧镜像快照）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 2024-10-05 初抓、2025-05-29 提交的固定镜像；唯一 Image pass 无自定义许可证或外部输入，按默认许可判断；历史 221 likes / 65839 views，指标采样日期未知；2026-10-10 审阅并获批
preview:
  poster: /previews/glowing-marbling-black.webp
  loop: /previews/glowing-marbling-black.webm
  alt: 深灰底上细密银白亮纹相互弯折，形成如流墨与大理石般的连续褶皱
---

## 先看见什么

银白细纹在暗底上挤压、弯折，宽亮带像液体表面的褶皱，细线则沿着它们流动。画面没有真正的液体模拟，也没有读取大理石纹理：每个像素只把自己的二维坐标改写九次，再用一个正弦函数决定亮度。

已有「玫瑰噪流」（Base warp fBM）通过 value noise 与 fBM 反复改变采样位置；这次全部使用确定的余弦波。已有「墨光双流」（I/O）以独立运动的方块和景深组织黑白画面；这里生成的是一整片连续的等值线。它适合练习一个很容易忽略的细节：**同一轮里，先更新 x，再用新的 x 更新 y**。

## 一步一步拆开

### 1. 让两个方向使用相同的坐标尺度

`uv()` 给出覆盖平面的 0–1 坐标。先乘 2、减 1 把原点放到中心，再乘画布尺寸，除以宽高中的较小值：

```ts
const p = uv().mul(2).sub(1).mul(resolution).div(min(resolution.x, resolution.y)).toVar();
```

横屏中，y 从 -1 到 1，x 的范围随宽高比扩展；竖屏则相反。两轴的一单位始终对应相同像素长度，纹路不会被拉长。这里保留原作按短边归一化的构图，所以改变视口会看到更宽或更高的纹理区域。

`p` 需要 `toVar()`，因为接下来要修改坐标。普通 TSL 节点描述一条待生成的 GPU 表达式；它不像 JavaScript 的 `const` 数字那样已经计算出了结果。

### 2. 用较大的弯曲打底，再叠上较小的弯曲

第 `i` 层位移的幅度是 `0.6 / i`，频率则随 `i` 增加。第一层制造宽弯曲，后续层位移更小、变化更快，因此大结构里逐渐长出细褶皱。

```ts
const index = float(i);
const weight = warp.div(index);
p.x.addAssign(weight.mul(cos(index.mul(2.5).mul(frequency).mul(p.y).add(elapsed))));
```

x 的位移取决于 y，可以把它想成一行行横向推动像素的波。`elapsed` 移动这些波的相位。原作不是把九张独立纹理相加：每层都继续修改上一层留下的坐标，后面的波在已经弯曲的空间里计算。

「扭曲层数」默认 9，与原作的 `i = 1; i < 10` 一致。先降到 1 看清大轮廓，再逐层增加。「细纹频率」同时乘在两轴频率上，仍保留原作 2.5 与 1.5 的比例。

### 3. 更新顺序也参与了构图

x 修改后，才计算 y 的位移：

```ts
p.x.addAssign(weight.mul(cos(index.mul(2.5).mul(frequency).mul(p.y).add(elapsed))));
p.y.addAssign(weight.mul(cos(index.mul(1.5).mul(frequency).mul(p.x).add(elapsed))));
```

第二行的 `p.x` 是第一行写入的新值。这让两个方向在同一层里相互影响。如果先把两个位移都存在一个向量里，再一次性相加，y 就会读取旧 x，得到另一种纹路。两种写法都能生成图案，但要理解和移植原作，就必须保留它的顺序。

TSL 的 `addAssign` 会生成赋值语句；把它们放进 `Fn` 的 `Loop` 中，能在 GPU 上逐轮更新同一个变量。JavaScript 本身没有逐像素执行九轮。

### 4. 把扭曲后的对角条纹变成亮边

如果坐标没有扭曲，`sin(time - y - x)` 的零点沿着一组平行的对角线排列。扭曲坐标后，零点也跟着弯曲，成为我们看到的亮纹。

```ts
const distanceToBand = abs(sin(elapsed.sub(p.y).sub(p.x)));
const brightness = glow.div(max(distanceToBand, 0.0001));
return sRGBTransferEOTF(vec3(clamp(brightness, 0, 1)));
```

越接近零点，分母越小，倒数就越亮。这是周期场的亮度映射，并非精确距离场，也没有额外模糊或后处理 bloom。超过 1 的亮度截到白色，是原作亮带的一部分；小分母保护避免除零，在本案例参数范围内只影响已经截白的区域。

「亮纹宽度」改变分子。值越大，截到白色的区域越宽，同时暗部也变亮，所以它不是单独的线宽工具。先把「扭曲幅度」设为 0，再调整这个参数，容易看清规则条带如何发光。

原 GLSL 直接输出显示空间的灰度。共用渲染器会做 sRGB 输出转换，移植先用 `sRGBTransferEOTF` 解码，避免把原来的灰度再编码一次而使整幅图变灰亮。RGB 都来自同一个标量，整个参数范围保持黑白。

### 5. 同一个时间推进两种运动

时间同时进入坐标扭曲的余弦和最终亮纹的正弦。前者让褶皱变形，后者让亮带在变形场中移动；两者共同构成流动感。

```ts
const elapsed = float(context.time).mul(speed).add(7);
```

教学片段省略了项目里的 TypeScript 类型转换。默认从原作第 7 秒开始，只选择一个已经展开的初始画面；默认幅度、频率、层数和亮度保持原作数学。将速度设为 0 会回到这个固定相位，暂停按钮则停在当前相位。预览短片采用往返播放来闭合循环，实时画面仍向前运行。

## 试着调一调

| 参数     | 可以观察什么                                         |
| -------- | ---------------------------------------------------- |
| 流动速度 | 褶皱变形与亮纹移动如何共享时间；0 回到源时间第 7 秒  |
| 扭曲层数 | 一层宽弯曲怎样逐步长出细纹；也改变每个像素的循环次数 |
| 扭曲幅度 | 从笔直条带到弯折流纹；每层位移仍按层号递减           |
| 细纹频率 | 波的变化速度如何影响褶皱密度；不改变两轴频率比例     |
| 亮纹宽度 | 倒数亮度的分子如何同时影响白带宽度与暗部亮度         |

## 性能与运行边界

默认每个像素执行九层、每层两个余弦，最后再计算一次正弦与倒数。它没有贴图、光线步进或模拟反馈，但高分辨率与更多层数仍会增加计算量。减少层数降低每个像素的工作，降低画质减少像素总数；细纹频率主要改变图案，循环数量不会随之减少。

站点默认 WebGPU，提供 WebGL2 后备；减少动态效果时先显示静态海报，读者可以主动播放。自动画质根据连续帧间隔调整 DPR。桌面与移动模拟的实际后端、性能基线、受控隐藏暂停与原生后台标签页的验证边界见同目录 `performance.json`、`browser-evidence.json` 与 `VALIDATION.md`。浏览器 RAF 间隔是调度观察，不是 GPU 时间戳，也不能代表真实手机性能。

2026-10-10 在 Windows、Ryzen 9 7950X3D / RTX 4080 SUPER、Chromium 154 上，桌面 1440×900 与移动模拟 412×915 的 WebGPU / WebGL2 四组默认运行，暖机 3 秒后各采样 120 个 RAF 间隔：平均均约 6.06 ms，P95 为 6.1–6.2 ms。移动有效 DPR 为 1.5；受控主线程负载使桌面自动 DPR 从 1 降到 0.8。实际 WebGPU 使用非后备 `nvidia / lovelace` adapter。

受控隐藏事件下，800 ms 内 GPUQueue 提交计数保持 472，恢复后增至 608。本机自动化切换标签时仍报告 `document.hidden=false`，因此原生后台标签页暂停尚未验证；受控事件只验证共享运行时的暂停与恢复路径。

## 来源与许可

原作：[glowingMarblingBlack — nasana（WtdXR8）](https://www.shadertoy.com/view/WtdXR8)。固定旧镜像来自 GabeRundlett/shadertoy-api-shaders，README 记载初次下载于 2024-10-05，文件提交于 2025-05-29；221 likes / 65839 views 是历史指标，精确采样日期未知。

2026-10-10 已检查完整唯一 Image pass 和元数据，没有外部输入、自定义许可证、限制性声明或第三方源码引用。因此按 **Shadertoy 默认 CC BY-NC-SA 3.0（基于旧镜像快照）** 判断。当前原作页面返回 HTTP 403，未核验当前源码、许可或热度，也未绕过访问控制。用户在披露这些证据后批准了完全相同的标题与 ID。

完整 `mirror.json`、`original.glsl`、源哈希和批准记录保存在案例目录。原作与 TSL 改编遵循 CC BY-NC-SA 3.0；原创中文赏析与本站生成媒体采用 CC BY-NC-SA 4.0；框架 MIT，站点永久非商业。
