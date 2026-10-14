# crumpledWave — 许可证与来源证据

- 原作：**crumpledWave — nasana（3ttSzr）**，[原作链接](https://www.shadertoy.com/view/3ttSzr)。
- 固定镜像：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/3ttSzr.json)。
- 文件提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，**2025-05-29T06:43:53Z**，按文件路径查询提交历史确认。固定 README 声明初次下载于 **2024-10-05**。
- 本次取回、完整审阅及用户批准：**2026-10-14**。内部精确 ID、标题和作者分别为 `3ttSzr`、`crumpledWave`、`nasana`。
- 历史热度：**147 likes / 65606 views**；精确采样日期未知，初抓日与提交日不等于指标采样日，也不代表当前热度。
- `mirror.json` 原始 **1343 bytes**，SHA-256：`EB0B0F391039B5B893B1A6E60E1FC309141F4144BE72AD2B43E9F25D2783A7BA`。固定提交的 Git blob：`0b3a9aa1d14e20e2840b01e40824bf6a91a1225d`。新取回字节与候选筛选缓存完全相同。
- `original.glsl` 为完整唯一 Image pass 解码字符串，**416 UTF-8 bytes / 15 行**，SHA-256：`D284E2F3A12C0ABC94C62B673CBD0C75CA1526FD09FE672EF074BE0D68F157B6`。头尾空白完整保留，没有格式化或插入许可头；本站署名另存本档案与 TSL 文件。
- 当前 Shadertoy 页面无法通过浏览工具复核，返回“URL not accessible”；该作品没有得到具体 HTTP 402/403 响应，不推定状态。原始镜像下载的暂时传输 EOF 已通过固定 ref 的 GitHub 内容 API 恢复，不是访问控制绕过。

## 全通道审阅与许可判断

已阅读完整 JSON 元数据及完整唯一 Image / image pass 的十五行源码，包括顶部与结尾。`inputs` 为空，没有 Common、Buffer、Sound、反馈、贴图或音频依赖。作者描述只链接自己的社交账号，没有引用该账号上的代码或素材。

所有 render pass 源码顶部和全部内容均没有自定义许可证、禁止托管/展示/分发/改编的限制或第三方源码署名。因此按用户授权的旧镜像流程，采用 **Shadertoy 默认 CC BY-NC-SA 3.0（基于旧镜像快照）** 判断。这是默认规则判断，**不是源码顶部的显式许可授予，也不是当前页面或作者的最新许可核验**。

原作与 TSL 改编遵循 [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)，保留 nasana、原作标题、原作链接、许可及改编说明，限非商业并按相同方式共享。框架 MIT；原创中文赏析和本站生成媒体 CC BY-NC-SA 4.0；站点永久非商业。署名不表示作者为本站背书。

## 用户批准记录

2026-10-14 先推荐完全相同的 **crumpledWave — nasana（3ttSzr）**，披露关键技术、历史热度与未知采样日期、固定镜像日期、默认许可判断、当前页面无法复核及与「银纹流墨」的技术重合和区别，附原始 GLSL 的真实浏览器预览。用户随后明确回复 **“批准”**，接受按此镜像证据制作一个案例和一个独立 PR。

批准在 **2026-10-14T12:43:27.4013927Z** 记录到 automation memory；这个时间是批准记录检查点。实现从最新 main `5dcdc1f98b7f84f543bfbbc60392e5a538051c9e` 的 `codex/crumpled-wave` 分支开始。批准仅使用一次，不授权自行合并；PR 合并仍是用户的最终发布审批。

## 改编说明

- 保留原作短边归一化、七轮单轴正弦乘积、频率为层号平方、每轮读取更新后的 y，以及 RGB 偏移 -0.1 / +0.3 / +0.95。
- 原作 `i * 0.1 / i` 在正层号下恒为 0.1；TSL 以这个常量作为默认可调幅度，不改成递减层权重。
- 默认源时间从 7 秒开始；五个教学参数为速度、层数、幅度、频率倍率和色带位置，默认 1 / 7 / 0.1 / 1 / 0。
- 显式截取显示 RGB 到 0–1，再做 sRGB 解码交给共用输出；与原作颜色显示的截断方式一致。没有新增贴图、折射、法线、bloom 或模拟。
- 海报和无声短片来自真实浏览器的 TSL 画布；短片往返只用于闭环。原作、后端、参数、移动、性能及隐藏暂停证据见 `VALIDATION.md`。

Attribution: crumpledWave by nasana, Shadertoy 3ttSzr. Historical source and the 2026 TSL adaptation: CC BY-NC-SA 3.0, based on the explicitly approved historical-mirror/default-license workflow. Changes are listed above. No endorsement is implied.
