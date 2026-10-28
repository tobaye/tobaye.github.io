# monkey-blog

MonkeyCode 免费云开发机实测博客：建站 + 每日发帖保活实验。

标准 Hugo 站点，主题为 [PaperMod](https://github.com/adityatelange/hugo-PaperMod)，主题文件完整放在 `themes/PaperMod/`，仓库自包含，克隆后可直接构建。

## 要求

- Hugo Extended v0.158.0 或更高（本机构建使用 v0.169.0+extended）

## 结构

- `hugo.toml` — 站点配置
- `content/posts/` — 文章 Markdown
- `themes/PaperMod/` — 内置主题
- `public/` — `hugo` 构建输出（不入库）

## 本地预览

```bash
hugo server -D
```

或先构建再提供静态文件：

```bash
hugo
python3 -m http.server 8000 --directory public
```

## 发新文章

```bash
hugo new content posts/YYYY-MM-DD-slug.md
```

编辑 frontmatter 里的 `title` 和 `date`，写完后去掉 `draft: true`。
