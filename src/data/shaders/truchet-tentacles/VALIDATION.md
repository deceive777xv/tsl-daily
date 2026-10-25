# 曲管织境 · Truchet Tentacles 验证档案

验证日期：2026-10-25。用户在本聊天唯一 **Truchet Tentacles — WAHa_06x36（ldfGWn）** 候选后直接回复“批准”，同时接受本地环境替换。最新 main f9f694105d434a467e61c88fcb8836522adf6646、全部35个PR和现有身份复核无重复后，建立 codex/truchet-tentacles；只授权一次独立PR，合并和发布由用户决定。

## 命令与运行条件

- npm run quality
- npm run test:browser -- --config output/playwright/truchet.config.ts --workers=1 --retries=1 --reporter=list,json
- 独立 Playwright CLI：来源对照、非回退 WebGPU smoke、四组性能、媒体、奇数视口、极值、减少动态偏好、受控可见性、自适应DPR。

构建先完成，再运行浏览器。临时配置只定位本机已安装Chromium151.0.7922.34和独立端口18785，设置ASTRO_PREVIEW_BACKGROUND=0，不修改共享配置/运行时/旧测试。质量检查先发现新文件未使用的类型并删除；随后普通沙箱在Vitest临时缓存重命名时报EPERM，首轮日志保留，批准的执行环境恢复后质量通过。没有修改ACL、安装依赖或改变断言/容差。Astro本机忽略目录中的辅助脚本提示单独保留，产品源码类型检查零错误、零警告。

## 浏览器回归

全量136项：131首次通过，3重试后通过，2既有跳过，0最终失败；耗时420.48秒。

新案例桌面/移动模拟 × WebGPU/WebGL2 四项随全量运行：4/4通过；各项首次结果passed/passed/passed/passed。五个参数共20次恢复，最大字节差0、最大均差0。像素变化、彩色管道明暗、来源/许可、无外部请求/页面错误/横向溢出均检查。CSS像素截图，外观统计排除3像素边界；完整画布恢复要求最大≤2、均差<0.001。

最终媒体和档案写入后重新构建，再单独验证新案例4项：4/4通过、零重试，20次恢复最大字节差0、最大均差0。此复核针对更新后的生产构建，未重跑无关的完整套件。

- filtering-procedurals.spec.ts / desktop-chromium / Filtering procedurals webgl 材质过滤、五个参数与 MIT 来源：首轮 failed，最终 flaky。
- flux-core.spec.ts / desktop-chromium / Flux Core webgl 螺旋结构、五个参数与 CC0 来源：首轮 failed，最终 flaky。
- flux-core.spec.ts / mobile-chromium / Flux Core webgl 螺旋结构、五个参数与 CC0 来源：首轮 failed，最终 flaky。

首轮错误、trace、截图、完整报告和日志归档在本机output/playwright/truchet-first-failure。没有修改旧案例或共享断言，也不声称修复了既有失败的根因。

## 本机实际后端与性能

当次CIM硬件读取：AMD Ryzen 9 7950X3D 16-Core Processor；AMD Radeon(TM) Graphics / NVIDIA GeForce RTX 4080 SUPER。实际适配器nvidia/lovelace，fallback=false。默认实际WebGPU及强制WebGL2均验证，不以远端无适配器跳过替代本机证据。

| 视口与实际后端  | 绘图缓冲区 | DPR | 平均RAF间隔 | P95    |
| --------------- | ---------- | --- | ----------- | ------ |
| 桌面 webgpu     | 1440x900   | 1   | 6.06 ms     | 6.2 ms |
| 桌面 webgl2     | 1440x900   | 1   | 6.06 ms     | 6.1 ms |
| 移动模拟 webgpu | 618x1372   | 1.5 | 6.06 ms     | 6.1 ms |
| 移动模拟 webgl2 | 618x1372   | 1.5 | 6.06 ms     | 6.1 ms |

