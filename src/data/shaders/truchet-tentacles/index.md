---
title: 曲管织境
subtitle: 把三段弯管放进一个格子，让八种朝向织出立体通路
description: Truchet Tentacles 用三维 Truchet 拼接与超椭圆截面，把简单的四分之一弯管组合成连续空间，再用广角穿行、法线和环境反射显出体积。
publishedAt: 2026-10-25
difficulty: 进阶
caseType: 授权移植
tags:
  - 三维 Truchet
  - 超椭圆截面
  - 距离场步进
  - 有限差分法线
  - 环境反射
source:
  title: Truchet Tentacles
  author: WAHa_06x36
  url: https://www.shadertoy.com/view/ldfGWn
  license: CC BY-NC-SA 3.0（基于旧镜像快照）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 固定镜像初抓 2024-10-05、文件提交 2025-05-29；2026-10-25 全文审阅并获批；历史 268 likes / 41870 views，采样日未知；无自定义许可，采用默认 CC BY-NC-SA 3.0；原环境贴图改为本地生成
preview:
  poster: /previews/truchet-tentacles.webp
  loop: /previews/truchet-tentacles.webm
  alt: 青紫与浅金色的圆角方管相互穿插，弯曲通路向画面深处延伸
---

## 先看见什么

眼前是一片彼此绕开的弯管：近处的管壁圆润，远处的通路一层层缩小，表面的青、紫、金色随位置缓慢改变。相机持续旋转、穿行，原本简单的弧段便像一座没有尽头的立体迷宫。

这些管道没有模型文件。每个格子只放三段弯管，再根据格子坐标选择一种朝向。拼接端点的位置保持一致，局部变化便能组合成大范围的连续结构。已有「逐格方境」用 DDA 在实体格子间前进；这里的格子用于安排弯管，射线仍沿连续距离估计前进。「孔隙方城」的递归缩放也不同于这里固定尺度的拼接。

本例按批准范围保留原作几何与相机，**使用本地生成的环境立方体贴图替换授权未核实的原输入图**。下述金属般外观来自艺术化明暗与环境叠加，不是完整的物理金属模型。

## 一步一步拆开

### 1. 先从一段四分之一弯管开始

取 `length(p.xy)` 得到到 Z 轴的半径。减去 `0.5`，就是离半径为半格的圆弧中心线有多远；`p.z - 0.5` 表示离截面中心高度有多远。把这两个量放进二维截面公式，就能围绕圆弧长出管壁。

```ts
const q = abs(vec2(length(point.xy).sub(0.5), point.z.sub(0.5)));
return pow(pow(q.x, shape.y).add(pow(q.y, shape.y)), float(1).div(shape.y)).sub(shape.x);
```

`shape.x` 是半厚度，`shape.y` 是指数。指数为 2 时接近圆截面；默认 8 则像圆角方形，平面更宽、转角更集中。这里得到的是 Lp 截面距离估计，不能把所有指数都当成精确欧氏距离。默认仍沿用原作的步进方式。

### 2. 用三个弧段和八种朝向填满空间

同一个弧段交换坐标、翻转一部分分量，便能分别绕不同轴弯曲。对三个弧段取 `min`，一个格子的结构就完成了。

```ts
const local = fract(point);
const grid = floor(point);
const oriented = local.toVar();
// 原作哈希选出八种交换/翻转之一，再交给三弧段组合。
If(random.lessThan(2 / 8), () => {
  oriented.assign(vec3(local.x, float(1).sub(local.y), local.z));
});
return cell(oriented, shape);
```

以上片段只展示一种翻转；完整实现保留八个互斥区间与原作顺序。`floor` 决定用哪一格的朝向，`fract` 把查询点送回单位格子。它没有保存随机地图：同一格坐标总会算出同一结果。哈希中的大乘数对浮点差异敏感，来源对照会保留实际差异，不能预先承诺所有后端逐像素相同。

### 3. 让射线走进距离场

每个像素先获得一条观察方向。射线查询弯管距离，再按这个距离前进；接近表面时提前退出。原作先移动、后检查刚采到的距离，这个顺序也保留。

```ts
Loop(64, ({ i }) => {
  const distance = field(position, shape).toVar();
  position.addAssign(ray.mul(distance));
  If(abs(distance).lessThan(0.001), () => {
    hitIteration.assign(float(i));
    Break();
  });
});
```

