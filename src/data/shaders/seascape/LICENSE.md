# 来源与许可证档案

- 原作：[Seascape — Ms2SD1](https://www.shadertoy.com/view/Ms2SD1)
- 作者：Alexander Alekseev aka TDM（2014）；上传者 TDM
- 用户批准：2026-09-06，本任务明确询问是否批准 **Seascape（Ms2SD1）** 按旧镜像证据制作，用户回复“批准”。本 PR 只包含这个获批案例；合并仍为最终发布审批。
- 镜像：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders)
- 固定提交：[f6d538adf936215ccf2d11ba9b4a6c79ccb448c5](https://github.com/GabeRundlett/shadertoy-api-shaders/commit/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5)，2025-05-29T06:43:53Z，`Update shaders May 29, 2025`
- 文件：[shaders/Ms2SD1.json](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/Ms2SD1.json)
- GitHub blob SHA：`a5de757737bdbfb1f1997174dff5d42ae91e8a26`
- 归档 JSON SHA-256：`46107D460DA98B2C83CE20E3C2D1099126627A2F9D89B85CE642B8CFF766F7E0`；`mirror.json` 保留 API 返回的原始文件字节
- 镜像 README 记载最初下载于 **2024-10-05**；所用文件最后提交于 **2025-05-29**。两者不能混为同一个热度采样日期。
- 核查/再次获取日期：2026-09-06；原始指标 **3194 likes / 797507 views**，确切采样时间未独立确定，只作为历史快照，不代表当前热度。
- Render pass：仅一个 `Image`，无纹理或其他输入；已通读全部源码并检查唯一通道顶部，未发现其他限制或二级来源署名。

## 显式许可

源码顶部声明：

```text
"Seascape" by Alexander Alekseev aka TDM - 2014
License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
```

因此本案例采用 [CC BY-NC-SA 3.0 Unported](https://creativecommons.org/licenses/by-nc-sa/3.0/)（[完整条款](https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode)）。这是**基于旧镜像快照中的显式声明**，不是推断 Shadertoy 平台默认许可，也不是 MIT。保留作者、原作与许可链接，明确标注改编，不作商业使用，衍生内容相同方式共享；不暗示作者认可本站。

## 文件与改编范围

- `mirror.json`：固定提交中的原始镜像 JSON，用于复核元数据和通道完整性。
- `original.glsl`：从 JSON 的唯一 Image pass 提取，保留作者、许可及原始算法。
- `src/shaders/cases/seascape.ts`：本站 TSL 改编，继续按 CC BY-NC-SA 3.0 发布。保留三层求交、五层法线、32 步上限和海水光照；增加五个参数、归一化拖动视角、除法与法线步长保护，规范 smoothstep 边界，并匹配运行时的 sRGB 输出。未启用原作可选的九样本 AA。
- `public/previews/seascape.webp` 与 `seascape.webm`：由本 TSL 改编在真实浏览器中渲染的衍生媒体，**同样按 CC BY-NC-SA 3.0** 分发。
- 独立中文教学赏析按 CC BY-NC-SA 4.0；框架 MIT。上述来源许可优先于站点原创内容通用声明。

## 当前页面的证据边界

2026-09-06 当前 Shadertoy 页面抓取返回 HTTP 402，本机 HTTPS 请求另遇 schannel 凭据错误，均未取得当前源码。历史上存在 Cloudflare 访问限制，但本轮没有观测到并声称新的 403。用户已明确同意按上述固定镜像证据继续；这不豁免已知限制、署名、非商业或相同许可要求。以后若发现冲突的许可证据，应暂停该案例的继续分发并重新核查。
