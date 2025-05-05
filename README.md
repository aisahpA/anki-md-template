# 可以解析`markdown`语法的`Anki`卡片模板
> 特点：纯文本代码模板，无需任何插件，复制就能用

> 核心 markdown 解析器 👉[markdown-it](https://github.com/markdown-it/markdown-it)，
> 数学公式解析器：[KaTeX](https://github.com/KaTeX/KaTeX)

### 👇 目前的功能
>（有什么改进可以在 issue 里提, 有能力可以自行修改提 pr,喜欢的兄弟姐妹们可以点个star支持一下）

- 编辑只需按照 markdown 语法编写

- 代码自动高亮

- 样式风格采用 `github-markdown-css`

- 图片直接截图或者保存就行

- Anki 编辑器`fx`图标编辑的内容按原来的方式渲染 (公式实际存储为`\(...\) 或 \[...\]`的格式)

- 支持 `$...$ 或 $$...$$` 格式的数学公式。其他格式可在`正面内容模板.html`中`getAnkiMarkDownIt`方法里修改`delimiters`

---

### 卡片模板创建指引

1. 正面内容模板：完整复制仓库 `模板/正面内容模板.html` 的内容，根据实际情况替换正面字段`{{正面}}`

2. 背面内容模板：完整复制仓库 `模板/背面内容模板.html` 的内容，根据实际情况替换背面字段`{{背面}}`

3. 样式：完整复制仓库`模板/样式.css` 的内容
