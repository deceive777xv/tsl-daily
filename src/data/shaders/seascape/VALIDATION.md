# Seascape 验证记录

核查日期：2026-09-06。基于 main `2e1ba49f4e4e7bbee87d8f5e1f218edccebc06ed`，分支 `codex/seascape`。

## 自动检查

- `npm run quality`：格式、ESLint、5 案例契约、Vitest 5/5、Astro 类型检查（0 errors / 0 warnings）与生产构建通过。
- 浏览器回归包含 Seascape 强制 WebGL2 启动、显式许可和原作链接、5 个参数、浪高改变时画布像素改变、重置后像素完全恢复。
- 最终 `npm run test:browser`：桌面与移动两项目共 **16/16 通过**。
- 首次像素重置比较受画布 300 ms 淡入过渡影响；截图禁用 CSS 动画后通过。此调整只固定测试截图，不改变页面动画。
- Star Nest 原有拖动回归保留；两案例均覆盖模拟 `visibilitychange` 暂停/恢复。
- 实际新建标签页并 `bringToFront()` 的补充检查中，CLI 浏览器和独立 headed Chromium 都持续报告 `document.hidden=false`，因此未验证本机真实后台切换。暂停/恢复结论限于受控 `visibilitychange` 回归，不把它写成实机后台切换通过。
- 首页和归档覆盖桌面/移动无横向溢出；减少动态效果覆盖最新 Seascape 静态替身与主动播放。
- Windows 本地 Astro 预览需先启动再复用：`npm run preview -- --host 127.0.0.1 --port 4321`；之后执行 `npm run test:browser`。

## 真实浏览器与视觉检查

- Chromium 153.0.8010.28，生产构建；1440 × 900 桌面和 412 × 915 / DPR 2.625 / touch 移动模拟。
- 四种组合均确认 `.is-ready`、实际 backend，页面/控制台错误为 0，横向溢出为 0。
- 两后端分别检查默认值、所有参数最小值和最大值。默认画面可见浪峰、波谷、天空和海平线；无黑屏、只有底色或整体过曝。全部反射参数归零时波纹视觉显著减弱，这是教学参数的预期效果。
- 原始 GLSL 在独立 WebGL2 画布、相同分辨率、iTime=0 / iMouse=0 下渲染，与两个 TSL 后端的重置帧逐图对照。大尺度构图、浪形、色调和反射位置一致；不同编译后端的细节浮点差异不作为逐像素等价承诺。
- `public/previews/seascape.webp`：浏览器 WebGPU 重置帧编码，1440 × 900，质量 90，已打开检查。
- `public/previews/seascape.webm`：真实 canvas.captureStream / MediaRecorder 画面，经 FFmpeg 编码 VP9，1440 × 900，25 fps，7.000 秒；半秒交叉淡化构成循环接缝。已抽取视频中间帧确认正常海面。
- 原始帧、原作对照和桌面/移动参数面板截图保存在本机忽略目录 `output/playwright/`；PR 附可直接查看的最终海报与视频。

## 本机基线

CPU：AMD Ryzen 9 7950X3D；独显：NVIDIA GeForce RTX 4080 SUPER。浏览器预热 3 秒，再采样 120 个 RAF 间隔；使用自动画质。

WebGPU 实际 adapter 信息为 vendor `nvidia`、architecture `lovelace`、`isFallbackAdapter=false`；不是软件适配器。

| 视口       | 后端   | 实际画布   | 有效 DPR | 平均间隔 | p95     |
| ---------- | ------ | ---------- | -------- | -------- | ------- |
| 1440 × 900 | WebGPU | 1440 × 900 | 1.0      | 6.06 ms  | 6.10 ms |
| 1440 × 900 | WebGL2 | 1440 × 900 | 1.0      | 6.06 ms  | 6.10 ms |
| 412 × 915  | WebGPU | 618 × 1373 | 1.5      | 6.06 ms  | 6.20 ms |
| 412 × 915  | WebGL2 | 618 × 1373 | 1.5      | 6.06 ms  | 6.20 ms |

这些是浏览器调度间隔，不是 GPU timestamp，不代表实体手机或所有硬件的 60/30 fps。移动视口在同一桌面 GPU 上运行。另以 130 帧、每帧约 45 ms 主线程忙等待模拟持续负载，实际画布 DPR 从 1.0 降至 0.8；这里只验证自适应响应，不计入上表基线。

## 发布边界

源码、TSL 与衍生媒体的许可见同目录 `LICENSE.md`；旧镜像热度不表示当前热度。候选已单独批准，PR 合并仍由用户决定。CI 工作流会上传完整 `dist` 预览产物供下载，不另行公开部署未合并案例。
