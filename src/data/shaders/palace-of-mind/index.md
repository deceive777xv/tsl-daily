---
title: 蓝构心殿
subtitle: 把三向柱体折进空间，再用法线和光带描出层层梁架
description: 拆解 butadiene 的 Palace of Mind，用交叉柱体距离场、四轮空间折叠、四面体法线和周期光带，画出深蓝色的层叠梁架。
publishedAt: 2026-10-18
difficulty: 进阶
caseType: 授权移植
tags:
  - 距离场组合
  - 空间折叠
  - 法线估计
  - 自发光条纹
source:
  title: Palace of Mind
  author: butadiene
  url: https://www.shadertoy.com/view/wttXDl
  license: CC BY-NC-SA 3.0（基于旧镜像快照）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 固定镜像提交 2025-05-29；唯一 Image pass 无自定义限制；历史 48 likes / 56998 views，统计采样日未知；2026-10-18 用户明确批准
preview:
  poster: /previews/palace-of-mind.webp
  loop: /previews/palace-of-mind.webm
  alt: 深蓝色梁柱在空间中交叉折叠，细亮光带沿着层层方形结构流动
---

## 先看见什么

画面像一座没有尽头的蓝色殿堂：粗细不同的梁架互相穿过，远处密集地重复，亮蓝条纹在暗色表面上移动。它没有模型文件或纹理图片，梁柱、光照和光带都由每个像素里的数学计算产生。

原作 **Palace of Mind — butadiene（wttXDl）** 只有一个 Image pass。本页从原作第 2 秒开始，保留蓝色、四轮折叠和 100 次步进上限。空间重复、折叠和射线步进在已有案例中出现过；与「青焰折境」按近表面采样次数累色不同，这里找到表面后估计法线，再计算高光与独立的移动条纹。

## 一步一步拆开

### 1. 用三个无限长方柱拼出十字骨架

先想象一根沿 Z 轴无限延伸的方柱。判断一个点离柱面多远，只需查看它的 XY 坐标：先对坐标取绝对值，得到它与方形边界的关系；外部用角点距离，内部用带负号的最近边界距离。

```ts
const q = abs(p).toVar();
const inside = max(vec2(width).sub(q), 0).toVar();
return length(max(q.sub(width), 0)).sub(min(inside.x, inside.y));
```

`toVar()` 创建着色器中的局部变量。这个函数输入的是二维坐标；分别传入三维点的 `xy`、`yz`、`zx`，就得到朝三个轴延伸的柱体。对三个距离取 `min` 表示并集，形成互相交叉的骨架。

```ts
const d = min(min(column(p.xy, width), column(p.yz, width)), column(p.zx, width));
```

这是方柱的有符号距离：柱体内为负，外部为正。调低「梁柱半宽」，先观察最基本的细梁结构，再加回折叠层数。

### 2. 先记住单元身份，再折叠空间

原作先用未变形的坐标划分空间，为每个单元生成一个固定的伪随机值。它控制旋转方向、移动速度和折叠偏移。顺序很重要：如果在变形后重新计算单元编号，同一个位置可能突然换到另一组运动规则。

随后旋转 XY、沿 Z 移动，用 `mod` 将坐标放回小单元，放大七倍，再执行四次折叠。折叠是在计算距离前移动采样点，相当于让同一个简单柱体在许多位置出现。

```ts
Loop(5, ({ i }) => {
  If(float(i).greaterThanEqual(settings.z), () => {
    Break();
  });
  p.assign(
    abs(p)
      .sub(0.4)
      .add(
        seed
          .mul(0.1)
          .add(0.25)
          .mul(sin(time.mul(seed.add(0.5)))),
      ),
  );
  p.xy.assign(rotate(p.xy, time.mul(seed.add(0.7))));
  p.yz.assign(rotate(p.yz, time.mul(1.3).add(seed)));
});
```

循环最多五轮，默认第四轮后退出；这是为了给「折叠层数」留出观察空间。`abs` 把负半轴翻到正半轴，减法重新移开折面，旋转改变下一轮的方向。末尾把距离除以七，补回前面坐标放大的比例。这里保留 GLSL `mod` 的向下取整定义，不能替换成 JavaScript 的 `%`。

### 3. 从游走相机发出射线

相机一边绕着目标旋转，一边沿 Z 轴前进。每个像素的二维坐标组合相机的侧向、上向和前向，形成一条三维射线。原作的侧向、上向叉积没有再次归一化，移植也保留这一点，以免悄悄改变视野。

```ts
const ray = normalize(side.mul(p.x).add(up.mul(p.y)).add(forward.mul(1.3)));
const distance = float(0.1).toVar();
Loop(100, () => {
  const step = field(origin.add(ray.mul(distance)), settings).toVar();
  distance.addAssign(step);
  If(step.lessThan(0.0001), () => {
    Break();
  });
});
```

`field` 返回当前位置到骨架的距离估计。沿射线前进这一距离，再查询下一点，最多一百次。这里先更新距离再判断退出，并保留有符号步长；把步长改成绝对值，或者加上原作没有的远距离退出条件，都会改变一些边界和穿入表面的行为。

### 4. 找到表面后，用法线区分梁柱朝向

距离本身只告诉我们离表面多远。为了让梁柱显出立体面，原作在表面附近取四个沿四面体方向偏移的样本，把它们组合成距离场的梯度，再归一化为法线。

