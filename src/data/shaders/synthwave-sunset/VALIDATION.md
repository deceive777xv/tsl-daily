# 霓虹山路 — 本机验证

验证日期：2026-10-07。仅针对用户明确批准的 **another synthwave sunset thing — stduhpf（tsScRK）** 旧镜像移植。一个案例对应一个独立 PR，合并由用户审批。

## 环境与来源

- 分支从最新 main `96b9c5d76498ec6cf0cdbcd38ad8e3074b40cc98` 创建；开始实现时无开放案例 PR，main 的质量与 Pages 工作流均成功。
- Windows，AMD Ryzen 9 7950X3D / NVIDIA GeForce RTX 4080 SUPER；Playwright Chromium 151.0.7922.34 用于测试与性能采样，Chrome 153.0.8010.53 用于海报、录屏与原作对照。
- WebGPU adapter 为 nvidia / lovelace，非 fallback；Three.js 0.185.1。强制 WebGL2 使用 `?renderer=webgl`，没有把 WebGPU 的自动后备当作强制测试。
- `mirror.json` 原始字节 SHA-256：E96EDD07CFCBD22613D7C121DEE90E274DDB8BB86BD00273D642091ACBB91052；`original.glsl` 与唯一 Image pass 的完整解码文本一致。旧镜像日期、历史热度、许可判断及批准范围见 LICENSE.md。

## 画面、参数与媒体

- 桌面 1440×900、移动模拟 412×915，WebGPU / WebGL2 四组均实际运行，页面与控制台无错误，无外部请求、音频或横向溢出。
- 五个教学参数均改变画面；暂停状态的参数恢复最大 RGBA 通道差 ≤2/255，平均字节差 <0.001。
- 增加最低地形参数的回归：原实现误将相机判为越过上界，路面完全消失。测试先在桌面双后端失败，再修正上界与迭代点取值，四组通过；用画面下部指定区域的霓虹边线覆盖率检查实际地面仍然存在。
- 目视检查双后端海报、移动参数面板、低地形、原作参考和循环转折/末尾帧：条纹落日、三角网格、中央通道和两侧地形可见，没有只显示底色、黑屏、明显过曝或循环重影。
- 海报：真实 WebGPU TSL 画布截图转 WebP，1440×900。无声 WebM：真实浏览器 `canvas.captureStream(25)` / MediaRecorder 录屏后转 VP9，1440×900、25fps、7.52s、无音轨。前 3.76 秒接倒放形成往返循环；行进速度为 0.35，其余参数默认。交互动画继续向前运行。
- 原作对照：保留的 GLSL 在本机 WebGL2、1440×900、iTime=2、iTimeDelta=0 渲染，与同尺寸默认 TSL WebGL2 对照。整体构图与地形思路一致；原始像素差数据见 reference-comparison.json，不宣称逐像素等同。

## 播放与分辨率

- `prefers-reduced-motion: reduce`：初始完整海报加载成功，未创建 GPU 后端；主动播放后启用 WebGPU，按钮状态正确。
- 受控 `visibilitychange`：隐藏后 GPU 提交数持续 800ms 不变，按钮切为「播放动画」；恢复后提交继续，按钮返回「暂停动画」。原始计数见 browser-evidence.json。
- **真实后台隐藏未获验证**：无头 Chromium 151 标签切换，以及有头 Chrome 153 真实标签切换和窗口最小化，都仍报告 `document.hidden=false`，没有发生真正的隐藏事件。不能将受控事件结果说成真实后台测试通过。独立有头检查见 native-visibility.json。
- 自适应 DPR：受控约 45ms 主线程负载，130 帧后从 1 降至 0.8。移动模拟设备 DPR 为 2.625，画布实际 DPR 为 1.5；这是浏览器模拟，未测试实体手机。

## 本机性能基线

四组依次预热约 3 秒，再采样各 120 个 requestAnimationFrame 间隔：

| 视口             | 后端   | 画布     | 平均间隔 |   p95 |
| ---------------- | ------ | -------- | -------: | ----: |
| 桌面 1440×900    | WebGPU | 1440×900 |   6.06ms | 6.2ms |
| 桌面 1440×900    | WebGL2 | 1440×900 |   6.06ms | 6.1ms |
| 移动模拟 412×915 | WebGPU | 618×1372 |   6.06ms | 6.1ms |
| 移动模拟 412×915 | WebGL2 | 618×1372 |   6.06ms | 6.1ms |

这些是 RAF 调度间隔，不是 GPU timestamp，也不代表实体手机性能。详细数据见 performance.json。

## 自动检查

- `npm run quality` 通过：格式、lint、17 个案例契约、5 个单元测试、类型检查及生产构建。
- 本案例桌面/移动 × WebGPU/WebGL2 四组回归通过，包括画面、五个参数、最低地形、来源署名与历史许可说明。
- 完整 `npm run test:browser -- --config=playwright.sunset-local.config.ts`：74 passed、2 skipped、0 failed，约 3.3 分钟。两个跳过是既有 Pretty Hip 移动视口条件；本案例四组全部实际运行。使用同一生产构建的 Astro preview `127.0.0.1:18769`；临时端口配置不提交。
