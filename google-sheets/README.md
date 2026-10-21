# 本次 2.2 升级说明

更新现有 Apps Script 项目时，使用本目录的 Schema.gs、Logic.gs、Code.gs 完整替换旧版规范、逻辑与收集代码。
可分别保存为三个脚本文件，也可按上述顺序合并为一个脚本文件；不要同时保留合并文件与分拆文件，否则常量会重复定义。
沿用现有 SPREADSHEET_ID / RETURN_URL 脚本属性，运行 setupSurveySheet 创建 Responses_v2_2；
原 Responses 和 Responses_v2_1 不会被清空或改写。在同一项目中为 2.2 创建新的版本部署，保留原 2.0、2.1 部署及其 /exec 地址，供已经加载旧问卷的受访者继续提交。
新部署验证通过后，将新 /exec 地址写入 2.2 前端 config.json，并一次性发布网站全部升级文件。不要把 2.2 前端接到旧部署，也不要为本次升级覆盖旧部署的版本。
本地模拟测试不会调用 Google 服务；发布后仍需真实端到端验证。

# Google Sheets 集中收集：安装与验证

此目录是 GitHub Pages 问卷的配套收集端。页面负责问卷显示，Google Apps Script 负责重新校验、写入私有表格并显示真实回执。源码已包含问卷 v2.2 的规范和逻辑；本地代码文件本身不代表后端已上线。

## 1. 准备私有表格和 Apps Script

