import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const contentRoot = join(root, 'src', 'data', 'shaders');
const shaderRoot = join(root, 'src', 'shaders', 'cases');
const previewRoot = join(root, 'public', 'previews');

const errors = [];
const caseDirectories = readdirSync(contentRoot, { withFileTypes: true }).filter((entry) =>
  entry.isDirectory(),
);

function requireFile(path, description) {
  if (!existsSync(path) || statSync(path).size === 0) {
    errors.push(`${description}: ${path}`);
  }
}

for (const directory of caseDirectories) {
  const slug = directory.name;
  const caseRoot = join(contentRoot, slug);
  const articlePath = join(caseRoot, 'index.md');

  requireFile(articlePath, `[${slug}] 缺少案例正文`);
  requireFile(join(caseRoot, 'LICENSE.md'), `[${slug}] 缺少许可证档案`);
  requireFile(join(caseRoot, 'original.glsl'), `[${slug}] 缺少原始 GLSL 快照`);
  requireFile(join(shaderRoot, `${slug}.ts`), `[${slug}] 缺少 TSL 实现`);
  requireFile(join(previewRoot, `${slug}.webp`), `[${slug}] 缺少静态预览`);
  requireFile(join(previewRoot, `${slug}.webm`), `[${slug}] 缺少循环预览`);

  if (!existsSync(articlePath)) continue;
  const article = readFileSync(articlePath, 'utf8');
  const frontmatterEnd = article.indexOf('\n---', 3);
  const frontmatter = frontmatterEnd > 0 ? article.slice(0, frontmatterEnd) : article;
  for (const field of ['caseType:', 'source:', 'license:', 'licenseUrl:', 'evidence:']) {
    if (!article.includes(field)) errors.push(`[${slug}] Frontmatter 缺少 ${field}`);
  }
  for (const genericTag of ['TSL', 'Three.js', 'Shader']) {
    if (new RegExp(`^\\s*-\\s+${genericTag.replace('.', '\\.')}\\s*$`, 'm').test(frontmatter)) {
      errors.push(`[${slug}] 标签 ${genericTag} 是全站共有属性，应改为本案例的关键方法或技术`);
    }
  }
  if (!article.includes(`poster: /previews/${slug}.webp`)) {
    errors.push(`[${slug}] 静态预览路径必须与 slug 一致`);
  }
  if (!article.includes(`loop: /previews/${slug}.webm`)) {
    errors.push(`[${slug}] 循环预览路径必须与 slug 一致`);
  }
}

if (errors.length > 0) {
  console.error(['案例契约校验失败：', ...errors.map((error) => `- ${error}`)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`案例契约校验通过：${caseDirectories.length} 个案例。`);
}
