---
title: 清泉折光
subtitle: 让一束弯曲水流同时映出世界，也扭曲世界
description: Spout 用距离场构造抛物线水柱，再追踪入水与出水两次折射，把墙砖的变形、管口反光和水槽波纹组合成清晰的透明感。
publishedAt: 2026-10-29
difficulty: 进阶
caseType: 授权移植
tags:
  - 距离场布尔运算
  - 抛物线域变换
  - 双面折射
  - 菲涅耳反射
  - 有限差分法线
source:
  title: Spout
  author: P_Malin
  url: https://www.shadertoy.com/view/lsXGzH
  license: CC BY-NC-SA 3.0（基于旧镜像快照）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 固定镜像初抓 2024-10-05、文件提交 2025-05-29；2026-10-29 全文审阅并获批；历史 378 likes / 47656 views，采样日未知；无自定义许可，采用默认 CC BY-NC-SA 3.0；原墙地贴图改为本地生成
preview:
  poster: /previews/spout.webp
  loop: /previews/spout.webm
  alt: 银亮管口涌出的透明水柱弯向水槽，砖墙纹理在水中被折弯，落点周围泛起反光
---

## 先看见什么

水从墙上的管口涌出，沿弧线落入水槽。水柱里既有明亮天空的倒影，也有被折弯的墙砖；水槽表面的细小起伏把反光切成不断移动的碎片。形状、法线与背景之间的关系，让我们把这个表面认作水。

这个场景没有水流网格或数值流体模拟。它先用一个弯曲的距离场描述水柱，再让射线依次经过空气、水体与后方的场景。已有「碧海微澜」主要求海面高度，「双流染境」推进二维反馈状态；这里的重点是立体透明物体前后两面的光学路径。

本例按批准范围，**用全新本地生成的确定性砖纹理替换授权未核实的原 iChannel0 图像**。原始 GLSL 保留在来源档案中；运行时没有原贴图请求。默认相机保持原作静态轨道位置，五个参数用于逐项观察几何和光学变化。

## 一步一步拆开

### 1. 用距离和材质编号一起描述场景

可以把距离场看作一个函数：传入三维位置，得到离表面还有多远。`min(a, b)` 取两种形状的并集，`max(a, -b)` 从一种形状里挖去另一种形状。墙、地面与水槽先组合起来，再加入带厚度的管口。

仅有距离还无法决定颜色。实现用一个 `vec4` 同时返回距离、材质编号和二维贴图坐标。射线命中后，材质编号决定它看到砖墙、金属还是水。

```ts
const masonry = min(max(p.y, trench.negate()), p.x.add(1));
const result = vec4(masonry, 1, p.x.add(p.y), p.z);
```

这里的砖纹理只负责墙地外观：固定种子的伪随机数提供细颗粒，规则分段提供砖缝。数据纹理按数值读取；与原作一样，采样颜色先平方，再进入材质光照。

### 2. 把直水柱的坐标弯成抛物线

先考虑沿 X 轴延伸的圆柱。位置的 `yz` 长度减去半径，就是它的距离。若水的水平速度为 `v`，到达某个 X 位置的时间可以估为 `t = x / v`；在重力加速度 `a = -1` 下，竖直位移是 `a × t² / 2`。

把这个位移从查询位置中减去，就能继续使用直圆柱的公式，却让世界里的形状向下弯曲。

```ts
const travel = max(domain.x.div(flow), 0);
domain.y.addAssign(travel.mul(travel).mul(0.5));
const water = length(domain.yz).sub(0.4);
```

域变换后的距离不再处处是严格的欧氏距离。原作按下落速度缩短距离估计，减少射线跨过水面的机会；移植保留这个补偿。它是一种受运动学启发的塑形方法，并不求解流量守恒或水花颗粒。

### 3. 让相位移动，表面便开始流动

水柱与水槽共用两个正弦组成的简短噪声。水柱里的相位沿 X 方向移动，水槽里的横坐标改为到落点的径向距离，于是同一个函数能表现向外扩散的波纹。

改变的是距离场表面。用附近四个位置估计法线后，折射和高光都会跟着波纹变化。停止时间仍然能看到完整水柱，只是这些表面细节固定下来。

```ts
noiseDomain.x.subAssign(time.mul(waterSpeed));
const waves = sin(noiseDomain.mul(0.6345)).add(sin(noiseDomain.mul(1.62423)));
water.addAssign(dot(waves, vec2(0.125)).add(0.5).mul(amplitude));
```

### 4. 进入水体和离开水体，各折一次

`refract(direction, normal, ratio)` 需要两个介质折射率的比值。空气进入水时使用 `1 / ior`，离开水时使用 `ior`。第一次折射后，将水的距离符号反转，射线就可以从内部寻找出口；到达出口，再次计算法线与折射方向。

