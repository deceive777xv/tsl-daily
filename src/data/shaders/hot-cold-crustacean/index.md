---
title: 冷暖壳纹
subtitle: 把坐标扭成壳，再让三个颜色通道接力改变褶皱
description: 拆解 TheGrego 的 Hot and Cold Crustacean，以径向旋转、周期折叠和逐通道坐标递进，在二维平面画出冷暖交替的层叠壳纹。
publishedAt: 2026-10-17
difficulty: 入门
caseType: 授权移植
tags:
  - 径向扭转
  - 周期折叠
  - 通道递进
  - 颜色外插
source:
  title: Hot and Cold Crustacean
  author: TheGrego
  url: https://www.shadertoy.com/view/ltXyzS
  license: CC BY-NC-SA 3.0（基于旧镜像快照）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 固定镜像提交 2025-05-29；唯一 Image pass 无自定义限制；历史 35 likes / 54519 views，统计采样日未知；2026-10-17 用户明确批准
preview:
  poster: /previews/hot-cold-crustacean.webp
  loop: /previews/hot-cold-crustacean.webm
  alt: 青蓝色外缘包围层层卷曲的深色壳纹，细密褶皱从下方中心向外展开
---

## 先看见什么

画面像一层层卷起的甲壳：外侧出现大片青蓝或暖黄，内侧是密集的暗纹，弯曲边缘似乎带着金属光泽。这里没有三维壳模型、灯光或图片，所有立体感都来自二维坐标变化和颜色计算。

原作 **Hot and Cold Crustacean — TheGrego（ltXyzS）** 只有 27 行。本页从原作第 7 秒的蓝色构图开始，保留其随时间变暖、变冷的方式。与「光栅涌流」分别计算三个相位不同，这里的 R、G、B 会依次修改同一份坐标；与「叠环流彩」累加不同尺度的光环不同，这里的壳纹主要由坐标乘法、周期折叠和颜色外插构成。

## 一步一步拆开

### 1. 把原点放在画面下方中央

通常我们会把画面中心设为原点，这个作品却把原点放在底边中央。横坐标经过宽高比修正，纵坐标从零走到二，因此壳纹从下方展开。改变原点会改变整幅构图，不能为了习惯而把纵坐标也减一。

```ts
const p = uv().mul(2).sub(vec2(1, 0)).toVar();
p.x.mulAssign(resolution.x.div(resolution.y));
const radius = length(p).toVar();
```

`toVar()` 创建着色器中的可变局部变量。这里的 `p` 会在多个步骤中反复改变；`radius` 保存变形前的半径，后面用它作为除数。

### 2. 越远的位置，旋转得越多

让旋转角度等于半径乘以 0.5，同一条径向直线就会被弯成曲线。原作写的是 `uv *= mat2(c, s, -s, c)`，这是行向量乘矩阵；展开后是顺时针旋转。若写成矩阵乘向量，纹路会反向。

```ts
const angle = radius.mul(twist);
const c = cos(angle),
  s = sin(angle);
p.assign(vec2(p.x.mul(c).add(p.y.mul(s)), p.y.mul(c).sub(p.x.mul(s))));
p.mulAssign(p.div(max(radius, 0.000001)).mul(detail));
```

最后一句是逐分量相乘，相当于分别计算 `x² / radius` 和 `y² / radius`，再乘细度。它不是把坐标简单归一化，也不是只放大半径。除数下限只处理原点附近的零长度；在原点，连续延拓的结果设为零。

### 3. 把周期距离变成纵向压缩

`mod(p, 0.5)` 把坐标折回半单位宽的小格，再减去与横坐标有关的偏移，得到反复出现的距离纹样。它进入正弦后决定纵坐标的乘数，制造壳纹的褶皱。

```ts
const fold = length(mod(p, 0.5).sub(p.x.mul(0.25))).toVar();
p.y.mulAssign(
  sin(fold.mul(frequency))
    .mul(0.5)
    .mul(
      sin(time.sub(length(p).mul(0.5)))
        .add(Math.PI)
        .mul(0.4),
    )
    .mul(compression),
);
```

两组正弦各有用途：第一组随周期距离起伏，控制细纹；第二组随时间和当前半径变化，让形状缓慢呼吸。`mod` 必须保留 GLSL 的向下取整定义，负坐标的结果不能替换成 JavaScript 的 `%`。

### 4. 让 R、G、B 使用接力后的坐标

原作循环三次，每次先执行上一步的纵向压缩，再写一个颜色通道。第一次改变后的坐标继续交给第二次，第二次再交给第三次。把每个通道都从最初的 `p` 重新计算，会丢掉细密的层次和色差。