```ts
const k = vec2(1, -1);
const gradient = k.xyy
  .mul(field(point.add(k.xyy.mul(0.001)), settings))
  .add(k.yyx.mul(field(point.add(k.yyx.mul(0.001)), settings)))
  .add(k.yxy.mul(field(point.add(k.yxy.mul(0.001)), settings)))
  .add(k.xxx.mul(field(point.add(k.xxx.mul(0.001)), settings)));
const n = gradient.div(max(length(gradient), 0.00000001));
```

把法线与视线做点积，得到面朝相机的程度；把光线反射方向与视线做点积，再取 20 次幂，形成较窄的高光。原作没有阴影或完整的物理材质，这些简单明暗已经能让细梁与背景分开。梯度退化到零时没有确定的法线，运行版返回零向量，避免零长度归一化产生无效值。

### 5. 把发光条纹和蓝色远景加到表面上

光带单独使用命中位置计算：由空间单元的两个伪随机值决定条纹方向，将斜向坐标加上时间，再按半单位周期折回。靠近周期中央时，距离的倒数变大，得到细亮条纹。

```ts
const stripe = clamp(float(0.001).div(max(stripeDistance, 0.000001)), 0, 1);
const surfaceRGB = clamp(
  surface
    .mul(vec3(0.3, 0.5, 0.9))
    .mul(0.7)
    .add(vec3(0.2, 0.2, 1).mul(stripe).mul(emission)),
  0,
  1,
);
```

分母恰好为零时，原作的倒数会趋向饱和亮带；下限把这个饱和极限写成有限运算。将「条纹亮度」设为零，可以看出光带并没有参与法线计算，也没有真的照亮附近的梁柱。

最后根据射线长度，把表面混向蓝色背景。原作还对 RGB 取 2.2 次幂后乘二，压暗低亮度、保留亮蓝细节；这里保留这一调色，再在共享 renderer 的 sRGB 输出前解码一次。原作 alpha 写的是 `1.1 - distance`，本页使用不透明 RGB 展示，原始 alpha 仍完整保存在 GLSL 快照中。

## 参数怎么读

| 参数     | 建议观察                                             |
| -------- | ---------------------------------------------------- |
| 游走速度 | 零值停在第 2 秒；相机、折叠和条纹共用这一时间        |
| 梁柱半宽 | 比较细密骨架与厚重梁架，观察表面高光怎样跟着移动     |
| 折叠层数 | 从一层逐步增加，看重复结构怎样叠成复杂空间；默认四层 |
| 条纹亮度 | 先归零观察表面，再加回光带，分辨两种亮度来源         |
| 远景深度 | 观察远处结构淡入蓝色背景的位置；它不改变步进预算     |

默认值对应原作第 2 秒。正式海报和短循环取自真实 TSL WebGPU 画面；媒体片段用一小段正放后倒放连接，实时画面始终按正时间运行。

## 性能观察

主要成本是每像素最多 100 次距离场查询；每次又执行默认四轮折叠和旋转。表面法线额外查询四次同一个距离场，此外还有光照与条纹计算。增加折叠层数会增加每一次距离查询的工作，增加远景深度只改变混色，不能简单等同于增加步进次数。

本机 Chromium 151、Ryzen 9 7950X3D / RTX 4080 SUPER，在桌面和移动模拟分别验证实际非 fallback WebGPU 与 WebGL2。每组预热 3 秒后记录 120 个 RAF 间隔，平均 6.06 ms，P95 6.1–6.2 ms。这些是浏览器调度间隔，不是 GPU 执行时间或真实手机性能；不能据此断言更复杂的折叠没有额外成本。

默认第 2 秒的原始 GLSL → TSL WebGL2 平均 RGB byte 差为 0.01364；WebGPU → WebGL2 为 2.93126，部分远景结构存在可见差异。已保留默认前景梁架与蓝色光带的对照，没有承诺逐像素一致，也没有把差异归因于已被证明的单一原因。该比较不覆盖所有时间和参数。

移动模拟自动 DPR 为 1.5；受控主线程负载下桌面自动 DPR 从 1 降到 0.8。减少动态效果时先显示正式海报，用户可手动播放。受控隐藏事件下 800 ms 内 GPU 提交次数保持不变，恢复后继续提交；实际切换标签仍报告 `document.hidden=false`，因此**原生后台标签页暂停未验证**。完整数据和参数恢复结果见 `VALIDATION.md`、`performance.json` 与 `browser-evidence.json`。

## 许可与来源

用户于 **2026-10-18** 明确批准完全相同的标题和大小写敏感 ID。来源是 [GabeRundlett/shadertoy-api-shaders 的固定 wttXDl.json](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/wttXDl.json)：README 记载初抓于 2024-10-05，文件提交于 2025-05-29，本次完整核查于 2026-10-18。

历史 **48 likes / 56,998 views** 的具体统计采样日期未知，不能当作当前热度。完整唯一 Image pass 的 131 行及全部元数据未见自定义许可、额外限制、外部素材或已声明的第三方源码来源。按 **Shadertoy 默认 CC BY-NC-SA 3.0（基于旧镜像快照）** 判断，未声称取得作者新的明确许可；当前原作页面未核验。

原作和 TSL 移植遵循该来源许可，中文赏析与原创预览采用 CC BY-NC-SA 4.0，框架 MIT，站点永久非商业。审批、原始字节哈希与修改说明见 `LICENSE.md`。
