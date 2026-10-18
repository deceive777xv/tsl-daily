# 蓝构心殿 · Palace of Mind 验证档案

验证日期：2026-10-18。从最新 main 95b7e80cae759d6aba76f1e688159b256a1dd585 建立独立分支 codex/palace-of-mind。只增加本案例及证据、测试和源文件字节保护规则。

## 执行入口

```text
npm run quality
npm run test:browser -- --config output/playwright/palace.config.ts tests/browser/palace-of-mind.spec.ts --workers=1 --retries=0 --reporter=list,json
npm run test:browser -- --config output/playwright/palace.config.ts --workers=1 --retries=1 --reporter=list,json
```

本机沿用正式配置的桌面与 Pixel 7 模拟项目，独立端口 18780、单 worker、已安装完整 Chromium151。全量允许一次与 CI 相同的重试；新增案例先运行零重试四组。构建后开始浏览器检查，浏览器检查期间不重写 dist。最终 npm run quality 包含格式、lint、28 个案例契约、2 个单元测试文件/5 项测试与生产构建；完整日志保留在忽略目录。

新增案例独立四组全部首次通过，耗时 14.33 秒，五个参数共20次恢复 max=0 / mean=0。全量共120项：115项首轮通过、3项重试后通过、2项既有 Pretty Hip 移动端跳过，最终0项失败，耗时 412.10 秒。新案例四组在全量中也均首次通过，20次恢复 max=0 / mean=0。

- fast-procedural-ocean.spec.ts / mobile-chromium / Very fast procedural ocean webgl 画面、五个参数与素材来源：首次 failed，后续 passed。
- filtering-procedurals.spec.ts / desktop-chromium / Filtering procedurals webgl 材质过滤、五个参数与 MIT 来源：首次 failed，后续 passed。
- menger-sponge.spec.ts / mobile-chromium / Menger Sponge webgl 几何、五个参数与 MIT 来源：首次 failed，后续 passed。

首轮错误、PNG 与 trace、完整报告和日志另存于 output/playwright/palace-first-failure；报告仍保留各次尝试和原始路径。没有修改旧案例、共享运行时、旧测试断言或容差，也不声称已定位或修复这些旧用例的根因。

## 实际后端、界面和参数

- Chromium151.0.7922.34；实际 WebGPU 适配器 nvidia/lovelace，fallback=false。CIM 重新查询 Ryzen9 7950X3D / RTX4080SUPER，另有 AMD 集显；硬件名称不替代实际适配器检查。
- 桌面1440×900与移动模拟412×915分别检查实际 WebGPU、强制 ?renderer=webgl 的 WebGL2，无外部请求、横向溢出或页面错误。两后端移动控件展开画面已检查。
- 新测试检查 Palace of Mind、butadiene、wttXDl 原作链接、旧镜像许可文案、五个滑块和实际画面。冻结原作第2秒，中等质量、CSS像素截图；蓝色比例>0.2、明度跨度>50、黑<0.8、白<0.3、G/R>1.5、B/R>3 用于排除空白和错误底色。只有外观统计排除最外三像素，恢复比较覆盖整张画布，RGBA最大差≤2、平均差<0.001，实测全部为零。
- 1001×601奇数绘图缓冲，两后端默认/全部参数最小/全部参数最大共六组输出有效，页面错误和警告均为零。默认中心RGBA两后端均为[2,5,53,255]。全部最小会产生稀疏细梁与大面积亮蓝远景，全部最大出现粗梁和深色近景；不将极值构图等同于默认亮度，也不承诺极值逐像素一致。

## 原始 GLSL 对照

同一1440×900、原作第2秒，独立WebGL2画布编译未改动原始GLSL；嵌入源字符逐字相等，GL error=0，页面错误/警告为零。

| 比较                    | 平均 RGB byte 差 | 最大差 | RGB 分量差>10 的比例 |
| ----------------------- | ---------------: | -----: | -------------------: |
| 原始GLSL → TSL WebGL2   |     0.0136406893 |    222 |       0.000104423868 |
| TSL WebGPU → TSL WebGL2 |     2.9312572016 |    245 |       0.047176183128 |