```ts
const inside = refract(direction, n, float(1).div(ior));
const exit = march(hit.xyz, inside, bias, float(16), float(0));
const exitNormal = normal(exit.xyz, float(0));
const outside = refract(inside, exitNormal, ior);
```

第二次折射后的射线只查询不透明物体和天空，避免形成递归渲染。穿过水体越远，三个颜色通道衰减越多。原作使用倒数形式的艺术化消光近似，而不是严格的 Beer–Lambert 指数吸收。

移植给接近零的偏移分母和零长度归一化加了保护。全反射仍沿用原作的零向量二级路径，没有额外模拟多次内部反射；因此这里的透射与消光是一组实用近似。

### 5. 把反射和透射按观察角度混合

同一片水面既映出天空，也让我们看见后方砖墙。原作以 Schlick 形式估计菲涅耳权重：掠射角越大，反射越明显。漫反射、方向光高光、阴影与环境遮蔽分别为砖墙和管口提供体积线索，远处再混入雾和光源辉光。

```ts
const grazing = pow(clamp(float(1).sub(dot(halfView, view.negate())), 0, 1), 5);
const fresnel = roughReflection.add(
  float(1).sub(roughReflection).mul(grazing).mul(smoothness.mul(0.9).add(0.1)),
);
return mix(mix(diffuse, transmission, transparency), specular, fresnel);
```

水的菲涅耳基准仍使用原作的 `0.01`；“折射强度”参数通过 `ior = 1 + 0.333 × strength` 单独改变折射方向，便于观察墙砖的扭曲。两者没有自动组成一套完整的物理材质模型。

## 可以怎样观察

| 参数     | 建议观察                                         |
| -------- | ------------------------------------------------ |
| 波纹速度 | 暂停并比较移动前后的高光；零值回到原作第 2 秒    |
| 出水速度 | 比较水柱弧线和落点如何随水平速度改变             |
| 波纹幅度 | 从平滑水柱到起伏表面，观察法线如何影响折射       |
| 折射强度 | 比较水柱后方的砖缝偏移，注意水的轮廓没有因此重建 |
| 取景宽度 | 拉开视野，看完整管口、水柱和水槽的关系           |

## 性能与边界

默认射线保留原作 `0..32` 的包含端点循环，即最多 33 次距离查询。反射、入水、出水后的射线、阴影和环境遮蔽都会追加查询；透明感的主要成本来自多条路径，而非砖纹理的 256×256 个像素。降低画质和自适应 DPR 可以减少需要计算的屏幕像素。

砖纹理位于按材质和射线命中结果分流的函数中，相邻像素可能走不同分支。这里使用 `texture(bricks, coordinates).level(float(0))` 显式读取基础 mip，避免在这些分支内依赖隐式屏幕导数。这个取舍让采样在两后端稳定，但远处砖纹的颗粒可能更锐利，也可能出现缩小锯齿；原始 GLSL 快照仍保留原采样方式。

本机 Ryzen 9 7950X3D / RTX 4080 SUPER / Chromium 151 的桌面与模拟移动两后端，各预热 3 秒后采集 120 次 RAF 间隔，平均约 6.06 ms、P95 为 6.1–6.2 ms；受控主线程负载下，自适应 DPR 从 1 降到 0.8。这是浏览器调度基线，不等于 GPU 执行时间或真实手机性能。实际浏览器证据、原作对照与媒体编码记录在同目录 `VALIDATION.md` 和 JSON 档案中。

2026-10-30 的 Windows / Chromium 151 原生窗口最小化测试中，页面真实报告 `document.hidden=true`；暂停稳定后，约 1.99 秒内 GPU 提交数保持 497，恢复窗口后继续到 577。原生测试与受控事件测试分别保存，验证方法和早期测量盲区见同目录 `VALIDATION.md` 与 `native-visibility.json`。

## 来源与许可证

[Spout — P_Malin（lsXGzH）](https://www.shadertoy.com/view/lsXGzH) 的固定旧镜像来自 GabeRundlett/shadertoy-api-shaders，提交 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`。README 记载初抓于 2024-10-05，文件提交于 2025-05-29；历史 **378 likes / 47656 views** 的精确采样日期未知。2026-10-29 已完整审阅唯一 Image pass 的 790 行，并获得此标题与大小写敏感 ID 的独立案例批准。

未见自定义限制，按 **CC BY-NC-SA 3.0（基于旧镜像快照）** 判断；这是用户批准的历史证据路径，不代表当前作者确认。当前原作页面返回 HTTP 402。距离函数文章与 Schlick 说明作为原源码中的概念参考保留；原墙地图片未取回，已由新生成纹理替换。

原始 GLSL 与 TSL 移植遵循来源许可；中文赏析和新生成媒体采用 CC BY-NC-SA 4.0，遵照来源许可的相同方式共享要求。框架为 MIT，站点永久非商业。完整署名、哈希、替换范围和验证限制见 `LICENSE.md`。