1. 登录你用来管理问卷的 Google 账号，创建一个空白 Google Sheet，例如“eZ2 Wheels Survey Responses”。保留“受限”分享权限，不需要公开表格，也不需要让受访者成为协作者。
2. 从表格地址 `https://docs.google.com/spreadsheets/d/这里是ID/edit` 复制中间的表格 ID。
3. 在 [Apps Script](https://script.google.com/) 新建独立项目。将本目录的 `Code.gs`、`Schema.gs`、`Logic.gs` 分别复制到同名脚本文件。不要把后端代码粘到 GitHub 页面 JavaScript 中。
4. 在 Apps Script“项目设置”打开“在编辑器中显示 appsscript.json 清单文件”，用本目录的 `appsscript.json` 替换清单内容。使用 V8 运行时。
5. 在“项目设置 → 脚本属性”添加下面两项：

| 属性 | 值 |
|---|---|
| `SPREADSHEET_ID` | 第 2 步复制的私有表格 ID |
| `RETURN_URL` | 问卷的正式 HTTPS 地址，例如 `https://用户名.github.io/仓库名/` |

`RETURN_URL` 只读取管理员在脚本属性中的配置，不接受提交数据中的返回地址。它可以是 GitHub Pages 地址或你配置的 HTTPS 自有域名。不要添加 OAuth token、服务账号密钥或任何前端密钥。

6. 在脚本编辑器中选择 `setupSurveySheet` 并运行一次。由表格所有者完成 Google 授权。函数将创建 `Responses_v2_2` 工作表并写入固定列名；如果同名表已有不一致列名，它会停止，避免混用不同问卷版本。

## 2. 部署收集地址

1. 选择“部署 → 新部署 → 网络应用”。
2. “执行身份”选择你自己（部署者）；访问权限选择允许任何人，包括未登录 Google 的人。
3. 点击部署，复制以 `/exec` 结尾的 Web app URL。不要使用 `/dev` 测试地址，它仅对脚本编辑者开放。
4. 清单中的 `executeAs: USER_DEPLOYING` 表示以部署者身份运行；`access: ANYONE_ANONYMOUS` 表示无需登录。清单的 `ANYONE` 表示已登录用户，不等于匿名访问。实际发布对话框也要选择对应权限。
5. 学校或机构 Workspace 管理员可能禁止匿名 Web app。若没有匿名选项，或无痕窗口访问要求登录，请联系管理员或使用允许此部署的账号；不要假定清单能绕过组织限制。

## 3. 连接 GitHub Pages 前端

将上一步 `/exec` URL 写入网站目录 `config.json` 的 `submissionEndpoint`，提交并更新 GitHub Pages。例如：

```json
{
  "submissionEndpoint": "https://script.google.com/macros/s/你的部署ID/exec"
}
```

如果配置文件还包含其他设置，保留它们，只修改 `submissionEndpoint`。端点 URL 本身是公开投递地址，不是授权凭证。私有表格 ID、所有者授权和回答读取权限都留在 Apps Script/Google 账户侧。

网站通过普通表单 `POST` 提交一个 `payload` 字段，字段内容是 `makeRecord` 生成的 JSON。浏览器随后导航到 Google 返回的回执页。后端完成写入后才会出现“Your response has been saved”，并给出提交编号和服务端 UTC 时间。回执页提供返回问卷链接；不用跨域 `fetch(no-cors)` 猜测是否成功。

## 4. 正式分发前的真实验证

本地测试只能验证代码与模拟存储，必须再完成一次实际在线测试：

1. 在未登录 Google 的无痕窗口打开 GitHub Pages 问卷，完成一份有效回答并提交。
2. 确认看到带 receipt 编号的“已保存”回执；回到私有 Sheet，确认新增的一行编号一致。网页出现感谢文字本身不能替代这一步。
3. 测试仅喜欢 Scooter、仅喜欢 Bike、两个都喜欢、两个都不喜欢四种路径。双不喜欢仍应回答 Q18–Q22，并可填写 Q33；不会出现使用量、价格和校外意向题。
4. 测试 Q27 一种产品选方案、另一种选 None：分别出现 Q28 与 Q29。选择“Other”或“different kind of plan”后应要求对应说明。
5. 返回修改兴趣、经历或方案答案，重新进入后续步骤；隐藏题旧答案应消失，Sheet 的对应值留空且 `__asked=0`。
6. 同一记录重试不会新增重复行；同一个提交编号携带不同答案会被拒绝，原行不被覆盖。
7. 删除你明确标为测试的回答行后，再分发正式问卷。保留表头。

## 5. 导出和理解数据

只有表格管理者从 Google Sheets 的“文件 → 下载”导出 `.xlsx` 或当前工作表 `.csv`，不在问卷网页提供公开的回答下载接口。

每行是一份通过校验的合格受访者回答。元数据列包含 `submission_id`、服务端接收时间 `received_at_utc`、问卷版本、浏览器开始/完成时间、方案显示顺序及用于幂等检查的摘要 `payload_sha256`。浏览器时间供辅助分析，服务端时间才是接收时间。

问卷值列沿用数据字典的 `V_Q…` 名称，每个值都有一个 `__asked` 列：1 表示该问题/说明框适用，0 表示按跳题规则不适用。多选题适用时，未选为 0、选中为 1；未被询问整组为空，不能把其当作“所有原因都未选”。Q33 为适用但未填时，值为空、`__asked=1`。

所有单元格通过 RichTextValue 按文字写入，防止回答被当作表格公式执行。以 `=`、`+`、`-`、`@`、制表符或回车开头的自由文本另外添加一个英文单引号前缀，便于安全导出 CSV；该前缀是存储转义，不属于原回答。评分和金额仍用标准数字字符保存；需要数值计算时，可在分析副本中对相应数据字典数值列转换类型。不要直接修改收集表的列顺序/列名。

后台不会信任客户端提交的 `flat`、`asked` 或问卷标题，而是从内嵌的 v2.2 规范重新生成。未知字段、版本不符、格式错误、超长内容和不完整适用题会被拒绝；Q1=No 不保存为合格问卷。单次 HTTP 请求上限 128 KiB，JSON payload 上限 32768 字符；题目自己的 40/100 字符、取值范围及小数位限制仍单独生效。

## 6. 更新与失败处理

- 修改问卷时，同步网站 schema/logic 与 `Schema.gs`/`Logic.gs`，并提升版本号。不要只改一端。更换列结构时应创建新的私有表或新项目，而不是让旧记录混进新结构。
- 本次升级须“部署 → 新建部署”，保留原版本端点供已打开的旧问卷继续提交。仅保存编辑器文件不会更新正式版本。
- 若回执显示未保存，先保留前端下载的本地备份，然后检查 Apps Script 执行记录、表格访问权限、脚本属性、表头、配额及匿名部署。不会通过公开 GET 返回已存回答。
- 自动化重试使用相同 `responseId`。服务端在锁内查重及写入；已经保存的相同回答返回原 receipt，不新增行。
- 对网络中断，可能出现“已写入但尚未收到回执”。不要据此断言数据丢失；使用相同记录重试或由管理者按 submission ID 查询表格。

## 官方参考

- [GitHub Pages 的静态站点限制](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Apps Script Web apps：POST、部署和执行身份](https://developers.google.com/apps-script/guides/web)
- [Web app 匿名权限枚举](https://developers.google.com/apps-script/manifest/web-app-api-executable)
- [Apps Script HTML 确认页的导航限制](https://developers.google.com/apps-script/guides/html/restrictions)
- [LockService 并发保护](https://developers.google.com/apps-script/reference/lock/lock-service)
- [Google Sheets RichTextValue](https://developers.google.com/apps-script/reference/spreadsheet/rich-text-value)
- [Apps Script 配额](https://developers.google.com/apps-script/guides/services/quotas)

此安装说明不表示 Google 账号、Sheet、GitHub 仓库或收集端已经替你创建；实际部署状态以主交付说明及真实提交验证为准。

## 2.2 缺失值规则

Q6 原始 JSON 答案保留 99=NA；分析值 V_Q6 留空，V_Q6__asked=1。它不是 99 英里，也不应作为数值参与距离统计。Q12 有效编码 2–5 表示曾使用并触发 Q13–Q14；1=Never 跳过。所有题目和选项文字严格保留 Pierre 文件。
