---
title: 海景
subtitle: 用多层波形塑造海面，再让天空沿着浪峰反射出光
description: Seascape 用单个无纹理渲染通道，从程序化高度场计算海浪、视线交点与法线，让一片数学曲面呈现出水的重量与光泽。
publishedAt: 2026-09-06
difficulty: 高级
caseType: 授权移植
tags:
  - 高度场求交
  - 程序化海浪
  - Fresnel 反射
  - 有限差分法线
source:
  title: Seascape
  author: TDM（Alexander Alekseev）
  url: https://www.shadertoy.com/view/Ms2SD1
  license: CC BY-NC-SA 3.0（源码顶部显式声明）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 基于 2025-05-29 旧镜像快照；唯一 Image pass 显式声明 CC BY-NC-SA 3.0；3194 likes / 797507 views，非当前热度
preview:
  poster: /previews/seascape.webp
  loop: /previews/seascape.webm
  alt: 浅蓝天空下，青绿色海浪向远处海平线延伸，浪峰上闪着天空反光
---

## 先看见什么

近处的青绿色海浪有尖锐的浪峰与深色波谷，越接近海平线，水面越像一面映出天空的镜子。视点缓慢前进并转向，细小波纹与宽阔涌浪交错，水面因此具有体积感。

画面没有海洋网格、贴图、环境立方体或模拟缓存。每个像素都从屏幕发出一条视线，找到它与数学海面的交点，再根据那个位置的坡度计算颜色。这里的几何与光照都发生在一个片元程序里。

## 一步一步拆开

### 1. 先做出一层有尖峰的波

`noise(p)` 用四个格点的伪随机数和三次平滑插值生成 Value Noise。同一坐标总能得到相同结果，所以时间变化时不会随机闪烁。原作把这个噪声加回二维坐标，打破规则正弦波的整齐条纹。

随后混合 `1 - abs(sin(q))` 与 `abs(cos(q))`，再用两次幂运算改变轮廓。`choppy` 是浪峰尖锐度；它改变高度分布，而不是简单放大噪声。

```ts
const q = p.add(noise(p));
const wave = vec2(1).sub(abs(sin(q)));
const smoothWave = abs(cos(q));
const shaped = vec2(mix(wave.x, smoothWave.x, wave.x), mix(wave.y, smoothWave.y, wave.y));
return pow(max(float(1).sub(pow(shaped.x.mul(shaped.y), 0.65)), 0), choppy);
```

### 2. 把不同尺度的波叠成海面

每层分别采样向前和向后移动的波形，两者相加形成交错运动。下一层把频率乘以 `1.9`、振幅乘以 `0.22`，并旋转、缩放坐标。大波决定整体轮廓，小波填充浪峰细节；越细的一层，尖锐度也越接近 `1`。

海面函数返回 `p.y - height`。正值表示点位于海面上方，负值表示点位于海面下方。它是高度差，不能当作“离表面最近还有多远”的 SDF 距离。

### 3. 在一上一下两个点之间寻找交点

每个像素的视线从相机出发。若远端已经位于海面下方，就把近端的正高度差和远端的负高度差当作夹逼区间，用插值估算海面所在深度。

```ts
const depth = mix(near, far, nearHeight.div(max(nearHeight.sub(farHeight), 0.000001))).toVar();
point.assign(origin.add(direction.mul(depth)));
const h = coarseHeight(point, settings).toVar();
```

新点在海面下就替换远端，在海面上就替换近端；高度误差小于 `0.001` 时退出，最多执行 32 次。这是高度场的夹逼求根，不是按 SDF 距离向前迈步的 Sphere Tracing。交点阶段只用三层波形，避免为每一步都计算最细的波纹。

### 4. 用邻居的高度差估算法线

找到交点后，才用五层波形采样中心、x 方向邻居与 z 方向邻居。把两处高度差与采样间距组成向量并归一化，就得到面向海面外侧的法线。

```ts
const center = detailedHeight(point, settings).toVar();
const normal = normalize(
  vec3(
    detailedHeight(point.add(vec3(eps, 0, 0)), settings).sub(center),
    eps,
    detailedHeight(point.add(vec3(0, 0, eps)), settings).sub(center),
  ),
).toVar();
```

`eps` 随距离平方增大、随画布宽度减小：远处用更宽的邻域估计坡度，减少密集波纹的闪烁。这保留了原作的屏幕尺度近似，并增加极小值保护；它不是严格的像素滤波或抗锯齿算法。

### 5. 让反射说明“这是水”

水体底色提供青绿深度，天空是按视线高度生成的颜色渐变。法线负责把视线反射到天空的某个方向；接近掠射角时，Fresnel 权重增大，海平线附近便显得明亮、平滑。

