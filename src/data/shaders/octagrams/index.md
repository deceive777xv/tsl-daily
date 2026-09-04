---
title: 八角回廊
subtitle: 把六个盒状距离场重复折叠，再沿光线积累成发亮的阿拉伯纹样
description: Octagrams 用一个很短的 raymarch 循环，把重复空间、旋转盒体和指数辉光叠成一条没有尽头的几何回廊。
publishedAt: 2026-09-03
difficulty: 高级
caseType: 授权移植
tags:
  - SDF
  - Raymarching
  - 空间重复
source:
  title: Octagrams
  author: whisky_shusuky
  url: https://www.shadertoy.com/view/tlVGDt
  license: CC BY-NC-SA 3.0（Shadertoy 默认许可）
  licenseUrl: https://creativecommons.org/licenses/by-nc-sa/3.0/
  evidence: 2025-05-29 API 快照；源码顶部无自定义许可证；609 likes / 460252 views
preview:
  poster: /previews/octagrams.webp
  loop: /previews/octagrams.webm
  alt: 蓝绿色发光的八角几何纹样在深色无限回廊中重复延伸
---

## 先看见什么

你看到的不是一只建模完成的八角星，而是一束光线在重复空间里不断采样的结果。盒状距离场相互穿插，靠近表面的采样点被指数函数放大，于是轮廓像霓虹一样留在回廊里。

## 一步一步拆开

### 1. 一个盒子的有符号距离

`sdBox` 先计算点到盒子各轴边界的差。盒子外部用正距离表示，内部用负距离表示；这既能指导 raymarch 前进，也能成为造型函数的基础。

```ts
const q = abs(point).sub(bounds);
return length(max(q, 0)).add(min(max(q.x, max(q.y, q.z)), 0));
```

### 2. 六次摆放形成八角骨架

四个盒子分别沿 x、y 方向往复移动，另外两个留在中心并放大距离值。它们都在 xy 平面旋转约 `0.8` 弧度，再用连续 `max` 合并。这里的 `max` 不是普通并集，而会留下更锐利、带镂空感的交叠边界。

### 3. 把整段空间折回四单位的小房间

每次采样后执行 `mod(position - 2, repeat) - repeat / 2`。无论相机走了多远，坐标都会回到同一个局部单元，因此一组几何就能铺出无限长廊。

### 4. Raymarch 不急着“命中”

传统 raymarch 往往在距离足够小时停止；原作却固定走 99 步，并把距离限制在至少 `0.01`。它关心的不是一次精确交点，而是一路经过表面附近时积累了多少能量。

```ts
Loop(99, ({ i }) => {
  const distance = max(abs(sceneDistance(position, phaseFor(i))), 0.01);
  accumulation.addAssign(exp(distance.negate().mul(glowFalloff)));
  travel.addAssign(distance.mul(stepScale));
});
```

### 5. 指数衰减把距离变成辉光

`exp(-distance * 23)` 让靠近表面的样本贡献最大，远处迅速衰减。所有步数相加后得到近似体积辉光，再叠一层随时间变化的蓝绿色底色。

## 可以亲手试什么

- **速度**：改变相机前进、盒体呼吸和视线摇摆的统一时间。
- **重复间距**：改变空间折叠单元大小，观察图案从密集花窗变成开阔回廊。
- **辉光衰减**：越大，线条越细；越小，雾状光晕越厚。
- **步进系数**：越小采样越密、画面更亮，也更容易在表面附近停留。

## TSL 重写要点

TSL 版本保留固定 99 步循环，并用 `toVar()`、`addAssign()` 表达可变的行进距离与能量累计。二维旋转被写成显式的 `vec2` 运算，避免把 GLSL 矩阵文本照搬进节点系统。

原作 `box()` 在求出 `base` 之后还有三行不会影响返回值的坐标变换；重写时保留实际输出语义，省略了这段死代码，并在许可档案中保留未修改的原始快照供比较。

## 性能观察

这是首发三个案例中最重的一个：每像素固定 99 次 SDF 计算，没有提前退出。运行时会自动降低高分屏 DPR；移动设备默认以约 30 fps 为调节目标。探索参数不会改变循环上限，因此性能边界可预测。

## 许可说明

热度和许可证据来自最后更新于 2025-05-29 的公开 API 镜像。快照源码顶部没有自定义许可证，故移植按 Shadertoy 默认 CC BY-NC-SA 3.0 处理；这不是对 2026 年实时页面状态的冒充，若当前源码顶部出现新声明，必须重新审核。
