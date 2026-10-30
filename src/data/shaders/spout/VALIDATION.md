# 清泉折光 · Spout 验证档案

验证日期：2026-10-29。用户在本聊天唯一 **Spout — P_Malin（lsXGzH）** 候选后直接回复“批准”，接受历史默认 CC BY-NC-SA 3.0 判断及本地确定性砖纹理替换。制作前核对 main 24db8ae35a788869c742cd2a966734deb71c52a1、全部 37 个历史 PR 和现有 33 个案例，无重复后建立 codex/spout。只授权一个独立 PR；合并和发布由用户决定。

## 命令与质量

- npm run quality
- npm run test:browser -- --config output/playwright/spout.config.ts --workers=1 --retries=1 --reporter=list,json
- Playwright CLI：原始 GLSL 对照、实际非回退 WebGPU smoke、四组性能、媒体、移动控件、奇数尺寸、极值、减少动态偏好、受控可见性及自适应 DPR。

构建先完成，再运行浏览器。独立端口 18789、已安装 Chromium151.0.7922.34、ASTRO_PREVIEW_BACKGROUND=0；既有 4321 服务未修改。34 个案例契约、2 个单元测试文件 / 5 项测试和 36 页构建通过；Astro 产品类型检查 0 errors / 0 warnings。本机忽略目录中的既有辅助脚本带来 58 hints，远端干净检出另行核对。普通沙箱首次 Vitest 在临时缓存重命名时 EPERM、运行 0 项测试；失败日志保留在 output/playwright/spout-quality-first.log，获准环境重跑通过，没有改 ACL。

## 完整浏览器回归

最终 144 项：141 首次通过、1 重试后通过、2 跳过、0 最终失败；435.02 秒。跳过项为既有 Pretty Hip 移动端两项。新案例桌面/移动 × 实际 WebGPU/强制 WebGL2 四项全部通过；每项首轮状态 passed/passed/passed/passed。五个参数合计 20 次恢复，最大字节差 0、最大均差 0；要求仍为最大≤2、均差<0.001。外部请求、页面错误与横向溢出均检查。

- fast-procedural-ocean.spec.ts / desktop-chromium / Very fast procedural ocean webgl 画面、五个参数与素材来源：首次 failed，最终 flaky。

首轮全量为 140 通过 / 2 新移动失败 / 2 跳过；两个失败重试仍失败，均止于我从曲管案例沿用的红通道均值<190断言。完全相同绘图缓冲区、CSS尺寸、新砖纹理、t=2和3像素内边界统计下，原始 GLSL 桌面红均值157.16、移动191.30，TSL移动190.88。由此确认上限不适合原作白色天空的移动构图；只将 Spout 自己的新外观断言改为桌面157/移动191的±15参考范围，随后两项移动测试零重试通过，再重跑完整回归。其他断言、恢复容差、旧案例、共享运行时未修改。

首轮113972170字节报告、旧版新测试、四次失败的截图/trace/context与日志，按字节校验后保留在 output/playwright/spout-first-failure，共16个文件；对照数字与失败摘要保存在 browser-evidence.json。最终报告独立写入后没有覆盖该归档。

## 首轮 CI 与纹理采样修复

