# 视频笔记目录（notes-videos）

本目录下的 `.md` 文件会被 GitHub Pages 以静态资源形式发布，
前端在打开对应视频时会自动读取 `https://willimas0521.github.io/studyPA/notes-videos/<视频id>.md` 并渲染为笔记。

## 命名规则
- 文件名 = 视频的 `id` + `.md`
- 例如 `catalog.js` 里 `ff-1` 的笔记就是 `ff-1.md`，`bz-3` 的笔记就是 `bz-3.md`

## 内容
- 支持 Markdown（标题、列表、加粗、代码、链接等）
- 留空文件或不创建 = 前端显示「暂无笔记，后续将补充」

## 部署
运行 `python3 deploy.py` 时，本目录会自动同步到仓库根 `notes-videos/`，
无需手动上传。
