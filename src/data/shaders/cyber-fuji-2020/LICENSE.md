# 来源与许可证档案

- 原作：[Cyber Fuji 2020 — kaiware007（Wt33Wf）](https://www.shadertoy.com/view/Wt33Wf)。
- 用户批准：2026-09-09，本任务就同标题、同 ID 的候选询问是否批准，用户明确回复“批准”。授权基于已披露的旧镜像证据制作一个独立案例 PR；合并仍为最终发布审批。
- 镜像：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders)，固定提交 [f6d538adf936215ccf2d11ba9b4a6c79ccb448c5](https://github.com/GabeRundlett/shadertoy-api-shaders/commit/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5)。
- 文件：[shaders/Wt33Wf.json](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/Wt33Wf.json)，最后提交于 **2025-05-29T06:43:53Z**。
- 获取、完整源码审阅及本地原始 GLSL 画面检查：**2026-09-09**。
- `mirror.json` 原样保存解码后的 UTF-8 字节，SHA-256：`35B6958E2C0AA430A55D89BAC227BEF88686FA4EB194AA51EAA88ECF5E7C034A`。
- README 标注备份下载于 **2024-10-05**，不同于提交日期。历史 **569 likes / 590478 views**；准确采样日期未知，不能当作当前热度。

## 默认许可判断

已通读全部源码和所有 render pass 顶部：只有一个 Image pass，零输入。源码直接从 `sun` 函数开始，未发现自定义许可、限制条款或二级代码署名；描述为新年祝福，未列额外来源。

依据本任务已获批准的旧镜像流程，无自定义许可时按 Shadertoy 默认 [CC BY-NC-SA 3.0 Unported](https://creativecommons.org/licenses/by-nc-sa/3.0/)（[完整条款](https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode)）判断。此判断**基于旧镜像快照**，不是源码顶部显式许可，也不是用户代原作者授予新许可。保留署名、来源链接、许可链接和改编说明，非商业使用，衍生内容相同方式共享，不暗示原作者认可本站。

2026-09-09 当前 Shadertoy 页面抓取返回 HTTP 402；未取得当前源码或热度，未绕过历史 Cloudflare 限制，也未把本次 402 描述为新观测到的 403。若未来取得冲突信息，需要重新核查。

## 文件与修改清单

- `mirror.json`：完整 JSON 字节快照。
- `original.glsl`：从唯一 Image pass 原样提取，包含未启用的实验分支与注释。
- `src/shaders/cases/cyber-fuji-2020.ts`：CC BY-NC-SA 3.0 TSL 改编；保留太阳、山、雪线、两朵云、透视网格及颜色叠加。新增五个 uniform，规范反向 smoothstep、保护线段投影分母、添加显示 RGB 解码；从第 8 秒开始，竖屏扩大坐标范围以容纳主要构图。原作固定 battery=1，鼠标实验分支不启用；没有外部资源。
- `public/previews/cyber-fuji-2020.webp` 与 `.webm`：由浏览器渲染本改编生成的衍生媒体，CC BY-NC-SA 3.0。循环首尾交叉淡化仅用于预览剪辑。
- 独立中文赏析 CC BY-NC-SA 4.0；框架 MIT。来源许可优先于通用原创内容许可，站点永久非商业。