同一个PR38的首轮[Quality 40891411234](https://github.com/deceive777xv/tsl-daily/actions/runs/40891411234)在head9fa2736b失败：桌面Spout WebGL2两次恢复最大差8/3，均只改变(199,594)一个像素；移动46通过/26跳过。不是超时。完整桌面artifact的198个文件逐一校验长度与SHA256后保存为150915397字节ZIP，SHA256 2c189a301f0c4780aef7ec2043594099e7730cb0321cbbc9da4240670b18bbde；两个原始trace另存，没有覆盖初始移动外观失败材料。

本机Chromium151/SwiftShader下，原有桌面WebGL2测试6次全部失败。进一步缩小为固定时间、相同参数的12次真实drawArrays，在draw之后同步readPixels：同一个像素出现5种值；截图合成与时间漂移被此对照排除。显式mip0单变量对照使用texture(...).level(0)；最终TSL依照类型定义写为texture(...).level(float(0))，重新执行媒体、性能和全量验证。只改变Spout自己的砖纹理采样，12次原始像素完全相同，原有测试6次全部首次通过，30次恢复最大/均差0。原测试SHA256 ef488619f9b85e7e542c3623ee8d77fc86d72214850207b715b0b4e98d3b6a39保持不变，未改恢复容差、外观范围、等待预算或共享运行时。详见[ci-render-diagnosis.json](./ci-render-diagnosis.json)。

[GLSL规范](https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.4.60.html)指出非一致控制流内隐式导数未定义；材质与二级命中分支正处于这种路径。采样方式的单变量对照消除了本次不确定性，未声称定位SwiftShader内部机制。基础mip让远处颗粒更锐并可能产生缩小锯齿；原始GLSL保持原采样及字节不变。以下对照、媒体、四组性能、受控暂停与完整回归均已使用最终显式采样实现重做。

## 未改动旧案例的本机波动

同一最终TSL（SHA256 fcb033a8e63e0e5ec141b3e3eb8e5fec29d65221112a1fe8eeaedddcfb2f573b）首次全量为140首次通过、1重试通过、1最终失败、2跳过：Flux Core WebGL2的两次恢复最大差61/68；CineShader Lava的恢复PNG比较首次失败、重试通过。Spout四项均首次通过。原始118231222字节JSON及三次失败的trace/PNG/context完整保存在output/playwright/spout-typed-first-failure，报告SHA256 aef479a9520ea80dfc1eb532a37bef6bc7cd627693dd3b8b9eabba71e28561fe，归档副本已按字节核对。

使用当前main24db8ae的已通过CI构建（run40510684013/artifact12739015440）在本机单独运行原样Flux Core桌面WebGL2测试三次，均通过；这没有复现间歇触发条件，不能声称旧问题已修复。六个相关旧源码/测试/共享运行时文件的Git blob与main一致。保持同一最终源码、同一workers1/retries1策略复核全量，结果见上节；若有旧案例重试，其首次材料另存output/playwright/spout-typed-second-first-failure。未改旧断言、容差或运行时，也未把重试通过当作根因修复。详见ci-render-diagnosis.json与browser-evidence.json。

## 实际后端与调度基线

现场 CIM：AMD Ryzen 9 7950X3D 16-Core Processor / NVIDIA GeForce RTX4080SUPER，另有AMD集成显卡。实际适配器 nvidia/lovelace、fallback=false；默认实际 WebGPU 与强制 WebGL2 分别核验。

| 视口与后端      | 绘图缓冲区 | DPR | 平均 RAF | P95    |
| --------------- | ---------- | --- | -------- | ------ |
| 桌面 webgpu     | 1440x900   | 1   | 6.06 ms  | 6.2 ms |
| 桌面 webgl2     | 1440x900   | 1   | 6.06 ms  | 6.1 ms |
| 移动模拟 webgpu | 618x1373   | 1.5 | 6.06 ms  | 6.1 ms |
| 移动模拟 webgl2 | 618x1373   | 1.5 | 6.06 ms  | 6.2 ms |

各组预热3秒后采120次RAF间隔；它是调度间隔，不是GPU时间戳或真实手机性能。移动模拟412×915、deviceScaleFactor2.625。受控45ms主线程负载130帧，DPR 1→0.8，仅验证反馈路径。四组0错误/0外部请求/0溢出。降低动态偏好先显示海报，手动播放实际WebGPU。

主射线保留0..32包含端点的33次查询；反射、双面折射、阴影和六点AO增加场景查询。水柱是抛物线域变换和波纹扰动，未求解数值流体。全反射沿用原作的零方向二级路径，不模拟多次内部反射；消光为倒数近似。

## 可见性与特殊尺寸

受控hidden=true+visibilitychange的既有验证保持有效：800ms内GPU提交341→341，恢复后465。**2026-10-30新增的原生隐藏/恢复验证已通过**：外部启动仅本任务使用的新配置目录Chromium151，项目Playwright1.62.1内置CLI通过connectOverCDP(noDefaults:true)连接既有默认上下文。Win32 ShowWindow最小化唯一标题/指定可执行路径的自有窗口，IsIconic在最小化区间两端均为true，并在finally恢复；区间内不发送任何浏览器命令，也不覆盖document.hidden。两个稳定采样点均hidden=true/visibilityState=hidden、按钮为“播放动画”，相隔1992.9ms，GPU提交497→497；恢复后原生visible事件到达，400ms后的采样为hidden=false/“暂停动画”/577提交。完整原始事件与判断条件见native-visibility.json。

旧全局CLI0.1.14所带Playwright1.61 alpha的CDP工厂没有传入noDefaults，之前仅移除后台启动开关或从另一个CDP会话设置focus=false仍不能解除原控制会话的覆盖。改用项目已安装1.62.1的内置CLI后，实际默认上下文不启用该焦点仿真，原生hidden事件成功出现。初次被动采样还位于visibility回调完成前，包含收尾renderOnce的两次提交；最终采样先让过渡完成，再比较两个仍为原生hidden的稳定点，未修改播放器、旧测试、渲染参数、容差或暂停策略。此前所有未验证结果与该过早边界结果保留，不把受控事件当作原生证据。

两后端默认/全部最小/全部最大六组无错误、无警告，完整画面非纯黑；1001×601绘图缓冲区与PNG为奇数尺寸。CSS布局为约1001.143×601.143，存在小于1像素的布局舍入，不宣称CSS与缓冲区数值完全相同。PNG字节统计不是原始浮点GPU缓冲区读回。移动完整水柱、控件、压缩海报、循环中帧和极值截图均已目检。

## 原始源码对照

790行原始GLSL保持不变，与TSL使用同一份新生成砖纹理；默认相机、t=2、960×600、opaque包装。sourceMatches=true，GL draw/read errors均0。原始输入图片未取回。

- 原作 GLSL→TSL WebGL2：最大RGB字节差187，均差1.6875792824074074，大于10的通道比例0.041555555555555554。
- TSL WebGPU→WebGL2：最大144，均差0.006559027777777778，大于10的通道比例0.0001371527777777778。

几何、管口、砖纹理和水柱光学关系一致，局部透明/高光仍有差异；不宣称逐像素相同或单一原因。初次移植的零折射向量跳过分支造成明显偏暗；在显式mip修复前，受控恢复原作二级路径曾使均差4.977→0.945。最终显式mip版本的当前差异以上述数字为准，包含远处砖纹过滤变化。初始和修正截图/CLI日志保留，最终生产实现保留原作路径及有限归一化/偏移保护。

## 最终媒体和分发

- WebP：实际TSL非回退WebGPU画布，960×600 / quality92，106480字节，SHA256 02336f1821b28fa61cc7c2922edb0b16a91dfaf640dcb8120271567fbb616b69。
- WebM：实际canvas.captureStream(25)/MediaRecorder，速度0.6；前94帧+逆序94帧，188帧/7.52秒/25fps/VP9/CRF35/yuv420p/无音频，1880316字节，SHA256 0572ce3977e407d464181efa42cdd0d05bed7690b1d4e4278108ec9670276964。倒放只用于媒体闭环，交互水流仍按原作方向推进。
- 初始启动海报来自本轮原始GLSL筛选图，最终已替换为实际TSL画布；没有使用其他案例图片。默认与压缩结果未出现仅背景、整体黑屏或整体过曝，亮天空与局部高光属于原作设置。

最终构建的两个媒体在桌面/移动上下文均HTTP200、精确字节和SHA256一致；减少动态海报与手动WebGPU通过。WebM实际解码960×600 / 7.52秒，成功播放并定位3.76秒中点，0错误。详见browser-evidence.json的finalMedia。

2026-10-30最终构建的新案例四项另行复核：4/4首次通过、零重试/零跳过，16.19秒；20次参数恢复最大/均差均0。该次没有重跑无关完整套件；全量141首次通过/1重试通过/2跳过/0最终失败记录保留在上一节。最终生产TSL及测试SHA256与全量、收尾复核一致。

来源、批准、许可判断、原图替换和字节证据见 LICENSE.md/source-hashes.json。原始GLSL与TSL采用CC BY-NC-SA3.0（基于旧镜像快照）；中文和新媒体CC BY-NC-SA4.0，框架MIT、站点永久非商业。没有合并、自动合并或修改Pages部署配置。
