---
title: 青焰折境
subtitle: 把空间折成青绿色隧道，再数一数视线经过了多少次表面附近
description: MONSTER 用六扇区重复、随纵深编号变化的空间折叠和近表面计数，构成青色隧道，再以独立的绿色切片光打亮棱边。
publishedAt: 2026-10-16
difficulty: 进阶
caseType: 授权移植
tags:
  - 极坐标重复
  - 空间折叠
  - 单元编号
  - 距离场步进
  - 阈值累光
source:
  title: MONSTER
  author: butadiene
  url: https://www.shadertoy.com/view/WtKSzt
  license: CC BY-NC-SA 3.0（基于旧镜像快照）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 固定镜像初抓 2024-10-05、文件提交 2025-05-29；2026-10-16 完整单通道审阅并获批；历史 129 likes / 61041 views，指标精确采样日期未知；无自定义许可或第三方源码引用
preview:
  poster: /previews/monster.webp
  loop: /previews/monster.webm
  alt: 青绿色折叠结构围绕中心隧道旋转，黑色空隙之间有明亮的绿色光片
---

## 先看见什么

青色棱面沿着中心卷成隧道，绿色亮片从结构之间扫过。画面像堆满透明晶体，实际没有玻璃模型、贴图或真实折射。每个像素只发出一条射线，在经过复杂场函数时累计颜色。

先把「绿色光片」降为零，再提高「近表面光厚」。你会看到两种亮度来源分开：青色由采样计数产生，绿色由射线最终位置的一组纵深切片产生。

它与「幻星晶廊」共享极坐标重复、绝对值折叠和沿视线步进；与「八角回廊」「螺旋能核」也属于同一技术家族。本例重点是**用纵深单元编号制造变化，以及用阈值计数代替指数衰减累光**。极坐标重复或 IFS 并不是本例才出现的方法。

## 一步一步拆开

### 1. 先把视线绕中心转起来

将 UV 移到 `[-1, 1]`，按高宽比缩放 Y，再随时间旋转。相机在 `(0, 0, 0.1)`，射线朝向屏幕平面。移植从原作第 2 秒开始，恢复默认参数会回到这一构图。

```ts
const screen = uv().mul(2).sub(1).toVar();
screen.y.mulAssign(resolution.y.div(resolution.x));
screen.assign(rotate(screen, time));
const origin = vec3(0, 0, 0.1);
const ray = normalize(vec3(screen, 0).sub(origin));
```

原作是矩阵左乘向量：`mat2(c, s, -s, c) * p`，对应 `x'=cx-sy`、`y'=sx+cy`。显式写出两行运算，能避免移植时把旋转方向翻转。

### 2. 把整个圆周折回一个扇区

查询位置先沿 Z 平移，再按 Z 值旋转 XY。随后用角度取模，把圆周压回一个扇区；默认六个扇区，于是同一局部形状绕中心出现六次。

```ts
const sector = float(Math.PI * 2).div(settings.y);
const radius = length(p.xy).toVar();
const angle = float(0).toVar();
If(radius.greaterThan(0.00000001), () => {
  angle.assign(atan(p.x, p.y));
});
angle.assign(mod(angle.sub(sector.mul(0.5)), sector).sub(sector.mul(0.5)));
p.xy.assign(vec2(cos(angle), sin(angle)).mul(radius));
```

这里保留原作 `atan(x, y)` 的参数顺序。半径为零时，角度不影响最终零向量；移植显式取零，避免 `atan(0,0)` 在不同后端得到不稳定结果。

### 3. 让每段纵深拥有不同的折叠方式

在坐标取模之前保存 `floor(z * 0.7)`，作为变化较慢的纵深编号。它每约 `1.43` 个世界单位变化一次，与后面边长 `0.7` 的重复网格不是同一尺度。取模之后，局部坐标落在同一个小区域，而保存的编号仍能参与每层旋转，让重复空间保留层与层的变化。

```ts
const cell = floor(p.z.mul(0.7)).toVar();
p.assign(mod(p, 0.7).sub(0.35));
Loop(6, ({ i }) => {
  If(float(i).lessThan(settings.z), () => {
    p.assign(abs(p).sub(0.3));
    p.xy.assign(rotate(p.xy, cell.add(1).add(settings.x.mul(0.1))));
    p.xz.assign(rotate(p.xz, cell.mul(4.7).add(1).add(settings.x.mul(0.3))));
  });
});
```

默认只执行四层折叠。最后分别测量到方盒和球的距离，取较小值组合形状。这里查询的是**变换后的场函数**，不应把它说成对整个复杂空间都严格精确的距离。

### 4. 数一数射线有多少次靠近表面

射线从距离 2 开始，固定推进 66 次。每次把场值乘 `0.2` 再取绝对值，并继续向前；当步长小于阈值，就为累计值增加 `0.1`。

```ts
Loop(66, () => {
  const distance = abs(field(origin.add(ray.mul(travel)), settings).mul(0.2)).toVar();
  travel.addAssign(distance);
  If(distance.lessThan(proximity.mul(0.001)), () => {
    accumulated.addAssign(0.1);
  });
});
```

