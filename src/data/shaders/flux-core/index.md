---
title: 螺旋能核
subtitle: 先弯曲查询空间，再用镂空结构、锈纹和蓝橙光带搭出一座能量装置
description: Flux Core 把对数极坐标映射混入三维距离场，让同一套圆柱切割几何在隧道与螺旋之间过渡，并用独立的沿途发光累积照亮中心。
publishedAt: 2026-10-12
difficulty: 高级
caseType: 授权移植
tags:
  - 对数螺旋
  - 空间折叠
  - 圆柱切割
  - 距离场步进
  - 程序锈纹
source:
  title: Flux Core
  author: otaviogood / Otavio Good
  url: https://www.shadertoy.com/view/ltlSWf
  license: CC0 1.0（基于旧镜像中的显式声明）
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  evidence: 2024-10-05 初次下载；2025-05-29 镜像提交；2026-10-12 全通道审阅；历史 271 likes / 37507 views，精确采样日期未知；唯一 Image pass 顶部含 CC0 声明与作者签名
preview:
  poster: /previews/flux-core.webp
  loop: /previews/flux-core.webm
  alt: 镂空的螺旋装置围绕蓝色中心光束展开，锈色表面和橙色环带在暗处交错
---

## 先看见什么

中心有一束蓝光，外围是带锈纹的镂空机械结构。相机绕行时，蓝色螺旋与橙色环带反复闪动；后半段结构逐渐伸直，变成一条隧道。它不需要模型、贴图或后期辉光通道：每个像素从相机出发，查询三维空间里的距离，同时收集沿途的发光贡献。

先暂停画面，把“螺旋变形”从 1 降到 0。同一套几何会改变形状，因为改变的是**用什么坐标去问几何函数**。本站从原作第 20 秒开始，实时播放保留原作的 70 秒相机与结构时间线。

## 一步一步拆开

### 1. 把查询空间卷成螺旋

取三维位置的 `yz` 平面，求半径与角度。`log(radius)` 把半径的倍数变化变成等距变化；加上半圈角度后，`fract` 将它反复折回一个单元。角度再折叠两次，得到镜像重复。

```ts
const radius = max(length(position.yz), 0.000001);
const angle = atan(position.y, position.z).div(Math.PI);
const spiralRadius = abs(
  fract(log(radius).add(angle.mul(0.5)))
    .sub(0.5)
    .mul(2),
);
const foldedAngle = abs(abs(angle.mul(2).sub(1)).mul(2).sub(1));
const point = mix(position, vec3(position.x, spiralRadius, foldedAngle), blend);
```

`blend=0` 使用原始空间，`blend=1` 使用螺旋空间；原作时间线与教学滑块共同决定这个权重。这里没有搬动一组网格顶点，而是改变每次距离查询的位置。中心半径加入 `1e-6` 下限，避免 `log(0)` 和除零。

### 2. 从圆筒壳里切出三层孔洞

先用外半径 3.5 与内半径 2.85 得到圆筒壳，再沿 `z` 方向周期切片。`fract(point)-0.5` 把当前位置折回重复网格；分别在 `xz`、`xy`、`yz` 三个平面查询圆柱，用 `max(实体距离, -切刀距离)` 挖孔。

```ts
const cut = length(cell.xz.div(scale)).sub(holeRadius.div(scale)).div(divider);
distance.assign(max(distance, cut.negate()));
```

另外两个方向使用相同操作。重复三轮，每轮按 2.14 改变尺度与网格，产生越来越小的镂空。最后用 `min` 加入径向支撑杆、窄螺旋盒子和摆动环带。原作使用这些组合得到复杂轮廓，空间变形后却不再保证处处是严格的真实距离，细支撑杆也可能在某些角度消失。

### 3. 沿相机射线步进，并明确保存发光贡献

从 `origin + direction * travel` 查询几何，按返回的距离前进，最多 210 步；距离绝对值小于 `0.000625` 就视为命中，超过 45 就停止。中心额外用半径限制步长，减少跨过蓝色细光束的机会。

原作的距离函数还会修改三个全局发光变量。移植把一次查询返回为 `vec4(距离, 中心束, 橙色环, 蓝色螺旋)`，计算顺序更直观：

