---
title: 螺旋卷层
subtitle: 从一条平面螺线，铺出会展开的立体卷层
description: Spiraled Layers 用螺旋距离场、分层重复与射线求交，让粉蓝色卷带在三维平面上逐排舒展。
publishedAt: 2026-09-24
difficulty: 进阶
caseType: 授权移植
tags:
  - Spiral SDF
  - Spatial Repetition
  - Raymarching
  - Ambient Occlusion
source:
  title: Spiraled Layers
  author: Tater
  url: https://www.shadertoy.com/view/Ns3XWf
  license: CC BY-NC-SA 3.0（基于旧镜像快照）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 2024-10-05 下载、2025-05-29 提交的 API 镜像；272 likes / 11171 views，指标精确采样日期未知；2026-09-24 审阅
preview:
  poster: /previews/spiraled-layers.webp
  loop: /previews/spiraled-layers.webm
  alt: 粉蓝色立体螺旋卷带排布在淡绿色层面上，向画面远处逐排展开
---

## 先看见什么

淡绿的平台向远处延伸，粉蓝色的卷带一排排竖起。每个端面是一条紧密的螺旋线；沿侧面看，它又像被卷起来的薄片。卷带随时间向前舒展，平台边缘把立体层次交代得很清楚。

原作 [Spiraled Layers — Tater](https://www.shadertoy.com/view/Ns3XWf) 没有贴图或模型。形状来自二维螺线的距离估计，再被挤出到第三个维度。射线追踪负责找表面，法线与遮挡让螺线成为可辨认的立体物件。这个案例重点是怎样给重复区域设边界，避免接缝在画面里穿帮。

## 一步一步拆开

### 1. 从像素建立相机射线

先把屏幕 UV 换算为以画面中心为原点、按高度归一化的坐标。相机从斜上方看向平台，forward、right 和它们的叉积共同组成像素射线。

```ts
const screen = uv().sub(0.5).mul(resolution.div(resolution.y));
const forward = normalize(vec3(-2.5, 0, 0).sub(origin));
const right = normalize(cross(vec3(0, 1, 0), forward));
const ray = normalize(
  forward.mul(2).add(right.mul(screen.x)).add(cross(forward, right).mul(screen.y)),
);
```

这里保留原作的视角比例。滑动「相机偏航」会改变起点与观看方向，便于观察卷层分布在三维空间，而不是绘在屏幕上的图案。

### 2. 把展开的线折成螺旋距离场

原作先按时间挪动平面坐标，再用 atan 与 length 把它转成极坐标。极角给半径加偏移，就得到一条卷曲的带；abs(y) − thickness 测量到带边的距离。末端还有一段会随时间移动的截断线，使螺旋看起来正在展开。

```ts
const angle = clamp(atan(p.y, p.x), -Math.PI, Math.PI);
p.assign(vec2(angle, length(p).add(angle.mul(spacing).mul(0.5))));
const cell = clamp(round(p.y.div(period)), 0, floor(turn));
p.y.subAssign(period.mul(cell));
const distance = abs(p.y).sub(thickness);
```

「卷层厚度」改变这条距离场的笔画宽度。它也参与行高计算，所以增大后卷带和层面的比例会一起变化。

### 3. 叠三组卷层，再限定重复边界

每条重复带里有三组高度和时间错开的螺旋。纵向的 round 把相邻行折回同一行，横向也只复用有限数量的带。直接重复会在单元边界露出截断面，原作于是计算射线到重复平面的交点，让当前单元的形状在边界处停止。

```ts
const lane = clamp(round(p.z.div(lanePeriod)), count.negate(), count);
p.z.subAssign(lanePeriod.mul(lane));
const plane = sign(direction.z).mul(lanePeriod.mul(0.5)).sub(p.z).div(direction.z).add(0.01);
return vec3(min(coilDistance, plane), materialFlag, aoDistance);
```

返回值不只是距离：第二个值标记射线先碰到卷层还是边界平面，第三个值留给环境光遮蔽。把它们带在同一个结果里，后续着色就不必再猜命中的是哪种表面。「分层宽度」同时改变重复间距和边界位置。

### 4. 沿射线寻找表面

射线每次前进当前距离场给出的步长，距离小于阈值就认为到达表面；走得太远便显示背景。命中后，沿 X、Y、Z 各偏移一点，再次查询距离的差值，得到局部法线。

```ts
Loop(128, () => {
  point.assign(origin.add(ray.mul(travel)));
  sample.assign(field(point, ray, settings));
  travel.addAssign(sample.x);
  If(sample.x.lessThan(0.001), () => {
    Break();
  });
  If(travel.greaterThan(100), () => {
    Break();
  });
});
```

这属于距离场驱动的球面追踪。原作上限为 200 步；移植取 128 步，优先保证桌面和移动视口都可交互。复杂边缘可能因此与原作不同，原始 GLSL 则完整保存在证据档案中。

### 5. 用法线、阴影和遮蔽建立层次

法线先转成粉蓝色基调；沿灯光方向继续探测得到浅阴影，再在表面附近取两次距离得到环境光遮蔽。阴影最低保留 0.8 的亮度，因此画面保持明快，而螺旋圈内和层面交界处仍能看出深浅。

```ts
const ao = max(
  smoothstep(-0.05, 0.05, field(point.add(normal.mul(0.05)), light, settings).z).mul(
    smoothstep(-0.1, 0.1, field(point.add(normal.mul(0.1)), light, settings).z),
  ),
  0.65,
);
normal.xz.assign(rotate(normal.xz, (4 * Math.PI) / 3));
color.assign(normal.mul(0.5).add(0.5).mul(shadow).mul(ao));
```

阴影上限由原作 64 次改为 24 次，以减轻逐像素成本；环境光遮蔽下限从原作的 0.1 提高到 0.65，使简化后的卷层侧面保持接近原作的明亮粉蓝色。这会弱化局部遮蔽，不是逐像素复制。画面输出前保留原作的平方根亮度处理，再接到本站的 sRGB 输出流程。

## 可以怎样试

- 暂停后改变「卷层厚度」，看螺旋端面和平台边缘如何同时变粗。
- 调整「分层宽度」，观察相邻卷带及重复边界怎样移动。
- 把「相机偏航」移到两端，寻找卷带从端面转到侧面的过程。
- 播放后调节「展开速度」；零值会固定在原作第 2 秒附近的初始构图。

## 性能与运行方式

每个像素最多进行 128 次场查询；命中后的法线还需要四次查询，阴影最多 24 次，环境光遮蔽再查两次。每次场查询组合三组错相位螺旋，因此本例比平面图案更依赖 GPU 算力。降低画质会减少绘制像素数；四个控制不会增加几何 Mesh 数量。

默认使用 WebGPU，浏览器不支持时使用 WebGL2 后备。降动效偏好先显示海报，用户可主动播放；页面隐藏时运行时停止绘制，自适应 DPR 会在持续慢帧时降低分辨率。验证范围和性能基线见同目录 VALIDATION.md；浏览器模拟移动视口不等于实体手机。

## 来源与许可

原作完整旧镜像来自 [GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/Ns3XWf.json)：README 标注初始下载于 2024-10-05，文件提交于 2025-05-29；历史 272 likes / 11171 views 的确切采样日期未知。2026-09-24 已完整审阅唯一 Image pass，未见自定义许可证或外部素材，故按 **CC BY-NC-SA 3.0（基于旧镜像快照）** 判断。当前原作页面返回 HTTP 402，未核验当前版本；用户已明确批准按此证据继续。

原始 GLSL、TSL 改编与衍生预览媒体遵循来源许可；独立中文赏析 CC BY-NC-SA 4.0，站点永久非商业。完整来源与批准记录在同目录 LICENSE.md。