这不是首次命中就停止的表面着色。射线在表面附近走得慢，符合条件的采样多，就更亮；原作甚至允许步长为零，余下采样会重复计数。移植保留这一行为，未另加最小步长。青色贡献为 `vec3(0.1, 0.7, 0.7) * 0.2 * accumulated`，没有光照法线或指数雾。

### 5. 用最终落点加一层绿色光片

将最终位置的 Z 值减去另一套时间偏移，再以 `0.5` 为周期取模。正半段用倒数产生亮片，负半段不发光。它与青色采样计数独立，因此能用参数单独关闭。

```ts
const slice = mod(position.z.sub(time.mul(1.5)), 0.5)
  .sub(0.25)
  .toVar();
const emission = slice.greaterThanEqual(0).select(min(float(0.01).div(max(slice, 0.0001)), 100), 0);
```

原式为 `clamp(0.01 / slice, 0, 100)`。在正侧小于等于 `0.0001` 时，它原本就饱和到 100；移植保留这段饱和区，在恰好为零处取正侧极限，避免除零。把青色和绿色贡献相加后限制到 `[0,1]`，再交给显示色转换。

## 可以亲手试什么

- **流动速度**：同时控制旋转、折叠变化和绿色切片移动；零值停在原作第 2 秒。
- **旋转分区**：从三到十重重复，观察同一形状怎样围绕中心展开。
- **折叠次数**：从两层到六层，比较细节密度与每次场查询的工作量。
- **近表面光厚**：只改变青色计数的距离阈值，观察变亮与几何推进之间的区别。
- **绿色光片**：设为零分离两种亮度来源；提高时观察局部饱和，而非把它当作真实灯光强度。

## TSL 重写要点

`Fn` 的显式参数传入时间、扇区数与折叠次数，`toVar()` 保存每个像素在循环中的坐标、行进距离和累计值。JavaScript 变量只负责搭建节点图，`assign()` 才表达 GPU 中的状态变化。

原作写入的 alpha 是零。本站以不透明画布呈现它的 RGB，未把 alpha 当作透明度，否则会把整个作品隐藏。原始 GLSL 保持不变；显示 RGB 先用 `sRGBTransferEOTF` 解码一次，再由共享渲染器输出到 sRGB，避免额外增亮。

## 性能观察

默认每像素进行 66 次场查询，每次四层折叠。提高「折叠次数」会增加场内旋转运算；调大「近表面光厚」不会减少或增加外层步数。画面有大量局部高对比棱边，高 DPR 的成本不能只靠步数判断。

本机使用 Ryzen 9 7950X3D、RTX 4080 SUPER 与 Chromium 151.0.7922.34，WebGPU 适配器为非 fallback 的 nvidia/lovelace。每组先预热 3 秒，再记录 120 个 `requestAnimationFrame` 间隔：

| 视口             | 后端   | 有效 DPR | 平均间隔 | P95    |
| ---------------- | ------ | -------- | -------- | ------ |
| 桌面 1440×900    | WebGPU | 1        | 6.06 ms  | 6.1 ms |
| 桌面 1440×900    | WebGL2 | 1        | 6.06 ms  | 6.1 ms |
| 移动模拟 412×915 | WebGPU | 1.5      | 6.06 ms  | 6.1 ms |
| 移动模拟 412×915 | WebGL2 | 1.5      | 6.06 ms  | 6.2 ms |

这些是本机调度间隔，不是 GPU 时间戳或真实手机性能。受控 45 ms 主线程负载下，自动 DPR 从 1 降至 0.8；减少动态效果时先显示海报，手动播放可启动 WebGPU。

受控 `visibilitychange` 验证中，暂停 800 ms 的 GPU 提交数保持 `530→530`，恢复后增加到 666。切换真实标签页时浏览器始终报告 `document.hidden=false`，因此**原生后台标签页暂停仍未验证**，不能把受控结果当作原生后台成功。完整方法和证据见 `performance.json`、`browser-evidence.json` 与 `VALIDATION.md`。

## 来源与许可

[MONSTER — butadiene（WtKSzt）](https://www.shadertoy.com/view/WtKSzt) 来自 GabeRundlett/shadertoy-api-shaders 的固定旧镜像，提交 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`。README 记载初抓于 2024-10-05，文件提交于 2025-05-29；历史 **129 likes / 61041 views** 的精确采样日期未知。

2026-10-16 完整审阅唯一 Image 通道的 70 行源码和元数据，未见自定义许可、禁止复用声明或第三方源码引用。按用户明确批准的流程，使用 **CC BY-NC-SA 3.0（基于旧镜像快照）** 判断；当前原作访问返回 402，未核验当前源码、热度或作者新声明。批准记录与 SHA256 见 `LICENSE.md`。

本站永久非商业。移植遵循来源许可，保留署名、修改说明与相同方式共享；原创中文内容和媒体采用 CC BY-NC-SA 4.0，站点框架采用 MIT。
