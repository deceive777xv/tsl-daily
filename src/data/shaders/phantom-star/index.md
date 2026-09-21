---
title: 幻星晶廊
subtitle: 把空间反复折成盒体，再沿视线累积蓝白色光
description: Phantom Star 通过极坐标重复与 IFS 折叠，把一个盒体变成复杂晶体通道；沿视线累加距离场辉光，形成透亮的蓝白空间。
publishedAt: 2026-09-20
difficulty: 进阶
caseType: 授权移植
tags:
  - IFS
  - Polar Repetition
  - Signed Distance Field
  - Glow Accumulation
source:
  title: Phantom Star for CineShader
  author: kasari39
  url: https://www.shadertoy.com/view/ttKGDt
  license: CC BY-NC-SA 3.0（基于旧镜像快照；含同许可上游）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 2024-10-05 下载、2025-05-29 提交的 API 镜像；541 likes / 353861 views，指标精确采样日期未知；2026-09-20 审阅
preview:
  poster: /previews/phantom-star.webp
  loop: /previews/phantom-star.webm
  alt: 蓝白色发光晶体围绕通道中心重复展开，形成层叠万花筒图案
---

## 先看见什么

视线沿着蓝白色通道前进，重复的棱面像一片会变形的晶体。亮带穿过空间时，靠近的结构短暂发白，远处仍能看见重叠的轮廓。这里没有玻璃材质、灯光贴图或真实折射：透明感来自沿一条射线多次累加亮度。

作者 kasari39 在原作中明确引用了 aiekick / Stephane Cuillerdier 的 **Phantom Mode**。它把有正负的距离取绝对值，以小步长穿过表面附近的区域，继续积累贡献。移植保留两层来源及署名。

和「八角回廊」都使用盒体距离场、绝对距离步进和指数累光，技术家族有明显重叠。本例增加极坐标扇区重复、多层 IFS 折叠与单独着色的径向光带，而八角回廊主要组合多个旋转盒体；和「星巢」相比，虽然都使用迭代与累积，这里的场函数测量折叠盒体的距离，步长也由这个距离控制。

## 一步一步拆开

### 1. 用屏幕坐标发出一条射线

把 UV 从 `[0, 1]` 移到 `[-1, 1]`，再按画布短边缩放，保证横屏、竖屏里的几何比例一致。相机沿负 Z 轴移动；`up = (sin(time), 1, 0)` 随时间倾斜，与 `side` 一起决定画面方向。

```ts
const screen = uv()
  .mul(2)
  .sub(1)
  .mul(resolution.div(min(resolution.x, resolution.y)));
const origin = vec3(0, 0, time.mul(-3));
const up = vec3(sin(time), 1, 0);
const side = cross(vec3(0, 0, -1), up);
const ray = normalize(
  side
    .mul(screen.x)
    .add(up.mul(screen.y))
    .add(vec3(0, 0, -1)),
);
```

这里故意保留原作的相机基向量，而不是替换成标准 `lookAt` 相机。`up` 与 `side` 互相垂直，但长度都随时间变化；保留这种非单位长度，才能保持原作的视野缩放。初始时间选第 2 秒，暂停后恢复默认参数会回到同一个构图。

### 2. 把整个空间折回小区域

先用 `mod` 让 X、Y 每 10 个单位重复，Z 每 16 个单位重复；再根据 `atan(x, y)` 算出角扇区，把 XY 坐标旋回同一扇区。这样只计算一个局部形状，就能得到整圈重复。

```ts
const sectorAngle = float(Math.PI * 2).div(settings.y);
const angle = floor(atan(p.x, p.y).add(float(Math.PI).div(settings.y)).div(sectorAngle)).mul(
  sectorAngle,
);
p.xy.assign(rotate(p.xy, angle.negate()));
```

`settings.y` 是「旋转分区」，默认为 5。改变它会改变角度重复结构，而不是增加场景里的 Mesh 数量。移植时要特别注意原作写的是 **向量右乘矩阵**：`p * mat2(c,s,-s,c)` 对应 `x' = cx + sy`、`y' = cy - sx`。转置方向会让图案和原作明显不同。

### 3. 反复折叠，再测量到盒体的距离

每一层先做 `abs(p) - 1`，把负半轴镜像到正半轴再平移；随后分别旋转 XY 和 XZ。五次折叠后，一个盒体已经对应原空间中的许多重复形状。这是一种迭代函数系统（IFS）的构形方法。

