# eZ2 Wheels 问卷网站（GitHub Pages + 私有 Google Sheets）

英文受访者页面，33 道主问题，按兴趣、使用经历、充电兴趣与各产品方案选择显示后续问题。无第三方 CDN、无前端框架，无须安装 npm 依赖。此目录是完整源码；源码交付不代表已经上线。

## 部署顺序

1. 按 [Google Sheets 收集端说明](google-sheets/README.md) 创建私有表格与 Apps Script，完成管理员授权和 Web app 部署。表格保持“受限”，受访者只获得投递入口，不能读取所有回答。
2. 将得到的 `https://script.google.com/macros/s/部署ID/exec` 写入 [config.json](config.json) 的 `submissionEndpoint`。URL 为空时页面明确显示 **Preview mode**，正式提交按钮禁用。
3. 在 GitHub 新建用于此问卷的仓库。将本目录内容放到仓库根目录，确保 `index.html` 位于根目录。不要只上传上一级 `github-survey` 文件夹。按你账号的 GitHub Pages 方案选择可用的仓库可见性；网站访问者通常可读取公开站点的页面与脚本。
4. GitHub 仓库 → **Settings → Pages → Build and deployment → Deploy from a branch**，选择 `main` 和 `/ (root)`，保存。等待 Pages 部署成功，打开设置中给出的 HTTPS 地址。常见形式为 `https://用户名.github.io/仓库名/`，以 GitHub 实际提供的地址为准。
5. 将正式问卷地址写入 Apps Script 的 `RETURN_URL` 脚本属性。用无痕窗口实际填写并提交一份测试答卷；必须同时核对 Google 回执与私有 Sheet 新增的一行，才算完成上线验收。

前端用普通 HTML form POST 提交 `payload`，浏览器导航到 Apps Script 回执页。只有后端真实写入后才显示已保存。没有 `no-cors` 请求或模拟“提交成功”。

## 本地预览与测试

安装 Node.js 18 或更新版本后，在本目录运行：

```sh
npm test
npm start
```

打开 `http://127.0.0.1:4173`。也可以直接运行 `node --test tests/logic.test.mjs` 和 `node serve.mjs`。不要直接双击 `index.html`：浏览器对 `file://` 的模块和 JSON 读取有限制。

测试覆盖完整量表、33 主问题、576 种兴趣/经历/充电/方案组合、回改清理、Other 说明、空值与 0 区分、98 导出变量、二元多选编码、数字校验、方案顺序、CSV 转义及导入校验。后端另有模拟存储测试；模拟测试不能替代真实部署验证。

## 问卷与数据规则

- `survey.json` 是受访者措辞、题号、代码和条件的唯一前端配置。统一新版编号 Q1–Q33，保留旧编号映射 `oldRef` 供研究人员追踪，页面不展示内部备注。
- Q15 先收集 Scooter 与 Bike 两个兴趣答案；两者答完后再显示相关喜好/拒绝原因。Q18–Q22保留给所有合格受访者；两种产品都不感兴趣的人仍可回答态度、充电兴趣和最后意见。
- 每产品的使用量、接近车辆的步行时间、方案及原因分别判断。回到前面改答后，所有不适用的旧答案和 Other 文本自动清除。
- 0–10 包含全部 11 个整数；1–10 包含全部 10 个整数。手机上每个产品独立卡片，量表数字自动换行。
- 三个收费方案显示顺序在当前答卷会话内固定随机，代码 1/2/3 始终不变；None 始终最后，代码 4。价格明确标为 hypothetical scenarios。
- 每份答卷都有 `responseId`、版本、开始/完成时间和方案顺序。主数据含 98 个 `V_Q…` 变量，每个另有 `__asked`：不适用为空且 asked=0，真实回答 0 则为 0 且 asked=1。多选适用时未选为0、选中为1。可选Q33未填为空且 asked=1。
- 当前标签页通过 `sessionStorage` 暂存草稿；刷新可继续。关闭标签页后草稿通常清除，浏览器会话恢复设置可能保留它。不要将这描述为平台完全不处理任何技术信息；问卷本身不主动询问姓名、邮箱或学号。

## 下载与本地合并

完成页面可下载本次答卷 JSON/CSV 作为备份。**下载不等于已提交**，CSV 也不能代替研究者私有 Sheet 中的保存记录。

`admin.html` 是可选的本地文件合并工具，接受受访者另行提供的 JSON，重新校验并导出合并 CSV。它不上传文件、不访问 Sheet、不从服务器读取他人答卷，也不是带身份验证的管理后台。重复 ID 且内容一致会忽略；相同 ID 内容冲突会拒绝后导入的文件。刷新此页清空导入的内容。

**不要将答卷、研究结果或导出的表格 commit 到 GitHub 仓库。** `.gitignore` 已忽略常见答卷文件名，但不能代替检查。网站源码、问卷内容、公开提交端点可以公开；Google 私有表格回答、授权凭据、API 密钥不得放进前端。此实现不需要在网页放任何授权密钥。

## 文件

| 文件 | 用途 |
|---|---|
| `index.html` / `app.mjs` / `styles.css` | 受访者页面与交互 |
| `survey.json` | 问卷 v2.0 内容和数据字段 |
| `logic.mjs` | 条件、清理、校验、导出的纯函数 |
| `config.json` | 公开投递 URL；未配置即预览模式 |
| `google-sheets/` | 私有 Sheet 的 Apps Script 收集端及说明 |
| `admin.html` / `admin.mjs` | 可选的本地 JSON 合并工具 |
| `tests/logic.test.mjs` | 无依赖 Node 逻辑测试 |
| `serve.mjs` | 本地预览服务器 |

更改题目/编码/条件时，同步 Google Apps Script 的 Schema/Logic、更新问卷版本并重新测试；不要让两端规则不一致。

官方部署参考：[创建 GitHub Pages 网站](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)、[Apps Script Web apps](https://developers.google.com/apps-script/guides/web)。