```ts
const sample = field(position, settings).toVar();
glows.addAssign(sample.yzw);
distance.assign(min(sample.x, length(position.yz)));
travel.addAssign(distance);
```

这些贡献与距离的倒数有关，光源附近更亮，但不是能量守恒的体积积分，也没有按步长加权。值得留意一个原作细节：中心束和蓝螺旋在命中后保存，橙环还会包含后续法线、遮蔽与阴影查询的贡献。移植显式保留这项顺序，避免把源码的副作用改掉后无意改变亮度。

### 4. 给实体计算法线、遮蔽和锈纹

在命中点沿三轴各退一小步，用距离差估算法线；沿法线在六个距离取样，估算近处和远处的环境遮蔽；向太阳再走最多 30 步，得到阴影。

材质包含八格点插值噪声和一种窄波峰锈纹：对位置连续旋转七次，将 `cos` 的峰顶截成细条，再用噪声调制。每次旋转先保存旧的二维分量，防止更新 `x` 后再错误地计算同一对坐标的 `y`。噪声还轻微扰动法线，让表面显得粗糙。

原作混合锈纹时使用逆序的 `smoothstep` 边界。移植将它展开为 `clamp((x-a)/(b-a),0,1)` 和三次曲线，保留该计算的代数结果，避免依赖不同后端对逆序边界的未定义行为。

### 5. 合并实体光照与蓝橙光带

太阳漫反射、红蓝环境光与中心蓝光照亮锈纹表面，沿途累积则产生悬浮光带。最后加暗角和镜头切换的淡入淡出，执行原作的平方根显示曲线。移植再做 sRGB 解码，交给共享渲染器输出，避免对已经调整过的显示颜色重复编码。

实时结构会继续按原作时间线变化。卡片短循环截取一段浏览器画布并倒放闭环，方便预览；这种倒放只用于媒体。

## 可以亲手试什么

- **动画速度**：改变相机、结构和脉冲的时间倍率；0 固定在原作第 20 秒。
- **螺旋变形**：缩放时间线里的空间混合权重，观察隧道怎样卷成螺旋。
- **孔洞半径**：从 0.22 到 0.4 调整三个方向的圆柱切割；孔洞扩大也会影响表面命中与阴影。
- **辉光亮度**：缩放三组累积光，不改变几何，可分辨发光与实体表面。
- **锈纹尺度**：改变锈纹的输入频率，较大值得到更细的锈迹。

## 性能观察与验证边界

一条主射线最多查询 210 次几何；命中后还有法线、遮蔽与最多 30 次阴影查询，锈纹也包含多轮噪声。细镂空和空间折叠会让某些像素走得更久，平均成本取决于镜头与视口。提高像素密度通常比调亮光带更昂贵，移动视口可以使用较低画质；共享运行时会自适应降低 DPR，减少动态偏好默认展示海报，用户可手动播放。

本机 Ryzen 9 7950X3D / RTX 4080 SUPER、Chromium 151 的桌面与移动模拟视口，WebGPU / WebGL2 四组各取 120 个 RAF 间隔：平均约 6.06 ms，P95 约 6.1–6.2 ms。RAF 间隔表示浏览器调度，不能当作 GPU 时间或真实手机性能；完整基线与证据保存在同目录 `VALIDATION.md`、`performance.json`。受控可见性事件已验证暂停与恢复，但实际切换标签页仍报告 `document.hidden=false`，原生后台暂停尚未核验。

## 来源与许可

[Flux Core — otaviogood / Otavio Good（ltlSWf）](https://www.shadertoy.com/view/ltlSWf) 来自 GabeRundlett/shadertoy-api-shaders 的固定旧镜像，提交 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`。README 记载初次下载于 2024-10-05，文件提交于 2025-05-29；历史 **271 likes / 37507 views** 的精确采样日期未知。

2026-10-12 完整审阅唯一 Image pass 的 674 行与元数据，零外部输入；源码顶部含明确 **CC0 1.0** 声明、权利放弃文本和作者签名，没有额外限制。距离函数文章的链接保留为概念来源。当前原作页面返回 HTTP 402，未核验当前版本；许可判断基于用户已批准的旧镜像快照。原作与 TSL 改编 CC0 1.0，本站中文赏析与生成媒体 CC BY-NC-SA 4.0，框架 MIT，站点永久非商业；详细档案见 `LICENSE.md`。
