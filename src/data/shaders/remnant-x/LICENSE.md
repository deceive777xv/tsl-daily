# Remnant X — 来源、许可与改编记录

## 原作与批准

- 原作：**Remnant X — Dave_Hoskins / David Hoskins（4sjSW1）**，https://www.shadertoy.com/view/4sjSW1 。
- 用户于 2026-10-31 在本聊天唯一同名、同 ID 候选后直接回复“批准”，接受旧镜像中的显式许可证据、自生成噪声替换与静音视觉范围。只批准一个独立案例 PR，未授权自动合并或发布。
- 制作前核对最新 main `2d8a12c5a71c00bb8cad37fa343f8b49e6c6f457`、全部 38 个 PR 与 34 个已有案例，无同标题或 ID；分支 `codex/remnant-x` 从该 main 建立。

## 固定镜像证据

镜像仓库：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders)。固定提交：[`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`](https://github.com/GabeRundlett/shadertoy-api-shaders/commit/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5)。原始文件：[shaders/4sjSW1.json](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/4sjSW1.json)。

README 记载首次下载于 **2024-10-05**；该文件在固定提交中的日期为 **2025-05-29T06:43:53Z**，更早记录为 2024-10-06T12:51:23Z。本次抓取、完整审阅和批准为 **2026-10-31**。镜像元数据为 **529 likes / 52875 views**，精确指标采样日期未知，不能把 README、作品发表或提交日期当作指标采样日期。当前原页抓取返回 HTTP 402，未绕过访问限制；这里未声称核验当前官方源码、许可或热度。

完整检查了 **Image 308 行与 Sound 278 行**，两个 pass 顶部均明确写出：

> License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

这是**基于旧镜像快照中的显式 CC BY-NC-SA 3.0 声明**，不是默认许可推断。完整源码未发现禁止托管、展示、分发或改编的附加声明。Image 署名 David Hoskins，并致谢 boxplorer 与 Fractalforums.com 社群，改编保留这些署名。原作 HD 视频链接仅为演示链接，没有下载或作为输入使用。`mirror.json` 按原始字节保留整个 JSON，`original.glsl` 与 `original-sound.glsl` 分别按解码后的 UTF-8 内容完整保存，包括空白和原始许可；Sound 只归档，不播放。

| 文件                       | SHA-256                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| mirror.json（18038 bytes） | `7380ebe3ea2ca6f2701fc9b8ade6ec76c93a1e3c41d07817019d1e33d3c2f558` |
| original.glsl              | `742d97878a0cd11f2376e5a0d2925b64f8ce91c8e96db9ab9cfe9eb564164022` |
| original-sound.glsl        | `bb2cdf9cd888861c81ca532fd78d10155a62f254fcf7d839cd9f73fb24940918` |

JSON 的 Git blob 为 `ebd621ccda959733a020c7f31cff02eec3bfc022`，与固定镜像树一致。保留源文件字节，不通过格式化改写不可变证据。

## 输入与改编范围

原 Image 的 iChannel0 指向 `/media/a/f735bee5b64ef98879dc618b016ecf7939a5756040c2cde21ccb15e69a6e1cfb.png`，其图片来源未核验。**没有下载、复制或托管这张原始图片**。本站使用新生成的 256×256 RGBA8 噪声：xorshift32 种子 `0x73ac901d`，红、蓝通道存同一随机值，绿色通道在循环索引中平移 `(-37,-17)`，Alpha 为 255；NoColorSpace、flipY=false、linear/repeat、无 mipmap，采样显式 mip 0。数据只创建一次，材质销毁时释放。

原作的负 LOD bias 用于三维天空噪声，起步抖动在一屏幕像素对应一纹素的尺度采样。本站在两处显式使用 mip 0；天空和起步抖动随新噪声而改变，原始 GLSL 对照使用相同新纹理。分形几何本身不采样纹理。不加载其他图片、模型、音乐或网络资产。

TSL 保留九轮盒/球折叠与四维尺度、100 步距离估计追踪、12 单位搜索上限、原作起步抖动与步进次序、六次阈值二分、六点法线、六轮轨道着色、双光源八步阴影、近面辉光、天空与距离雾、移动相机及原矩阵列序、显示空间调色。增加极小半径/法线距离/光源距离与负值非整数幂保护，防止退化 NaN；对显示颜色作 sRGB 解码再交给共享输出。高光、辉光与雾仍为原作艺术化近似，没有声称物理准确。

新增五个教学参数：飞行速度、路径偏移、轨道着色、阴影强度、近面辉光。默认从原作第 2 秒开始；路径偏移代替原作鼠标横向时间偏移，未接入立体 STEREO 输出。Sound 完整归档但不移植音频，循环预览静音，采用真实渲染片段前进与倒放来闭合。

## 分发许可

原始源码、TSL 改编与新生成噪声代码按 [CC BY-NC-SA 3.0 Unported](https://creativecommons.org/licenses/by-nc-sa/3.0/)，署名 **Remnant X / David Hoskins（Dave_Hoskins）**，新增改编署名 TSL Daily contributors，2026。保留原作链接、社群致谢、许可与修改说明。

中文原创赏析采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。生成媒体含原作的改编表达，依据 CC BY-NC-SA 3.0 第 4(b) 条允许的同要素后续版本，按 CC BY-NC-SA 4.0 分发并保留上述署名。框架 MIT，站点永久非商业。
