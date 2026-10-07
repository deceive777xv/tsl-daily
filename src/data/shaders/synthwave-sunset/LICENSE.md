# another synthwave sunset thing — 许可证与来源证据

- 原作：**another synthwave sunset thing — stduhpf（tsScRK）**，https://www.shadertoy.com/view/tsScRK 。
- 本案例：TSL 授权移植「霓虹山路」。
- **CC BY-NC-SA 3.0：基于旧镜像快照的 Shadertoy 默认许可判断，不是源码显式授权声明。**
- 许可正文：https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode 。
- 原始 GLSL、TSL 改编、衍生 WebP 和无声 WebM 遵循 CC BY-NC-SA 3.0；独立中文赏析 CC BY-NC-SA 4.0，站点框架 MIT，网站永久非商业。

## 固定镜像证据

- 镜像：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders)；[tsScRK.json 固定文件](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/tsScRK.json)。
- 文件提交：f6d538adf936215ccf2d11ba9b4a6c79ccb448c5，2025-05-29T06:43:53Z，已核对 GitHub API。
- [固定 README](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/README.md) 记载初始下载于 2024-10-05。与文件提交日期不同，不推断后续指标的采样时间。
- 本次抓取、完整审阅日期：2026-10-07。历史热度 **248 likes / 352994 views**，精确采样日期未知，非当前指标。metadata 的 info.date 是作品日期，不作为指标采样日期。
- mirror.json 原始字节 SHA-256：E96EDD07CFCBD22613D7C121DEE90E274DDB8BB86BD00273D642091ACBB91052。内部 info.id 大小写精确为 tsScRK；作者 stduhpf；名称 another synthwave sunset thing。
- 已检查完整 metadata 及唯一 Image pass 的顶部、正文和末尾：无自定义许可、禁止托管/展示/分发/改编的限制声明，亦未发现二级代码或素材署名。默认许可判断不等于作者另行给予无限制使用许可。
- Image pass 的 inputs 为空。源码默认定义 disable_sound_texture_sampling，声音分支未生效；本案例保持默认静音范围，不获取、托管或播放音频、纹理或模型。
- 当前 Shadertoy 页面抓取返回 HTTP 402，当前代码、许可和指标未复核。旧镜像证据及其局限已经向用户披露。

## 用户批准记录

2026-10-07，任务推荐 **another synthwave sunset thing — stduhpf（tsScRK）**，披露原作链接、关键技术、旧镜像热度与日期、默认许可判断和与现有案例的差异。用户随后明确回复 **“批准”**。该批准仅对应这个完全相同的标题和大小写精确 ID 的一个静音案例及一个独立 PR。PR 合并是最终发布审批，不自行合并。

## 保留与修改

- mirror.json 保留镜像原始字节；original.glsl 是完整 Image pass 的解码源码，不删改注释、编译开关或空白。
- TSL 实现原作默认的三角高度插值、半步高度场求交、有限差分法线、程序化星空、条纹太阳、近似 Fresnel 反射、网格边线和距离雾。
- TSL 不实现未启用的音频、AA、立体视图、city 或 VAPORWAVE 编译分支。不需要外部输入；删去了只为已禁用音频分支计算的值。
- 默认从原作第 2 秒开始。新增行进速度、地形高度、网格亮度、太阳大小和雾密度五个教学参数；默认取值保持原作数值。
- 默认求交上限保持 500 次、视距保持 150。地形高度超过默认值时将半步除以 max(height, 1)，并按 max(height, 1) 缩放地形上界；保留低地形时相机下方的地面，也避免高地形时步长过大。默认高度为 1 时与原作一致。
- 反向 smoothstep 改为 1-smoothstep 的递增阈值形式，避免依赖 GLSL 的未定义阈值顺序。normal 差分统一归一化，不再保留在归一化前会抵消的除以 0.005。
- 原作运动模糊 jitter 依赖 iTimeDelta；此版交互画面采用当前源时间直接推进，以便暂停、恢复及参数比较确定性重复。对照基线使用 iTimeDelta=0。这会改变极轻微的采样抖动，不宣称所有浏览器、时刻逐像素相同。
- 原作 RGB 作为显示颜色解码到线性空间，随后由站点统一输出 sRGB。忽略 CineShader 用于深度展示的 alpha。
- 海报与无声短片由真实浏览器 TSL 画布生成。短片录制行进速度 0.35 的动画，截取前 3.76 秒并接入倒放，形成 7.52 秒往返循环；倒放仅用于媒体，交互画面按时间向前运行。媒体编辑和实际验证方式见 VALIDATION.md。

another synthwave sunset thing by stduhpf — https://www.shadertoy.com/view/tsScRK

TSL adaptation and independent Chinese commentary: TSL Daily contributors, 2026. No endorsement by the original author is implied.