```ts
const fresnel = min(pow(clamp(float(1).sub(dot(normal, direction.negate())), 0, 1), 3), 0.5).mul(
  reflection,
);
```

原作还加入镜面高光、距离衰减和与浪高相关的透亮着色，强化浪峰与波谷的差异。这里的“折射色”是艺术化着色近似，没有追踪折射光线或模拟真实水下场景。

## 可以亲手试什么

- **海浪速度**：改变两组波形的相位速度；设为零会冻结波形，相机仍缓慢移动。暂停按钮会同时冻结相机与海浪。
- **海浪高度**：从低矮波纹变成起伏涌浪，观察轮廓与亮部如何一起改变。
- **浪峰尖锐度**：改变波形指数，比较圆滑起伏和窄尖浪峰。
- **波纹密度**：改变基础频率，观察同一画幅中能容纳多少道波浪。
- **天空反射**：设为零后反射消失，但镜面高光仍在，可分辨两种亮部的来源。

桌面按住主键拖动可调整观察方向，单纯悬停不会改变画面。移动端保留滑动切换案例；参数和播放按钮同样可用。

## TSL 重写要点

`Fn().setLayout()` 为噪声、波形和高度场生成可复用的 WGSL / GLSL 函数。传入的四维 `settings` 明确打包时间、浪高、尖锐度和频率，避免辅助函数依赖不透明的外部状态。`Loop`、`If`、`Break` 表达每个像素各自执行的求交过程；它们不是 JavaScript 在 CPU 上逐像素运算。

矩阵移植需注意原作 `uv *= mat2(...)` 是行向量乘法，TSL 版本明确写出两个分量，避免旋转方向被无意转置。原作使用反向边界的 `smoothstep(0, -0.02, y)`；此处改为 `1 - smoothstep(-0.02, 0, y)`，避免 GLSL 对反向边界的未定义行为。

保留原作 `pow(color, 0.65)` 的显示曲线后，先解码到线性颜色，再交给运行时的 sRGB 输出编码，避免重复提亮。未开启原作可选的九样本 AA。视点轨迹保留原作思路，拖动改为归一化的小范围角度偏移；五个教学参数新增为 uniform。

## 性能观察

最坏情况下，每像素求交调用 34 次三层高度场，再调用三次五层高度场估算法线；每层包含两次波形噪声，共最多 234 次 Value Noise 采样。提前收敛、朝向天空时会跳过部分计算。这里的主要成本是逐像素数学运算，而非纹理带宽。

运行时沿用自适应 DPR：桌面按 60 fps、触屏按 30 fps 的目标调整分辨率，画质降低时保持同一套波形与求交逻辑。减少动态效果时先显示海报，页面隐藏时停止动画循环。

2026-09-06 本机基线使用 Ryzen 9 7950X3D、RTX 4080 SUPER 与 Chromium 153.0.8010.28。生产构建预热 3 秒后采样 120 个 `requestAnimationFrame` 间隔：1440 × 900 下 WebGPU / WebGL2 平均均为 `6.06 ms`，p95 为 `6.10 ms`；412 × 915 移动视口、有效 DPR 1.5 时，两个后端平均均为 `6.06 ms`，p95 为 `6.20 ms`。这是自动化浏览器的帧调度间隔，不是 GPU 执行耗时；移动视口仍使用同一台桌面 GPU，不能代替实体手机的 30 fps 验收。

额外注入每帧约 45 ms 的主线程负载后，实际渲染画布的有效 DPR 从 `1.0` 降至 `0.8`，确认自适应降级路径生效。海报和短循环来自真实浏览器画布；视频为 1440 × 900、25 fps、7 秒，末尾用半秒交叉淡化衔接开头。预览循环的淡化不改变实时 Shader 的时间函数。

## 许可说明

Seascape 原作者为 Alexander Alekseev（TDM）。旧镜像唯一 Image pass 顶部显式声明 **Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported**，因此本案例的原始 GLSL、TSL 改编与衍生海报和短循环按 **CC BY-NC-SA 3.0** 分发，须保留署名、非商业使用并相同方式共享。独立中文赏析按本站原创内容的 CC BY-NC-SA 4.0 发布；框架仍为 MIT。

判断**基于旧镜像快照**：镜像提交于 2025-05-29，README 记载原始抓取于 2024-10-05；3194 likes / 797507 views 的具体采样日期无法独立确定，不代表当前热度。2026-09-06 核查时当前 Shadertoy 页面仍无法取得，本次抓取返回 HTTP 402，未据此声称已复核当前源码。用户于同日明确批准 Seascape（Ms2SD1）按这份镜像证据继续。完整原始 JSON、GLSL 与证据详见同目录 LICENSE.md。
