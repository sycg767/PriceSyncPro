# 🚀 PriceSyncPro

**New API 智能价格同步工具** - 一键同步上游模型定价，支持从 New API 或 One Hub 获取上游价格

[![GitHub](https://img.shields.io/badge/GitHub-sycg767%2FPriceSyncPro-blue?logo=github)](https://github.com/sycg767/PriceSyncPro)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.2.1-orange.svg)](https://github.com/sycg767/PriceSyncPro/releases)

---

## 💡 这个工具解决什么问题？

当你在 **New API** 中给模型添加自定义前缀（例如 `KYX/claude-3.5-sonnet`），系统自带的"同步上游倍率"功能会失效。

**PriceSyncPro 提供完美解决方案！**

### 🎯 支持的上游数据源

工具可以从以下系统获取上游定价，然后同步到你的 **New API** 后台：

- ✅ **New API** - 标准 `/api/pricing` 端点
- ✅ **One Hub** - 支持两种 API 格式
  - 官方 API：`/api/available_model`
  - 实例 API：`/panel/model_price`

---

## 🔌 浏览器插件版本（推荐）

### ✨ 为什么选择插件版本？

- **⚡ 一键自动同步**：无需手动执行 SQL，点击按钮即可完成
- **🔒 更安全**：使用浏览器 Cookie 认证，无需 API Token
- **🎯 更便捷**：直接在 New API 后台使用，无需切换工具
- **💾 配置预设**：保存常用配置，下次一键加载
- **📊 实时反馈**：5 阶段进度条，清晰展示同步状态
- **🔄 模型列表同步**：自动获取上游最新模型列表并更新到渠道

### 🚀 快速开始

#### 第一步：安装插件

1. 下载项目到本地
2. 打开浏览器扩展管理页面：
   - **Chrome**：`chrome://extensions/`
   - **Edge**：`edge://extensions/`
3. 启用"**开发者模式**"（右上角开关）
4. 点击"**加载已解压的扩展程序**"
5. 选择 `PriceSyncPro-Extension` 文件夹

#### 第二步：登录 New API 后台

打开你的 New API 后台并登录（插件会自动检测登录状态）

#### 第三步：使用插件

1. 点击浏览器工具栏的 **PriceSyncPro** 图标
2. 输入**上游定价 URL**（从哪里获取价格）：
   - 从 New API 获取：`https://upstream-api.com/api/pricing`
   - 从 One Hub 获取：`https://onehub.com/api/available_model`
3. 输入**模型前缀**（可选，例如：`KYX/`）
4. 点击 **"⚡ 快速更新（分析+同步）"** 按钮
5. 等待完成，价格将同步到你的 New API 后台

#### 额外功能：同步模型列表

如果上游渠道有新模型上架或下架：

1. 点击 **"🔄 同步上游模型列表"** 按钮
2. 输入渠道 ID（在渠道管理页面查看）
3. 确认同步，自动更新模型列表和 model_mapping

**就这么简单！** 🎉

### 📖 详细文档

查看完整的插件使用指南：[PriceSyncPro-Extension/README.md](./PriceSyncPro-Extension/README.md)

---

## 🌐 Web 版本（备选方案）

如果你有数据库访问权限，也可以使用 Web 版本手动执行 SQL。

### 适用场景

- ✅ 有数据库访问权限
- ✅ 偶尔更新价格
- ✅ 需要生成 SQL 脚本

### 快速开始

1. **启动本地服务器**：
   ```bash
   cd PriceSyncPro-WebVersion
   双击 start_server.bat
   # 或
   python -m http.server 8000
   ```

2. **访问页面**：
   ```
   http://localhost:8000/index.html
   ```

3. **分析价格 → 生成 SQL → 执行 SQL**

详细说明请查看：[PriceSyncPro-WebVersion/README.md](./PriceSyncPro-WebVersion/README.md)

---

## 🆚 两个版本如何选择？

| 特性 | 🔌 插件版本（推荐） | 🌐 Web 版本 |
|------|-------------------|------------|
| **适用人群** | 只有后台登录权限 | 有数据库访问权限 |
| **使用难度** | ⭐ 一键完成 | ⭐⭐⭐ 需要执行 SQL |
| **更新方式** | 自动 API 调用 | 手动执行 SQL |
| **需要登录** | 需要 | 不需要 |
| **需要数据库** | 不需要 | 需要 |
| **推荐场景** | 频繁更新价格 | 偶尔更新价格 |
| **配置预设** | ✅ 支持 | ❌ 不支持 |
| **进度反馈** | ✅ 实时显示 | ❌ 无 |

**简单判断：**
- 👉 **推荐插件版本**：更简单、更快捷、更安全
- 👉 有数据库权限 → Web 版本也可以

---

## 🔧 核心功能

### 🧠 智能价格分析
- 自动推断上游系统的隐藏基础价（众数投票算法）
- 支持按次计费和按量计费两种模式
- 内置 120+ 主流模型官方价格数据库
- 智能识别多种前缀格式
- 自动同步上游模型列表到渠道配置

### 🌐 多上游数据源支持
- **New API 作为上游**：支持标准 `/api/pricing` 端点
- **One Hub 作为上游**：
  - 支持官方 API 格式（`/api/available_model`）
  - 支持实例 API 格式（`/panel/model_price`）
  - 自动检测和转换数据格式
  - 智能处理价格单位（$/1K → $/1M）

**注意**：工具始终同步到你的 **New API** 后台，上游可以是 New API 或 One Hub

###  精确计算
支持多种前缀格式：
- `KYX/claude-3.5-sonnet`
- `4o速率高/gpt-4o`
- `[VIP]claude-3.5-sonnet`
- `claude-3.5-sonnet`

### 🔧 智能配置合并
- 只更新当前前缀的模型
- 完全保留其他渠道配置
- 自动处理 JSON 特殊字符
- 支持配置预设管理

---

## 📁 项目结构

```
PriceSyncPro/
├── README.md                          # 本文档
├── CHANGELOG.md                       # 更新日志
├── PriceSyncPro-Extension/            # 🔌 浏览器插件（推荐）
│   ├── manifest.json                  # 插件配置
│   ├── popup.html                     # 插件界面
│   ├── popup.js                       # 插件逻辑
│   ├── content.js                     # 核心同步脚本（支持 One Hub）
│   ├── background.js                  # 后台服务
│   ├── official_prices.json           # 官方价格数据库
│   ├── README.md                      # 插件详细文档
│   ├── USAGE_GUIDE.md                 # 使用指南
│   └── icons/                         # 插件图标
└── PriceSyncPro-WebVersion/           # 🌐 Web 版本（备选）
    ├── index.html                     # Web 界面（支持 One Hub）
    ├── pricing-engine.js              # 定价引擎（支持 One Hub）
    ├── official_prices.json           # 官方价格数据库
    ├── start_server.bat               # 启动脚本
    └── README.md                      # Web 版本文档
```

---

## ❓ 常见问题

### Q1: 这个工具的工作流程是什么？

**答**：
1. **获取上游价格**：从 New API 或 One Hub 获取定价数据
2. **智能分析**：自动推断隐藏基础价，计算倍率
3. **同步到后台**：将计算结果同步到你的 New API 后台

### Q2: 支持哪些上游数据源？

**答**：
- ✅ **New API**：使用 `/api/pricing` 端点
- ✅ **One Hub**：支持两种格式
  - 官方 API：`/api/available_model`（数组格式）
  - 实例 API：`/panel/model_price`（对象格式）

工具会自动检测和转换不同的数据格式。

### Q3: 插件为什么不需要 API Token？

**答**：插件运行在你的 New API 页面中，自动使用浏览器的登录 Cookie 进行认证，比 API Token 更安全。

### Q4: 如何验证价格是否正确？

**答**：
1. 查看工具显示的"置信度"（90%+ 说明准确）
2. 在后台"模型倍率设置"中对比几个常用模型
3. 手动计算：`官方价格 / model_ratio = 基础价`

### Q5: One Hub 的价格单位是什么？

**答**：One Hub 使用特殊的价格单位：
- 内部单位需要 ÷500 转换为美元
- 按量计费使用 $/1K（工具会自动转换为 $/1M）
- 按次计费直接使用转换后的价格

工具会自动处理所有转换，无需手动计算。

### Q6: 会覆盖其他渠道的配置吗？

**答**：不会。工具使用智能合并策略，只更新当前前缀的模型，完全保留其他渠道配置。

### Q7: 插件支持哪些浏览器？

**答**：支持所有基于 Chromium 的浏览器（Chrome、Edge、Brave、Opera 等）。

### Q8: Web 版本为什么需要本地服务器？

**答**：浏览器的 CORS 安全策略禁止 `file://` 协议的页面访问远程 API。使用本地服务器（`http://localhost`）可以绕过这个限制。

---

## 🎯 使用建议

### 新手用户
👉 **直接使用插件版本**，最简单快捷

### 高级用户
- 频繁更新 → 插件版本
- 偶尔更新 + 有数据库权限 → Web 版本
- 需要自定义 SQL → Web 版本

---

## 📊 性能数据

- **分析速度**：100 个模型 < 2 秒
- **同步速度**：100 个模型 < 5 秒
- **准确率**：置信度 90%+ 时准确率 > 99%
- **资源消耗**：< 10MB 内存

---

## 🛠️ 技术栈

### 插件版本
- **Manifest V3**：最新的 Chrome 扩展标准
- **Vanilla JavaScript**：无框架依赖，轻量高效
- **Chrome APIs**：Storage、Tabs、Scripting、Cookies

### Web 版本
- **纯前端**：HTML + CSS + JavaScript
- **无依赖**：不需要 Node.js 或其他工具
- **跨平台**：支持 Windows、macOS、Linux

---

## 📄 开源协议

MIT License - 可自由使用、修改、分发

---

## 🙏 致谢

感谢所有使用和反馈的用户！

如果这个工具对你有帮助，欢迎：
- ⭐ 给项目点个 Star
- 🐛 提交 Bug 报告
- 💡 提出功能建议
- 🔀 贡献代码

---

## 📞 联系方式

- **GitHub**：[@sycg767](https://github.com/sycg767)
- **Issues**：[提交问题](https://github.com/sycg767/PriceSyncPro/issues)
- **Discussions**：[参与讨论](https://github.com/sycg767/PriceSyncPro/discussions)

---

**PriceSyncPro | 支持多种上游数据源 | 智能价格同步工具 | 让价格管理更简单** 🚀