```ts
Loop(6, ({ i }) => {
  If(float(i).lessThan(settings.z), () => {
    p.assign(abs(p).sub(1));
    p.xy.assign(rotate(p.xy, settings.x.mul(0.3)));
    p.xz.assign(rotate(p.xz, settings.x.mul(0.1)));
  });
});
const d = abs(p).sub(vec3(0.4, 0.8, 0.3));
return min(max(d.x, max(d.y, d.z)), 0).add(length(max(d, 0)));
```

最后一行是盒体的有符号距离公式：外部为正，内部为负，表面为零。折叠后得到复杂场函数；不要把它理解为对任意复杂表面都严格精确的全局距离。TSL 的 `toVar()`、`assign()` 和 `Loop()` 在 GPU 里保存和更新每个像素自己的状态，普通 JavaScript 循环变量不能替代它们。

### 4. 穿过表面附近，累加而不停止

常规球面追踪在距离接近零时认定命中。本例继续走满 99 步：距离取绝对值、最低限制为 `0.02`，实际前进距离再乘 `0.5`。靠近表面时步长短，采样点密集，指数衰减给出的亮度也高。

```ts
const distance = max(abs(field(position, settings)), 0.02).toVar();
const light = exp(distance.mul(falloff).negate()).toVar();
accumulated.addAssign(light);
travel.addAssign(distance.mul(0.5));
```

「辉光衰减」越大，离表面较远的贡献越小，光晕就越窄。这是风格化的加法累积，没有物理体积渲染里的消光、透射率或能量守恒。它解释了透明感，也解释了局部亮白高光。

### 5. 用径向光带强调深度

对采样点到世界原点的距离做周期取模，选出宽度 3、周期 30 的球壳状光带；时间让光带径向移动。带内亮度乘以「光带倍率」，并单独积累到 `bands`，让绿色、蓝色增加更多。

```ts
If(mod(length(position).add(time.mul(24)), 30).lessThan(3), () => {
  light.mulAssign(pulse);
  bands.addAssign(light);
});
```

原作 RGB 使用近似显示编码，移植先解码到线性空间，再交给站点统一的 sRGB 输出。原始 alpha `1 - travel * 0.03` 保留在 GLSL 档案中；网页将最终画面作为不透明颜色展示，不把它当透明度叠加，也不接入 CineShader 的额外处理。

## 可以怎样试

- 把「折叠次数」从 3 调到 6，观察局部盒体怎样形成更密的空间细节。
- 暂停画面后改变「旋转分区」，分辨角重复与内部折叠的不同作用。
- 增大「辉光衰减」让轮廓收紧，再调整「光带倍率」观察移动球壳如何挑亮一部分几何。
- 「流动速度」为零时固定在初始相位；恢复默认参数可回到原作的五重重复、五次折叠和两倍光带。

## 性能与运行方式

每像素固定 99 次场查询，每次默认五层折叠；没有外部纹理，主要成本来自场函数、三角运算和采样次数。降低画质通过减小 DPR 减少像素数量；增加折叠次数会增加每个像素的计算。

默认 WebGPU，支持强制 WebGL2 后备。减少动态效果偏好先显示海报，用户可手动播放；页面隐藏时共用运行时停止绘制。本机桌面与移动模拟、WebGPU 与 WebGL2 已验证。真实后台标签页在本次自动化环境中仍未产生隐藏状态，不能记为验证通过；受控隐藏事件可停止并恢复 GPU 提交。详细记录见同目录 VALIDATION.md。帧间隔不等同于 GPU 执行时间，也不能代表真实手机性能。

原作某些时间相位会出现大面积亮白。用于归档的短循环将速度降到 0.15 倍，截取初始构图附近，并用 0.5 秒交叉淡化连接首尾；交互页面仍使用原作默认一倍速度。

## 来源与许可

[Phantom Star for CineShader — kasari39](https://www.shadertoy.com/view/ttKGDt)，以及其明确引用的 [Phantom Mode — aiekick / Stephane Cuillerdier](https://www.shadertoy.com/view/MtScWW)。GabeRundlett/shadertoy-api-shaders 镜像记载下载于 2024-10-05，两个文件均提交于 2025-05-29；主作品历史 541 likes / 353861 views，精确采样日期未知。2026-09-20 审阅两个完整单 pass。

主作品按 **CC BY-NC-SA 3.0（基于旧镜像快照的默认许可判断）**；上游 Phantom Mode 头部明确声明同一许可。当前原作请求返回 HTTP 402，未核验当前版本；用户已批准按这些旧镜像证据继续。原始 GLSL、改编代码与衍生媒体遵循来源许可；独立中文赏析 CC BY-NC-SA 4.0，站点永久非商业。