各组预热3秒，随后120个独立RAF间隔；这是浏览器调度，不是GPU时间戳或真实手机性能。移动模拟412×915、deviceScaleFactor2.625，不代表真实手机。受控45ms主线程负载持续130帧时，自适应DPR 1→0.9，只验证反馈路径。四组错误/外部请求/横向溢出为零。减少动态偏好默认加载海报，手动播放启动实际WebGPU。

主射线最多64次距离查询，法线额外4次，每次由3个弧段组成；环境只创建一次。控制不增加这些查询上限。步数遮暗不是物理AO，距离估计不保证在所有指数下等于欧氏距离。

## 原生与受控可见性

真实第二标签页置前时document.hidden=false，GPU提交458→458，恢复后562。原生隐藏状态未观察到，**原生后台标签页暂停未验证**。提交短暂不变不能替代隐藏证据。

受控hidden=true+visibilitychange后800ms内提交566→566，恢复后702；按钮和循环恢复，受控路径通过。两种证据分开记录。

## 来源对照、奇数尺寸与极值

- 原始110行GLSL不变、1440×900、第2秒、opaque包装；与TSL使用同一份本地生成cubemap，无原输入图片。sourceMatches=true，GL错误0。
- 原作GLSL→TSL WebGL2：最大RGB字节差8，均差0.022192644032921812，超过10的通道比例0。
- TSL WebGPU→WebGL2：最大47，均差0.011710390946502058，超过10的通道比例0.0000015432098765432098。
- 原作和两后端默认截图目检，管道连接、相机与位置色一致；少量局部后端差异完整保留，不宣称逐像素相同或单一原因。
- 1001×601奇数绘图缓冲区、CSS与PNG尺寸一致；两后端默认/全部最小/全部最大六组通过，无错误/警告，有限可见输出。最小设置关闭反射时远处会呈黑色，仍有清晰管道，不是整帧黑屏。极值截图和两后端移动控件目检。PNG不是浮点GPU缓冲区读回。

## 最终媒体

- WebP来自实际非回退TSL WebGPU画布，960×600、quality92、86108字节；压缩后目检。
- WebM来自真实canvas.captureStream/MediaRecorder，录制速度0.6，25fps，94帧正放+94帧倒放，188帧/7.52秒，VP9/CRF35，无音频，879514字节。往返只用于媒体剪辑，交互相机仍保留原轨迹。压缩中帧目检。
- 临时初始海报/静态占位短片均来自本轮原始GLSL筛选图，最终已替换为实际TSL WebGPU媒体。没有使用其他案例的图片或片段。
- 默认、移动与媒体未出现底色-only、整体黑屏或整体过曝。
- 最终媒体重建进dist后，桌面/移动两上下文复核服务端实际字节与SHA256、减少动态海报/手动GPU和WebM真实播放；两组通过，视频960×600/7.52秒、无错误。详见browser-evidence.json中的finalMedia。

## 来源和分发

固定GabeRundlett镜像f6d538ad，初抓2024-10-05，文件提交2025-05-29T06:43:53Z，2026-10-25全文审阅并获批。历史268likes/41870views，指标采样日未知；当前原作HTTP402，未绕过。唯一Image110行无自定义许可/额外限制/声明复制上游，按批准流程采用默认CC BY-NC-SA3.0，基于旧镜像快照，不是显式源码许可或当前作者确认。

JSON 5037字节 SHA256 dee1f020bffa7908626adb98099e214e6ff19d47fcf3f4a0306d757e8e92a452；GLSL 3094字节 SHA256 4a56036a61dafae5a4c94e2c28b7fa8327149f77c817da57bcea8b1f609aff45。原cubemap独立权利未核实，未下载/复制/托管；六面128×128环境只用新生成的方向渐变和光斑。Source/TSL CC3，中文原创CC4，生成媒体按CC3第4(b)条的后续同要素许可采用CC4；框架MIT，永久非商业。完整授权范围见LICENSE.md。

远端CI以此PR最终提交的检查结果为准；其最终结论、运行与预览artifact链接在PR正文补充。本机真实非回退WebGPU证据与CI缺少后端的跳过分别报告。没有自动合并或发布。
