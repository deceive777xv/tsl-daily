# 螺旋卷层 — 本机验证

验证日期：2026-09-24。仅针对用户批准的 **Spiraled Layers — Tater（Ns3XWf）** 旧镜像移植；PR 合并仍由用户审批。

## 环境与来源

- Windows，AMD Ryzen 9 7950X3D / NVIDIA GeForce RTX 4080 SUPER；Chromium 151.0.7922.34，WebGPU adapter 为 nvidia / lovelace，非 fallback。
- 旧镜像 SHA-256：715349F8885D736462ADFEDF0611664FFB61B0AFBC0063424831BF4FB90246B2；与取回文件逐字节一致。唯一 Image pass 的源码与 original.glsl 完整文本一致。来源、历史热度和许可判断见 LICENSE.md。
- 原作参考画面由保留的 GLSL 在本机 WebGL2、960×600、iTime=2 渲染；与同尺寸 TSL WebGL2 画面并排目视检查。粉蓝螺旋端面、平面分层及远近排布保留；局部遮蔽和边缘有所变化，详见 LICENSE.md 的步数和 AO 调整，不宣称逐像素复制。

## 画面与媒体

- 桌面 1440×900 和移动模拟 412×915，默认 WebGPU 与强制 WebGL2 四组均实际运行；无页面/控制台错误、外部请求或横向溢出。四个参数的改变与恢复在四组浏览器回归中均通过；恢复容差为最大 RGBA 通道差 ≤2/255、平均字节差 <0.001。
- 目视检查 WebGPU/WebGL2 海报、移动参数面板、原作对照，以及短片转折和末尾帧。画面含清楚的立体卷带、端面、平台和天空，没有底色、黑屏、明显过曝或循环重影。
- WebP 海报为 1440×900，由真实浏览器画布截图转换；无声 WebM 为 VP9、1440×900、25fps、7.52s。短片先录制浏览器动画，再将前半段倒放接回起点，形成往返循环。倒放仅用于预览媒体；交互画面继续按时间向前运行。

## 播放与分辨率

- prefers-reduced-motion: reduce：初始只加载完整海报，未创建 GPU 后端；用户主动播放后启用 WebGPU，按钮状态正确。
- 受控 visibilitychange：隐藏时 GPU 提交数 476→476，持续 800ms；恢复后增至 614，按钮状态从「播放动画」返回「暂停动画」。
- **真实后台标签未获验证**：无头 Chromium 切到另一个标签时仍报告 document.hidden=false；这次事件没有真正进入隐藏状态。共享运行时对受控隐藏事件的暂停已验证，不能把无头标签切换说成真实后台验证通过。原始数据见 browser-evidence.json。
- 自适应 DPR：受控约 45ms 主线程负载、130 帧后从 1 降至 0.8，证明慢帧反馈路径。移动模拟的设备 DPR 为 2.625，画布实际 DPR 1.5；浏览器模拟不是实体手机测试。

## 本机性能基线

四组依次预热约 3 秒，再采样各 120 个 requestAnimationFrame 间隔：

| 视口             | 后端   | 画布     | 平均间隔 |   p95 |
| ---------------- | ------ | -------- | -------: | ----: |
| 桌面 1440×900    | WebGPU | 1440×900 |   6.06ms | 6.1ms |
| 桌面 1440×900    | WebGL2 | 1440×900 |   6.06ms | 6.2ms |
| 移动模拟 412×915 | WebGPU | 618×1372 |   6.06ms | 6.2ms |
| 移动模拟 412×915 | WebGL2 | 618×1372 |   6.06ms | 6.1ms |

这些是浏览器 RAF 调度间隔，不是 GPU timestamp，也不代表实体移动设备帧率。详细原始结果见 performance.json。

## 自动检查

- npm run quality 通过：格式、lint、16 个案例契约、5 个单元测试、类型检查和生产构建。
- 本案例桌面/移动 × WebGPU/WebGL2 四组回归通过，包括画面范围、四个参数、来源署名及历史许可说明。
- 完整 npm run test:browser -- --config=playwright.local.config.ts：70 passed、2 skipped、0 failed。两个跳过是既有 Pretty Hip 移动视口条件；本案例四组全部运行。默认配置的 Astro 第二个 preview 进程在端口 4321 未能启动，因此测试使用同一生产构建的已启动 Astro preview 端口 18766；临时本地配置未提交。
