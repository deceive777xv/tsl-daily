# 金属遗境 — 验证记录

验证日期：2026-10-31。唯一获批候选为 **Remnant X — Dave_Hoskins / David Hoskins（4sjSW1）**；用户在该候选后直接回复“批准”，接受静音、自生成噪声与两份原始 pass 归档的范围。main `2d8a12c5a71c00bb8cad37fa343f8b49e6c6f457`、全部 38 个历史 PR 和 34 个已有案例无重复。只授权一个独立案例 PR，合并与发布由用户决定。

## 执行与质量

- `npm run quality`
- `npm run test:browser -- --config output/playwright/remnant.config.ts --workers=1 --retries=1 --reporter=list,json`（首轮，失败材料保留）
- `npm run test:browser -- --config output/playwright/remnant-second.config.ts --workers=1 --retries=1 --reporter=list,json`（同一源码、相同策略的完整复核）
- 实际非回退 WebGPU smoke：四组桌面/移动、WebGPU/WebGL2 页面检查，以及新案例的四项浏览器测试；实际适配器 `nvidia / lovelace`、fallback=false。没有把后备 WebGL2 当成 WebGPU。

先构建，再测试。独立预览为 `127.0.0.1:18794`，设置 `ASTRO_PREVIEW_BACKGROUND=0`；已有服务未修改。首次普通沙箱 quality 在 Vitest 临时缓存 rename 时 EPERM，实际执行 0 项测试；原日志 `output/playwright/remnant-quality-first.log` 保留，获准环境中重新执行通过，未改 ACL。不可变 `mirror.json` 的单独格式检查不通过后，只给该文件增加 Prettier 忽略项，没有改动来源字节。

最终质量结果：35 个案例契约、2 个单元测试文件 / 5 项测试、37 页构建；Astro 0 errors / 0 warnings。本机忽略目录中的历史辅助脚本产生类型提示，远端干净检出另行核对。

## 完整浏览器回归

最终结果：145 首次通过、1 旧测试重试通过、2 跳过、0 最终失败，耗时 470.68 秒。

新案例四项（桌面/移动 × WebGL2/WebGPU）均首次通过，20 次参数改变/恢复均有画面变化并恢复：20 次恢复最大字节差 0，平均字节差的最大值 0。CSS 像素截图统一使用 `scale:css`，保留原有最大 2 字节、平均小于 0.001 的恢复阈值。新案例检查画面亮度跨度、彩色占比、黑白像素占比、五个控件、来源卡、原作链接、溢出、错误和外部请求。

### 旧案例的首轮失败与边界

首轮全量为 **143 首次通过、2 重试通过、1 最终失败、2 跳过**：桌面 Flux Core WebGL2 两次 `flux-speed` 恢复最大字节差均为 68；移动同项首次差 40，重试通过；桌面 Pretty Hip 来源/参数恢复检查首次失败，重试通过。Remnant X 四项全部首次通过，桌面 Flux Core 的失败发生在 Remnant X 测试之前。

首轮完整 128815924 字节 JSON、列表日志、四次失败的截图/上下文/trace 共 14 个归档文件，按 SHA-256 逐一核对后保存在 `output/playwright/remnant-first-failure`，没有覆盖首轮报告。当前分支隔离运行原样 Flux Core WebGL2 桌面测试三次，2 通过、1 失败。最新 main 的成功 CI run `41084569081` / artifact `12993060530` 构建使用同一测试隔离三次均通过，耗时 17.60 秒。main ZIP 为 121208013 字节，SHA-256 `7e2fe0bd8a88de7c9c6c9ec2092d5aa003e467d9d0411a672485b7f9b1ed398f`，全部 169 个条目完整校验，直接从 ZIP 提供页面，没有解压编译产物干扰项目检查。

六个相关旧源码、测试与共享运行时 Git blob 均与当前 main 相同。已合并的 Spout 验证记录也包含先前 Flux Core 的 61/68 同类失败。这次 main 隔离未复现，不能据此确定间歇触发原因、排除集成/环境因素，或宣称修好了旧问题。未改旧 Shader、共享运行时、旧测试、阈值、重试策略或 CI 时间预算；完整复核结果单独列在上方。若复核仍有重试，具体首次错误在 `browser-evidence.json` 中保留。

## 本机渲染与性能

实际 Chromium 151.0.7922.34，CPU Ryzen 9 7950X3D，实际 WebGPU 为非回退 NVIDIA/lovelace，显卡 RTX 4080 SUPER。四组均预热 3 秒、测 120 个 RAF 间隔：

