# 使用 Astro 构建静态内容站点

网站使用 Astro、TypeScript 与 Three.js：Astro 在构建时从类型化内容集合生成首页、案例页和标签归档，Three.js TSL 画布与探索参数作为客户端交互岛运行。相比单页应用，这为 GitHub Pages 生成可直接访问的案例 URL，并减少非交互内容所需的客户端 JavaScript；代价是每个需要实时状态的界面边界都必须显式设计为客户端岛。