```ts
const color = vec3(0).toVar();
for (const [channel, component] of ['x', 'y', 'z'].entries()) {
  // 先执行上面的 fold 与 p.y.mulAssign；下一轮继续使用这个 p。
  const phase = channel === 0 ? float(1) : pow(length(p), channel * 0.25);
  color[component as 'x' | 'y' | 'z'].assign(cos(time.add(phase)));
}
```

这个 JavaScript 循环在构建 TSL 节点时展开成固定三组指令，像素运行时不需要动态循环。三个指数分别是 0、0.25、0.5；第一项直接写成一，避开某些后端对 `pow(0, 0)` 的未定义处理，同时保持零次幂的预期结果。

### 5. 允许颜色走过头，再截到显示范围

最终把三个余弦通道与由纵坐标生成的灰色混合，权重是当前半径的一半。这个权重可能超过一，因此 `mix` 会外插，越过两种颜色的范围；大片冷暖色区和深色内侧也来自这里。提前把权重限制在零到一，会明显改变原作。

```ts
const displayRGB = mix(color, vec3(p.y.mul(0.5)), length(p).mul(0.5));
return sRGBTransferEOTF(clamp(displayRGB, 0, 1));
```

原作的 `pow(uv.y, 1.0)` 在数学上就是 `uv.y`。运行版直接保留有符号纵坐标，避免负底数进入 `pow`；最终才裁剪 RGB 到显示范围。随后解码一次显示用 RGB，让站点 renderer 的 sRGB 编码还原预期颜色。这些处理与原点下限都在许可证档案中记录，原始 GLSL 快照保持不变。

## 参数怎么读

| 参数     | 建议观察                                               |
| -------- | ------------------------------------------------------ |
| 流动速度 | 零值停在原作第 7 秒；动画同时改变压缩波和冷暖颜色      |
| 径向扭转 | 从零逐渐增加，看原来的坐标方向如何弯成壳纹             |
| 纹理细度 | 降低后观察大轮廓，提高后比较内侧细纹和外侧色区         |
| 褶皱频率 | 只改变周期距离进入正弦的倍率，高值更容易出现密纹和锯齿 |
| 纵向压缩 | 改变每个通道的坐标乘数，观察变化如何传到后续颜色通道   |

参数在原作基础上增加，默认值对应原作。海报取默认第 7 秒，短循环来自实际 TSL WebGPU 画面；为使循环接头连续，媒体使用一小段正放后倒放，实时画面始终按正时间运行。

## 性能观察

每个像素只有二维数学和固定三次通道递进，没有纹理采样、三维步进或额外渲染 pass。细密的 `sin`、`cos`、`pow` 仍有像素成本，条纹频率高时也会出现采样锯齿；这里不把它称为经过抗锯齿处理的材质。

本机在 Chromium 151、Ryzen 9 7950X3D / RTX 4080 SUPER 上，分别检查桌面、移动模拟的实际非 fallback WebGPU 和 WebGL2。每组预热 3 秒后记录 120 个 RAF 间隔，平均 6.06 ms、P95 6.1 ms；这些是浏览器调度间隔，不等于 GPU 执行耗时或真机手机性能。默认源画面与两后端已对照，仍有少量像素分量差异，未宣称逐像素相同。

移动模拟的自动 DPR 达到 1.5，受控主线程负载下桌面自动 DPR 从 1 降到 0.8。减少动态效果时先显示海报，用户可手动播放；受控隐藏事件下暂停提交、恢复后继续运行。实际切换标签时，自动化浏览器仍报告 `document.hidden=false`，因此**原生后台标签页暂停未验证**，不能用受控事件代替这项证明。参数恢复和完整验证边界见 `VALIDATION.md`、`performance.json` 与 `browser-evidence.json`。

## 许可与来源

用户于 **2026-10-17** 明确批准了完全相同的原作标题和大小写敏感 ID，接受按旧镜像证据继续。固定来源是 [GabeRundlett/shadertoy-api-shaders 的 ltXyzS.json](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/ltXyzS.json)：README 记载初始抓取于 2024-10-05，文件提交于 2025-05-29，本次完整核查于 2026-10-17。

旧快照记录 **35 likes / 54,519 views**，具体统计采样日未知，不能作为当前热度。唯一 Image pass 的 27 行及全部元数据没有自定义许可证、限制性声明、外部素材或第三方源码署名；按 **Shadertoy 默认 CC BY-NC-SA 3.0（基于旧镜像快照）** 判断。当前原作页面未能核实，不把默认判断写成作者新的明确许可。

原作与 TSL 移植遵循该来源许可；中文赏析和原创预览采用 CC BY-NC-SA 4.0，框架为 MIT，站点永久非商业。完整审核、原始字节哈希、修改说明和批准记录见 `LICENSE.md`。
