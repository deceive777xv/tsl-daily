# TSL Daily

每天读懂一个 Shader。

TSL Daily 是一个非商业的 Shader 学习与数字画廊：从 Shadertoy 选择热门且许可清晰的作品，
使用 Three.js TSL 重写，并通过中文分层赏析解释视觉思路与关键代码。

当前原作中的限制性声明会覆盖旧镜像里的历史许可。只有源码顶部许可证据明确，或确认未见自定义许可而适用 Shadertoy 默认许可时，案例才会进入制作流程。

## Local development

```bash
npm install
npm run dev
```

完整验证：

```bash
npm run quality
```

## Content workflow

每个案例通过独立 Pull Request 审批。案例目录必须包含正文、TSL 实现和许可证档案；
PR 必须通过发布级门槛后才可合并。

## Licensing

网站框架使用 [MIT](./LICENSE)。文章、视觉内容和案例采用分层许可，详见
[LICENSES/CONTENT.md](./LICENSES/CONTENT.md) 及各案例的 `LICENSE.md`。
