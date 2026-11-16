# Privacy Policy / 隐私权政策 — Refined Gemini

*Last Updated / 最后更新：2026-11-16*

---

## English

**Refined Gemini** respects your privacy completely:

1. **Zero Data Collection**: Refined Gemini does **not** collect, transmit, store, log, or share any personal information, chat prompts, model responses, browsing history, cookies, or analytics data.
2. **Local Styling, No Background Telemetry**: Styling runs locally inside your browser on `https://gemini.google.com/*` (and embedded Generative UI `SafeContentFrame` subframes on `https://*.scf.usercontent.goog/*` / `https://*.googleusercontent.com/*` to synchronize diagram themes and font sizes). The extension does not send background analytics or make requests to developer-operated servers. Browser preference synchronization is described below. Opening a feedback link deliberately navigates to GitHub as described in section 4.
3. **Preference Storage and Browser Sync**: The `storage` permission (`chrome.storage.sync`) saves UI preferences such as theme mode, column width, font size, indentation scale, and UI language. If extension synchronization is enabled in Microsoft Edge, the browser may synchronize these preferences through your browser account. Page `localStorage` caches UI preferences locally. Chat prompts and model responses are not saved in these settings. The developer does not receive the settings or operate a synchronization server.
4. **Permissions and User-Initiated Feedback**: `activeTab` is used when you open the popup or press the toggle shortcut to identify the current site and display a local style health status or confirmation toast. Page structure and styles are checked locally; conversation text is not collected. The background service worker only toggles the on/off preference and toolbar badge. Clicking "Report" opens GitHub with the extension version, selected theme and failed check names in the URL query; these diagnostic fields are sent to GitHub when the page opens. The link does not contain your Gemini URL, conversation ID, account index, browser user-agent string or chat content. Opening the page does not create an issue; you must submit the form yourself. GitHub handles the resulting website visit under its own privacy policy.
5. **Open Source Transparency**: All source code is publicly auditable under the MIT License at <https://github.com/Quiyyy/refined-gemini>.

If you have any questions, please open an issue at <https://github.com/Quiyyy/refined-gemini/issues>.

---

## 简体中文

**Refined Gemini** 严格保护您的隐私安全：

1. **零数据收集**：本扩展与脚本**不会**收集、上传、记录或共享任何个人身份信息、对话内容（Prompt 与模型回复）、浏览历史、Cookie 或遥测统计数据。
2. **本地美化、无后台遥测**：样式逻辑在浏览器本地运行，作用于 `https://gemini.google.com/*` 主页面及内嵌的 `https://*.scf.usercontent.goog/*` / `https://*.googleusercontent.com/*` 交互式图表沙盒，用于同步主题与字号。扩展不发送后台分析统计，也不向开发者服务器发送请求。浏览器设置同步见下文；用户主动打开反馈链接时会访问 GitHub，具体见第 4 条。
3. **界面配置保存与浏览器同步**：`storage` 权限（`chrome.storage.sync`）用于保存外观主题、列宽、字号、缩进比例与界面语言等偏好。如果您在 Microsoft Edge 中启用了扩展同步，浏览器可能通过您的浏览器账号同步这些设置。页面 `localStorage` 仅用于本地缓存界面配置。这些设置不包含对话内容或模型回复，开发者不会收到这些设置，也不运营同步服务器。
4. **权限与主动反馈**：`activeTab` 在您打开设置面板或按下快捷键时用于识别当前网站，并显示本地样式检查结果或切换提示。页面结构与样式仅在本地检查，不收集对话文本。后台 Service Worker 只负责切换开关偏好与工具栏角标。点击“反馈”时，扩展版本、所选主题及检查失败项名称会作为 URL 查询参数随页面访问发送给 GitHub；链接不包含 Gemini 网址、会话 ID、账号序号、浏览器 User-Agent 或对话内容。打开页面不会创建 Issue，仍需您自行提交表单。此次网站访问由 GitHub 按其隐私政策处理。
5. **开源可审计**：全部源代码基于 MIT 协议公开托管于 <https://github.com/Quiyyy/refined-gemini>，欢迎随时审查。

如有任何疑问，欢迎通过 <https://github.com/Quiyyy/refined-gemini/issues> 提交反馈。