相机矩阵按 GLSL 的列顺序构造，并连续平方两次，得到原作的四次变换。默认射线的 XY 分量乘 2，Z 分量使用 `-1 + dot(screen, screen)`，因此带有广角弯曲感。源码中名为 `Fisheye` 的宏只出现在注释方案里，本移植没有把它误当成生效参数。

### 4. 用法线、位置色与环境显出管壁

在命中位置及 XYZ 三个微小偏移处查询距离，差值组成前向差分梯度。归一化后，它近似指向表面外侧。

```ts
const normal = gradient.div(max(length(gradient), 0.00000001));
const facing = pow(max(0, dot(normal, ray.negate())), 2);
const light = float(1).sub(hitIteration.div(64)).mul(facing).mul(1.4);
const color = cos(position.div(2)).add(2).div(3);
```

朝向视线的表面较亮，步数较多的位置较暗。这个步数项是深度感的启发式，不是真正的环境遮蔽积分。余弦位置色让空间从青紫过渡到金绿；反射方向逐分量立方后再查环境，属于艺术化扭曲。

替换环境由六张 128×128 图面现场生成，只含天空渐变和柔和光斑，不请求网络图片。Three.js 的立方体采样节点会翻转上传图像的 X 方向，调用处做相应补偿，以便与使用同一生成环境的原始 GLSL 对照。材质释放时同步释放贴图。最终 RGB 先限制到显示范围，再解码交给共享渲染器输出，避免重复 sRGB 编码。

### 5. 把参数当作观察工具

- **穿行速度**：缩放相机时间；设为零观察原作第 2 秒。
- **管道半厚**：比较细管之间的空隙和厚管之间的遮挡。
- **截面方度**：在圆形与圆角方形之间观察法线和亮带怎样变化。
- **取景宽度**：改变屏幕射线分量，观察近处弯管与远处通路的比例。
- **环境反射**：只调整生成环境的叠加量，便于分辨几何明暗和反射细节。

## 性能与证据边界

主射线最多 64 次查询，法线额外需要 4 次，每次距离查询组合 3 个弧段。五个参数不增加这些上限；细管、尖角与视角会改变实际迭代次数。环境图只在案例创建时生成一次。默认使用 WebGPU，后备为 WebGL2；自适应 DPR 在负载高时降低绘图像素数。

本机 RTX 4080 SUPER 的实际非回退 WebGPU 与强制 WebGL2，在桌面和移动模拟四组中各预热 3 秒、采样 120 个 RAF 间隔：平均均为 6.06ms，P95 为 6.1–6.2ms。受控主线程负载下自动 DPR 从 1 降至 0.9。RAF 只反映浏览器调度，不是 GPU 耗时，移动模拟也不代表真实手机。

使用同一生成环境的默认画面中，原始 GLSL 与 TSL WebGL2 的平均 RGB 字节差约 0.0222；WebGPU 与 WebGL2 仍有稀疏局部差异。完整指标、参数恢复、奇数尺寸与媒体记录见来源目录的 `VALIDATION.md`、`performance.json` 和 `browser-evidence.json`。

本机原生切换标签页时没有观察到 `document.hidden=true`，因此**原生后台标签页暂停未验证**。受控隐藏事件下提交数在 800ms 内保持不变，恢复事件后继续；它只证明事件处理路径，不能替代原生后台证据。

## 来源与许可

原作 **Truchet Tentacles — WAHa_06x36（ldfGWn）**，固定旧镜像保留唯一 Image pass 的完整 GLSL 与元数据。全部 110 行未发现自定义许可、额外限制或声明复制的上游代码；按用户批准的流程采用 Shadertoy 默认 **CC BY-NC-SA 3.0（基于旧镜像快照）**。这不是源码中的显式授权，也不是当前作者确认。历史 268 likes / 41870 views 的采样日期未知；本次原作页面返回 HTTP 402，未绕过访问控制。

2026-10-25 用户批准该唯一候选及本地环境替换方案，仅授权一次独立 PR；合并与发布由用户决定。原作与 TSL 改编遵循来源 CC BY-NC-SA 3.0，中文原创说明与生成媒体按 CC BY-NC-SA 4.0 分发，框架 MIT，站点永久非商业。完整日期、哈希、资产替换和许可范围见同目录 `LICENSE.md`。
