# Cyber Fuji 2020 验证记录

日期：2026-09-09。基于 main `3123e0cd7c371e1b77a38542ecdb0cbd41ec45e6` 制作；一个案例、一个 PR，未合并或部署。

## 内容与来源

- 用户明确批准 Cyber Fuji 2020 — kaiware007（Wt33Wf），接受已披露的旧镜像、默认许可判断。
- JSON SHA-256 与批准快照一致：`35B6958E2C0AA430A55D89BAC227BEF88686FA4EB194AA51EAA88ECF5E7C034A`。
- 原始 GLSL 与 JSON 唯一 Image pass 的 code 字符串逐字一致；没有外部输入。
- 源码、五步中文赏析、五个参数、LICENSE.md、WebP 和 WebM 均齐全。许可限制详见 LICENSE.md。

## 自动检查

- `npm run quality` 通过：格式、ESLint、7 案例契约、Vitest 5/5、Astro check 0 errors / warnings、生产构建。构建保留 Three.js 大分块提示，不是错误。
- `npm run test:browser` 通过 **24/24**，桌面 Chromium 与 Pixel 7 模拟视口；新案例的 WebGL2、默认许可展示、五个参数、冻结帧中的网格密度像素变化、恢复默认值像素一致、受控 visibilitychange 暂停与恢复均通过。最新案例减少动态效果时先显示海报，主动播放后启动渲染。
- 首次 Astro check 在沙箱内因模块加载报错；完整本地权限下通过。首次浏览器测试的 preview 服务提前退出；单独启动生产预览、HTTP 200 后重跑全套通过。
- `git diff --check` 通过；镜像保留 CRLF 字节，原始 GLSL 保留上游空白，不经格式化。

## 生产构建双后端与性能

Windows，AMD Ryzen 9 7950X3D，NVIDIA RTX 4080 SUPER；Chromium **153.0.8010.37**。WebGPU adapter vendor=nvidia、architecture=lovelace、isFallbackAdapter=false。每项预热 3 秒，采样 120 个 requestAnimationFrame 间隔。

| 视口       | 后端   | 画布       | 有效 DPR | 平均间隔 | p95     |
| ---------- | ------ | ---------- | -------- | -------- | ------- |
| 1440 × 900 | WebGPU | 1440 × 900 | 1.0      | 6.06 ms  | 6.10 ms |
| 1440 × 900 | WebGL2 | 1440 × 900 | 1.0      | 6.06 ms  | 6.10 ms |
| 412 × 915  | WebGPU | 618 × 1373 | 1.5      | 6.06 ms  | 6.20 ms |
| 412 × 915  | WebGL2 | 618 × 1373 | 1.5      | 6.06 ms  | 6.10 ms |

四项均无页面/控制台错误、外部网络请求或横向溢出；实际后端与请求一致。RAF 是浏览器调度间隔，不是 GPU 执行时间，不能据此声称所有设备达到同等 FPS。移动端使用桌面 GPU 模拟。

持续注入约 45 ms/帧主线程负载，实际画布 DPR 由 1.0 降到 0.8，确认自适应降级。参数最小/最大值下两后端均继续渲染。

隐藏状态：受控 `document.hidden` / `visibilitychange` 测试通过。另尝试新标签页 `bringToFront()`，自动化 Chromium 仍报告 `document.hidden=false` 且未发出 visibilitychange，因此**未验证真实后台标签页暂停**；不把这个环境限制当作真实后台测试通过。

## 视觉与媒体

- 原始 GLSL 与 TSL 同在时间 8 秒、1440 × 900 对照；山、雪、云、落日和网格主构图一致。对照曾发现并修正延迟节点求值使地平线与山体渐变错误偏移的问题。
- 已查看 WebGPU/WebGL2 默认帧、桌面 UI、移动 UI/参数面板及移动最大参数截图；竖屏同时保留太阳与主要山体，界面无横向溢出。
- 最终 WebP：1440 × 900，来自真实浏览器 WebGPU 画布截图；不是原作截图。
- WebM：1440 × 900、VP8、25 fps、**7.52 秒**、无音轨；浏览器 MediaRecorder 录制，首尾半秒交叉淡化。已查看最终海报与视频第 3 秒帧。
- 明亮雪顶和地平线来自原作配色，主要形状与色彩层次可辨；不是全屏过曝、黑屏或底色。密网格在低 DPR 下仍可能出现摩尔纹，文章已说明。