已检查原始与两个后端：主要前景交错梁柱、蓝色调色和光带一致，WebGPU 部分远景结构有可见差异。平均差与显著分量差都完整保留；未替换原作哈希或几何，未宣称逐像素相同，也没有把差异归为已被证明的单一数值原因。这里只验证默认第2秒，不外推到全部时间和参数。

TSL 保留单元编号先于变形、矩阵方向、GLSL mod、四层默认折叠、三轴柱体 min 并集、原始相机叉积基、100次有符号步进和先更新再判断命中。法线梯度长度下限1e-8；条纹倒数分母下限1e-6取饱和极限。原作alpha=1.1-t保存在快照，本页展示不透明RGB。调色后解码sRGB一次交给共享renderer；原始快照字节不含这些修改。

## 性能与运行时边界

| 视口/后端       | 绘图缓冲 | 有效DPR | 平均RAF间隔 |    P95 |
| --------------- | -------- | ------: | ----------: | -----: |
| 桌面 WebGPU     | 1440×900 |       1 |     6.06 ms | 6.1 ms |
| 桌面 WebGL2     | 1440×900 |       1 |     6.06 ms | 6.1 ms |
| 移动模拟 WebGPU | 618×1373 |     1.5 |     6.06 ms | 6.1 ms |
| 移动模拟 WebGL2 | 618×1373 |     1.5 |     6.06 ms | 6.2 ms |

每组预热3秒后采样120个requestAnimationFrame间隔，逐组执行。这是调度间隔，**不是GPU时间戳、真实手机性能或跨设备帧率保证**。每像素最多100次距离查询，法线另查询4次；每个距离查询默认含4轮折叠。没有单独量化各参数的GPU耗时。

- 自动DPR：受控130帧、每帧45ms主线程负载，1→0.8。这证明自适应路径，不表示Shader自然成本45ms。
- 减少动态效果：初始不建立GPU后端，正式海报加载；手动点击后启动实际WebGPU。
- 受控隐藏事件：document.hidden=true，800ms GPU submits 538→538，按钮为「播放动画」；恢复后submits=674、按钮为「暂停动画」。
- **原生后台标签页暂停未验证**：实际切到另一真实标签仍报告document.hidden=false。虽然submits暂时432→432，不能据此称为原生Page Visibility验证；返回后534。它与受控事件分别记录。

## 媒体与人工检查

- 实际非fallback TSL WebGPU画布海报：WebP960×600、182974bytes、quality92。
- 画布captureStream/MediaRecorder生成素材，经编码得到静音VP9 WebM960×600、25fps、188帧、7.52秒、2598899bytes、CRF35、无音轨；ffprobe逐帧计数确认188。
- 媒体采集速度0.6，前3.76秒接倒放；只处理媒体接头，实时Shader按正时间运行。
- 已检查最终压缩海报、循环3.2秒帧、原始GLSL、两后端默认图、两后端移动控件，以及WebGPU全部最小/WebGL2全部最大画面。默认海报不是底色、黑屏或整幅过曝；保留蓝色交错梁架。
- 启动时使用的原始GLSL海报已替换为实际TSL采集产物，不进入最终PR。

## 诊断保留与远端验证

初次WebGPU对照有两条unreachable break警告：Break()本身把语句加入TSL堆栈，表达式回调还会返回同一节点。将两处If改为不返回值的块回调，并同步修正教学代码后，最终对照、采集和极值检查均无Shader警告。初始日志保留，未屏蔽编译警告。

奇数视口初次locator截图为1002×602；实际绘图缓冲1001×601，CSS边界为1001.142883×601.142883，导致截图包围取整。保留首张PNG、初始日志和独立几何探针，仅本地极值工具改为精确1001×601 CSS视口裁剪，同时严格断言缓冲和PNG尺寸。没有更改Shader、共享运行时、正式测试断言或容差。

独立报告最初按相对路径写到临时配置目录之下，已原样保留并复制到统一证据路径；全量使用绝对PLAYWRIGHT_JSON_OUTPUT_FILE。素材脚本初次会话日期错误也在真正对照前修正，初始日志保留。以上为本地诊断工具修正，不当作产品渲染失败或旧测试根因修复。

远端CI必须查询最终提交对应运行、各任务和日志。若无适配器导致WebGPU跳过，它不构成远端硬件验证；本机实际非fallback WebGPU smoke和四组检查独立记录。PR最终合并仍由用户审批。
