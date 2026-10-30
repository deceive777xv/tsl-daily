# Spout 来源与许可证档案

原作：**Spout — P_Malin（lsXGzH）**。原作链接：<https://www.shadertoy.com/view/lsXGzH>。

## 固定旧镜像

- 仓库：<https://github.com/GabeRundlett/shadertoy-api-shaders>。
- 固定提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`；文件提交时间 **2025-05-29T06:43:53Z**。
- [原始 JSON](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/lsXGzH.json)。README 记载初次下载 **2024-10-05**，不代表指标采样日期。
- 抓取、全文审阅、候选通知和用户批准：**2026-10-29**。
- 历史 **378 likes / 47656 views**，精确采样日期未知，不代表当前热度，不宣称 Featured 或 Shader of the Week。
- `mirror.json`：26125 字节，SHA256 `b95ebac35d201df3f8a54131c66cd52a588964e8539012b38ec85b8fae730a1c`，Git blob `9eb0a90cc4efa67ed19e5538e4af7693db352749`，与固定镜像树匹配。
- `original.glsl`：23438 UTF-8 字节 / 790 行，SHA256 `2ab8bc82b53baffca58683cbf4a95e3abc6cec4da9a3eb505b40f383cda32ac8`。

完整检查所有元数据及唯一 Image pass 的顶部、全文和结尾；没有 Common、Buffer 或 Sound pass。未见自定义许可证、禁止托管/展示/分发/改编的声明或声明复制其他作品代码的内容。原始 GLSL 和镜像 JSON 按字节保存，包含原作者署名与所有注释。

**按 Shadertoy 默认 CC BY-NC-SA 3.0 判断，基于旧镜像快照。** 这不是显式许可头部、当前作者确认或逐项权利保证。当前原作页面请求返回 HTTP 402，未绕过访问控制；当前源码、热度和作者最新声明未核实。[许可摘要](https://creativecommons.org/licenses/by-nc-sa/3.0/)与[完整法律文本](https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode)提供署名、非商业及相同方式共享条件。

## 概念引用

- 原始源码第 347 行将 Inigo Quilez 的 [距离函数文章](https://iquilezles.org/articles/distfunctions/)作为 ray marching 的概念资源。本例保留其署名和链接，未选择或复制带禁止托管声明的 IQ Shadertoy 作品。
- 第 458 行链接 [Schlick approximation](https://en.wikipedia.org/wiki/Schlick%27s_approximation) 的说明。它用于交代原作的菲涅耳近似；本例保留该参考，不将参考文章视为当前作品的许可授权。

## 用户批准和素材替换

用户在本聊天唯一 **Spout — P_Malin（lsXGzH）** 候选通知后直接回复“批准”，接受上述历史默认许可判断及本地砖纹理替换。制作前复核最新 main、全部 37 个历史 PR 与现有 33 个案例的大小写敏感来源 ID，未发现重复。只授权一个独立案例 PR；合并和发布由用户决定。

唯一外部输入 `iChannel0` 是墙地纹理，media ID 1，原元数据路径为 `/media/a/10eb4fe0ac8a7dc348a2cc282ca5df1759ab8bf680117e4047728100969e7b43.jpg`。其独立授权未建立，**没有下载、复制或托管该图**；原 JSON 中的路径仅作为来源记录。

本例使用新生成的 256×256 RGBA8 砖纹理：64×32 的规则砖块、交错砖缝、固定 LCG 种子 `0x7319ab` 和程序颗粒，linear/mipmap/repeat，NoColorSpace，flipY=false。纹理只创建一次，材质销毁时释放。没有复制其他图片、模型或音频，也没有外部运行时请求。墙地纹理细节不属于原贴图保真承诺；原始 GLSL 对照使用同一份新纹理。

TSL 的材质分支显式采样 mip 0，消除非一致控制流内隐式导数造成的采样不确定性；纹理字节及原始 GLSL 未改。这会改变远处砖纹的过滤效果，取舍和原始源码对照见 VALIDATION.md / ci-render-diagnosis.json。

## 改编范围

TSL 保留 SDF 布尔场景、材质编号和 UV、抛物线域变换、波纹相位、距离补偿、四点法线、包含端点的 33 次步进、最后一次位置/距离更新次序、入水和出水双面追踪、有限长度反射与二级场景、六次 AO 采样、方向光高光/阴影、Schlick 混合、倒数 RGB 消光近似、雾和原作默认相机。源文件中未启用的点光、低画质宏和 VR 入口仍保留在快照，当前二维播放器不接入它们。

新增五个教学参数：波纹速度、出水速度、波纹幅度、折射强度和取景宽度。折射强度 1 对应 `ior=1.333`，零值对应空气；菲涅耳基准仍保留原作的艺术化设置。时间从原作第 2 秒开始；增加零梯度和偏移分母保护、显示范围限制及 sRGB 解码。全反射沿用原作的零向量二级路径，未加入重复内部反射或声称物理准确。原作的鼠标环绕没有接入播放器，取景宽度参数改变视场，默认相机位置保持一致。

## 分发许可

原始 GLSL 和 TSL 改编遵循 [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)，署名 **P_Malin / Spout**，保留原作链接、旧镜像证据和修改说明。TSL 改编与新生成砖纹理代码另署名 TSL Daily contributors，2026。

中文原创赏析采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。生成媒体含来源的改编表达，按 CC BY-NC-SA 3.0 第 4(b) 条允许的同要素后续版本，以 CC BY-NC-SA 4.0 分发并保留上述来源署名。框架 MIT，站点永久非商业。