| 视口             | 后端   | 绘制缓冲          | 平均间隔 | P95    |
| ---------------- | ------ | ----------------- | -------- | ------ |
| 桌面 1440×900    | WebGPU | 1440×900，DPR 1   | 6.06 ms  | 6.1 ms |
| 桌面 1440×900    | WebGL2 | 1440×900，DPR 1   | 6.06 ms  | 6.1 ms |
| 模拟移动 412×915 | WebGPU | 618×1372，DPR 1.5 | 6.06 ms  | 6.2 ms |
| 模拟移动 412×915 | WebGL2 | 618×1372，DPR 1.5 | 6.06 ms  | 6.2 ms |

这是浏览器 RAF 调度基线，不是 GPU 时间，也不是真实手机性能。受控主线程 45 ms × 130 帧负载使自动 DPR 从 1 降至 0.8。四组无横向溢出、页面错误或外部素材请求。另在 1001×601 奇数尺寸验证默认、五个参数联合最小值、联合最大值，两后端共六组正常输出；极细结构在部分路径有锯齿和闪烁，未以二分细化冒充抗锯齿。

## 减少动态效果与真实隐藏

桌面和移动的 `prefers-reduced-motion: reduce` 首次只显示已解码海报，不创建实时后端；用户主动播放后，实际 WebGPU 启动。分别验证了最终海报与视频返回 HTTP200、字节长度与 SHA-256 精确相同，以及真实 WebM 播放、7.52 秒时长、3.76 秒 seek 与 960×600 解码尺寸，无媒体错误。

**真实 Windows 隐藏/恢复已验证**。使用项目 Playwright 1.62.1 的 CDP `noDefaults:true` 连接专用 Chromium 的既有默认 context，避开焦点模拟。核对独有 profile、端口、PID、精确窗口标题和可执行文件；初次 Hidden 启动窗口没有 MainWindowHandle，按同一 PID/标题枚举并仅恢复本次窗口后，再执行原生最小化。

Win32 在最小化起止都确认 `IsIconic=true`，保持 4736.77 ms，并在 finally 中恢复；最小化期间没有 Playwright/浏览器命令。被动原生 `visibilitychange` 观察保留了事件起点和过渡中的最后两次提交：51756→51758。稳定隐藏的两次样本均为 `document.hidden=true`、`visibilityState=hidden`、播放按钮显示“播放动画”、GPU submit **51758→51758**，间隔约 **1996.8 ms**；恢复原生 visible 后 400 ms 提交增至 **51842**，按钮恢复“暂停动画”。没有给 `document.hidden` 定义自有属性。

另行保留受控 hidden 事件测试：提交 **356→356**，恢复后 **448**。它与上述原生证明分开，不把受控测试当成真实后台证据。完整事件、原生窗口端点、探针哈希及项目客户端源码片段见 `native-visibility.json`。

## 媒体、对照与来源字节

- WebP：实际 TSL 非回退 WebGPU 海报，960×600，quality92，282354 字节，SHA-256 `b16ba60dab010b836c413504b227e876b394a9014db31565adefae29b0a135d2`。
- WebM：实际 TSL 非回退 WebGPU canvas 的 MediaRecorder 捕获，静音 VP9、25fps、188 帧、7.52 秒、2040986 字节，SHA-256 `799794b55ee65768537da142adc2ad6b17b05007eeb6cfd2c02bd636e039af1d`。按 94 帧前进 + 94 帧倒放闭合，源速度0.8；不是原作轨迹本身严格周期。编码 CRF38、目标2400k/max3000k、yuv420p。
- 已分别目视检查原始两后端画面、压缩海报、压缩循环中帧、移动控制面板和极值截图，没有空白、全黑、整屏过曝或与原作思路明显不符。
- 使用同一份新噪声，重新渲染未改动的原始 Image GLSL；960×600、原作时间2，RGB 字节差：原始 GLSL→TSL WebGL2 最大69、平均0.01254977、差大于10的通道占比0.00004861；TSL WebGPU→WebGL2 最大187、平均0.00960069、占比0.00006308。少量像素有差异，不承诺逐像素等同，也未把差异归结为单一未经验证的原因。
- 原始 JSON 与 Image/Sound UTF-8 内容哈希见 `source-hashes.json`、`LICENSE.md`。原始噪声图没有下载或托管；旧镜像的显式 CC BY-NC-SA 3.0 和指标精确采样日期未知的边界均保留。

最初制作媒体时，尚未生成的本地海报曾返回404；该构造阶段控制台原日志保留。最终重新构建后的两视口实际媒体检查均为零错误，不将构造阶段日志当成最终通过记录。

## 远端验证

远端结果以独立 PR 的最终 exact-head Quality 结论为准；PR 正文附运行、各浏览器任务及构建产物链接。本文件记录本机结果，不把尚未运行的 CI 当成通过。

本机非回退 WebGPU 与 CI 中实际后端不支持时的 WebGPU 跳过必须分开报告。最终只有人工合并 PR 才批准发布；本次不合并、不自动合并、不改 Pages 配置或 SITE_LAUNCHED。
