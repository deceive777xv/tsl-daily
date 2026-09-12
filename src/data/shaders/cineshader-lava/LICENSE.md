# CineShader Lava — 许可证与来源证据

- 原作：**CineShader Lava — edankwan（3sySRK）**。
- 原作链接：https://www.shadertoy.com/view/3sySRK
- 本案例是 TSL 授权移植，中文名「熔彩流动」。
- 许可判断：**CC BY-NC-SA 3.0（基于旧镜像快照的默认许可判断）**。不是原始源码显式声明。
- 许可正文：https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode
- 站点永久非商业；原始 GLSL、TSL 改编、海报与 WebM 衍生媒体按 CC BY-NC-SA 3.0 分发。独立中文赏析 CC BY-NC-SA 4.0；框架 MIT。

## 镜像与热度

固定文件：https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/3sySRK.json

- 仓库：GabeRundlett/shadertoy-api-shaders。
- 提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，文件提交日期 **2025-05-29T06:43:53Z**。
- [镜像 README](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/README.md)注明初始备份下载于 **2024-10-05**。提交日期不等于热度采样日期，确切采样日未知。
- 历史快照：**489 likes / 382982 views**，不代表当前热度。
- 本次抓取与审阅：**2026-09-12**。
- `mirror.json` SHA-256：`47C79C3AEEED684AE2501CFF02EA97475327E8BB2BAD71888F74DDBFC42DE8EA`。
- 镜像有文件名大小写碰撞风险；已核对 JSON 内部 `info.id` 精确为 `3sySRK`，作者为 `edankwan`。
- 当前 Shadertoy 页面抓取返回 **HTTP 402**，当前页面、源码及热度未复核。本次没有直接观察到 Cloudflare 403，不将历史访问问题写成新的检测结果。

## 全部 render pass 检查

只有一个 **Image** pass，输入数组为空。完整源码、顶部与末尾均已检查；无自定义许可证，无禁止托管、展示、分发或改编的声明，无二级来源署名。末尾 SHADERDATA 是 CineShader 元数据，不包含素材或许可限制。

按用户允许的两阶段旧镜像流程，对没有自定义许可证的源码使用 Shadertoy 默认 CC BY-NC-SA 3.0 判断。该判断明确基于旧镜像，不声称当前原作已被重新核验。若未来得到相反的有效授权证据，应重新评估分发。

## 候选批准

2026-09-12，本任务提交 **CineShader Lava — edankwan（3sySRK）** 候选，披露原作链接、历史热度、镜像与抓取日期、默认许可判断、当前页不可核验及与现有案例的差异。用户随后明确回复：**“批准”**。

此批准仅授权本案例按上述镜像证据继续制作并创建一个独立 PR。PR 合并仍为最终发布审批；自动化不自行合并。

## 保留与改编

- `mirror.json` 保存审批时镜像 JSON 字节；`original.glsl` 原样提取唯一 Image pass，保留空白和末尾元数据。
- TSL 保留十六球体距离场、球体轨迹、平滑并集、正交射线、四面体法线、余弦调色与指数深度衰减。
- 默认起始时间为原作第 8 秒。增加五个 uniform 参数：形体速度、融合程度、球体大小、色彩速度、景深衰减。
- 竖屏按宽度容纳六个世界单位，横屏保持原作比例。
- 表面停止阈值从 `1e-6` 改为 `0.001`，法线差分间距从 `1e-5` 改为 `0.001`，增加归一化分母保护；六单位远端退出，远端背景亮度设零，达到步数上限但未到远端时用最后采样点近似表面。这些改动可能造成细微轮廓与明暗差异。
- CineShader Alpha 厚度数据不用于透明合成；展示 RGB、不透明输出，不加载 CineShader 模型或外部素材。
- 显示 RGB 截断后先解码，再由站点输出 sRGB。海报与无音轨视频由实际浏览器画布生成；视频循环通过首尾短交叉淡化制作，不声称原始轨迹严格周期。

## 署名

CineShader Lava by edankwan — https://www.shadertoy.com/view/3sySRK

TSL adaptation and independent Chinese commentary: TSL Daily contributors, 2026. Source adaptation and derived media: CC BY-NC-SA 3.0, based on the approved historical mirror and default-license workflow. No endorsement by the original author is implied.
