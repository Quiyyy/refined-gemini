# Privacy Policy / 隐私权政策 — Refined Gemini

*Last Updated / 最后更新：2026-11-14*

---

## English

**Refined Gemini** respects your privacy completely:

1. **Zero Data Collection**: Refined Gemini does **not** collect, transmit, store, log, or share any personal information, chat prompts, model responses, browsing history, cookies, or analytics data.
2. **Zero External Network Requests**: The extension runs 100% locally inside your browser on `https://gemini.google.com/*` (and embedded Generative UI `SafeContentFrame` subframes on `https://*.scf.usercontent.goog/*` / `https://*.googleusercontent.com/*` solely to synchronize diagram themes and font sizes). It makes no network calls to any third-party or developer-operated servers.
3. **Preference Storage and Browser Sync**: The `storage` permission (`chrome.storage.sync`) saves UI preferences such as theme mode, column width, font size, indentation scale, and UI language. If extension synchronization is enabled in Microsoft Edge, the browser may synchronize these preferences through your browser account. Page `localStorage` caches UI preferences locally. Chat prompts and model responses are not saved in these settings. The developer does not receive the settings or operate a synchronization server.
4. **Permissions Used Locally Only**: `activeTab` is used only when you open the popup or press the toggle shortcut, to check whether the current tab is Gemini and to display a local style health status or confirmation toast. The background service worker only toggles the on/off preference and the toolbar badge. No page content is read, stored, or transmitted. "Report" links merely open a prefilled GitHub issue page in a new tab; nothing is sent unless you submit it yourself.
5. **Open Source Transparency**: All source code is publicly auditable under the MIT License at <https://github.com/Quiyyy/refined-gemini>.

If you have any questions, please open an issue at <https://github.com/Quiyyy/refined-gemini/issues>.

---

## 简体中文

**Refined Gemini** 严格保护您的隐私安全：

1. **零数据收集**：本扩展与脚本**不会**收集、上传、记录或共享任何个人身份信息、对话内容（Prompt 与模型回复）、浏览历史、Cookie 或遥测统计数据。
2. **零外部网络请求**：所有样式与交互逻辑均 100% 在您的浏览器本地运行（仅作用于 `https://gemini.google.com/*` 主页面及其内嵌的 `https://*.scf.usercontent.goog/*` / `https://*.googleusercontent.com/*` 交互式图表沙盒子帧，用于同步浅/深色主题与字号），不向任何第三方或开发者服务器发送任何请求。
3. **界面配置保存与浏览器同步**：`storage` 权限（`chrome.storage.sync`）用于保存外观主题、列宽、字号、缩进比例与界面语言等偏好。如果您在 Microsoft Edge 中启用了扩展同步，浏览器可能通过您的浏览器账号同步这些设置。页面 `localStorage` 仅用于本地缓存界面配置。这些设置不包含对话内容或模型回复，开发者不会收到这些设置，也不运营同步服务器。
4. **权限仅在本地使用**：`activeTab` 仅在您打开设置面板或按下快捷键时使用，用于判断当前标签页是否为 Gemini，并在本地显示样式健康状态或切换提示；后台 Service Worker 只负责切换开关偏好与工具栏角标。不会读取、保存或传输任何页面内容。“反馈”按钮仅在新标签页打开预填信息的 GitHub Issue 页面，除非您自行提交，否则不会发送任何内容。
5. **开源可审计**：全部源代码基于 MIT 协议公开托管于 <https://github.com/Quiyyy/refined-gemini>，欢迎随时审查。

如有任何疑问，欢迎通过 <https://github.com/Quiyyy/refined-gemini/issues> 提交反馈。
