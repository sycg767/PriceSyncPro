// {{CODE-Cycle-Integration:
//   Task_ID: #T001
//   Timestamp: 2025-11-03T12:18:45Z
//   Phase: D-Develop
//   Context-Analysis: "核心定价引擎 - 实现智能基础价反推和双模式计费计算"
//   Principle_Applied: "Aether-Engineering-SOLID-S, Aether-Engineering-DRY"
// }}
// {{START_MODIFICATIONS}}

class PricingEngine {
  constructor() {
    // 官方价格数据库 - 核心常用模型（包含完整 Claude 4 系列）
    // 价格单位：美元/1M tokens（输入价格）
    // 数据来源：LiteLLM 官方价格文件
    // 最后更新：2025-11-04（添加最新模型：GPT-5、GPT-4.1、O4-mini、Kimi-K2、Gemini Flash Lite等）
    this.officialPrices = {
      "chatgpt-4o-latest": 5.0,
      // GPT-4.1 系列（最新）
      "gpt-4.1": 2.0,
      "gpt-4.1-2025-04-14": 2.0,
      "gpt-4.1-mini": 0.4,
      "gpt-4.1-mini-2025-04-14": 0.4,
      "gpt-4.1-nano": 0.1,
      "gpt-4.1-nano-2025-04-14": 0.1,
      // O4 系列（最新）
      "o4-mini": 1.1,
      "o4-mini-2025-04-16": 1.1,
      "o4-mini-deep-research": 2.0,
      // Kimi-K2 系列（最新）
      "kimi-k2-instruct": 1.0,
      "kimi-k2-instruct-0905": 1.0,
      "kimi-k2-0711-preview": 0.6,
      "kimi-k2-0905": 1.0,
      // Gemini Flash Lite（最新）
      "gemini-flash-lite-latest": 0.025,
      "gemini-2.5-flash-preview-09-2025": 0.1,
      "gemini-2.5-flash-lite-preview-09-2025": 0.025,
      // Claude 3 系列
      "claude-3-5-haiku-20241022": 0.8,
      "claude-3-5-haiku-latest": 1.0,
      "claude-3-5-sonnet-20240620": 3.0,
      "claude-3-5-sonnet-20241022": 3.0,
      "claude-3-5-sonnet-latest": 3.0,
      "claude-3-7-sonnet-20250219": 3.0,
      "claude-3-7-sonnet-latest": 3.0,
      "claude-3-haiku": 0.25,
      "claude-3-haiku-20240307": 0.25,
      "claude-3-opus": 15.0,
      "claude-3-opus-20240229": 15.0,
      "claude-3-opus-latest": 15.0,
      "claude-3-sonnet": 3.0,
      "claude-3-sonnet-20240229": 3.0,
      "claude-3.5-sonnet": 3.0,
      // Claude 4 系列（最新）
      "claude-4-opus-20250514": 15.0,
      "claude-4-sonnet-20250514": 3.0,
      "claude-haiku-4-5": 1.0,
      "claude-haiku-4-5-20251001": 1.0,
      "claude-opus-4-1": 15.0,
      "claude-opus-4-1-20250805": 15.0,
      "claude-opus-4-20250514": 15.0,
      "claude-sonnet-4-5": 3.0,
      "claude-sonnet-4-5-20250929": 3.0,
      "claude-sonnet-4-20250514": 3.0,
      // GPT-5 系列（最新）
      "gpt-5": 1.25,
      "gpt-5-2025-08-07": 1.25,
      "gpt-5-chat": 1.25,
      "gpt-5-chat-latest": 1.25,
      "gpt-5-codex": 1.25,
      "gpt-5-mini": 0.025,
      "gpt-5-mini-2025-08-07": 0.025,
      "gpt-5-nano": 0.005,
      "gpt-5-nano-2025-08-07": 0.005,
      // Gemini 2.5 系列（最新）
      "gemini-2.5-pro": 1.25,
      "gemini-2.5-pro-exp-03-25": 3.125,
      "gemini-2.5-pro-preview-03-25": 3.125,
      "gemini-2.5-pro-preview-05-06": 3.125,
      "gemini-2.5-pro-preview-06-05": 3.125,
      "gemini-2.5-pro-preview-tts": 3.125,
      // Qwen3 系列（最新）
      "qwen3": 0.4,
      "qwen3-max": 1.6,
      "qwen3-coder": 0.12,
      "qwen3-coder-plus": 0.12,
      "qwen3-8b": 0.05,
      "qwen3-14b": 0.2,
      "qwen3-32b": 0.12,
      "qwen3-235b-a22b": 2.0,
      "qwen3-235b-a22b-instruct-2507": 2.0,
      "qwen3-235b-a22b-thinking-2507": 6.5,
      "qwen3-30b-a3b": 0.8,
      "qwen3-coder-480b-a35b-instruct": 2.0,
      "qwen3-next-80b-a3b-instruct": 0.15,
      "qwen3-next-80b-a3b-thinking": 0.15,
      // DeepSeek V3 系列（最新）
      "deepseek-v3": 0.38,
      "deepseek-v3.1": 0.6,
      "deepseek-v3.1-terminus": 0.6,
      "deepseek-v3.2-exp": 0.6,
      "deepseek-v3.1-thinking": 0.6,
      // GLM 4.5 系列（最新）
      "glm-4.5": 2.0,
      "glm-4.5-air": 0.2,
      "glm-4.6": 2.0,
      // 其他模型
      "codestral-2501": 0.2,
      "codestral-latest": 1.0,
      "command": 1.0,
      "command-r": 0.15,
      "command-r-08-2024": 0.15,
      "command-r-plus": 3.0,
      "command-r-plus-08-2024": 2.5,
      "deepseek-chat": 0.6,
      "deepseek-coder": 0.14,
      "deepseek-r1": 1.35,
      "deepseek-reasoner": 0.6,
      "gemini-1.5-flash": 0.075,
      "gemini-1.5-flash-002": 0.075,
      "gemini-1.5-flash-8b": 0.0375,
      "gemini-1.5-pro": 1.25,
      "gemini-1.5-pro-002": 1.25,
      "gemini-2.0-flash": 0.1,
      "gemini-2.0-flash-exp": 0.15,
      "gpt-3.5-turbo": 0.5,
      "gpt-3.5-turbo-0125": 0.5,
      "gpt-3.5-turbo-1106": 1.0,
      "gpt-3.5-turbo-16k": 3.0,
      "gpt-4": 30.0,
      "gpt-4-0613": 30.0,
      "gpt-4-32k": 60.0,
      "gpt-4-32k-0613": 60.0,
      "gpt-4-turbo": 10.0,
      "gpt-4-turbo-2024-04-09": 10.0,
      "gpt-4-turbo-preview": 10.0,
      "gpt-4-vision-preview": 10.0,
      "gpt-4o": 2.5,
      "gpt-4o-2024-05-13": 5.0,
      "gpt-4o-2024-08-06": 2.75,
      "gpt-4o-2024-11-20": 2.75,
      "gpt-4o-mini": 0.15,
      "gpt-4o-mini-2024-07-18": 0.165,
      "grok-2": 2.0,
      "grok-2-vision": 2.0,
      "grok-beta": 5.0,
      "grok-vision-beta": 5.0,
      "llama-3.1-405b-instruct": 3.0,
      "llama-3.1-70b-instruct": 1.0,
      "llama-3.1-8b-instruct": 0.2,
      "llama-3.2-11b-vision-instruct": 0.35,
      "llama-3.2-1b-instruct": 0.1,
      "llama-3.2-3b-instruct": 0.15,
      "llama-3.2-90b-vision-instruct": 2.0,
      "llama-3.3-70b-instruct": 0.71,
      "mistral-large-2407": 2.0,
      "mistral-large-2411": 2.0,
      "mistral-large-latest": 8.0,
      "mistral-medium-latest": 0.4,
      "mistral-nemo": 0.15,
      "mistral-small-latest": 0.1,
      "o1": 15.0,
      "o1-mini": 1.21,
      "o1-mini-2024-09-12": 1.21,
      "o1-preview": 15.0,
      "o1-preview-2024-09-12": 16.5,
      "o3-mini": 1.1,
      "o3-mini-2025-01-31": 1.21,
      "open-mistral-7b": 0.25,
      "open-mistral-nemo": 0.3,
      "open-mixtral-8x22b": 2.0,
      "open-mixtral-8x7b": 0.7,
      "pixtral-12b-2409": 0.15,
      "pixtral-large-latest": 2.0,
      "qwen-max": 1.6,
      "qwen-plus": 0.4,
      "qwen-turbo": 0.05,
      "qwen2.5-72b-instruct": 0.12,
      "qwen2.5-coder-32b-instruct": 0.12,
      "qwq-32b-preview": 0.15,
      "yi-large": 3.0,
      "yi-medium": 0.12
    };
    this.upstreamData = null;
    this.inferredBasePrice = null;
    this.results = [];
    this.apiUrl = ''; // 保存 API URL
  }
  
  /**
   * 转换 One Hub API 格式到标准格式
   * 支持两种格式：
   * 1. 数组格式: [{ model, type, channel_type, input, output }, ...]
   * 2. 对象格式: { data: { "model-name": { groups, owned_by, price: {...} }, ... } }
   * 标准格式: { model_name, quota_type, model_ratio, completion_ratio, model_price }
   */
  convertOneHubFormat(data) {
    // 格式 1: 数组格式（官方价格 API）
    if (Array.isArray(data) && data.length > 0 && data[0].model && data[0].type && data[0].input !== undefined) {
      console.log('🔄 检测到 One Hub 官方价格 API 格式（数组），开始转换...');
      
      const converted = data.map(item => {
        // One Hub 使用 "tokens" 表示按量计费
        const isTokenBased = item.type === 'tokens';
        
        // 转换为标准格式
        const standardItem = {
          model_name: item.model,
          quota_type: isTokenBased ? 0 : 1, // 0=按量, 1=按次
          model_ratio: item.input || 0,
          completion_ratio: item.output && item.input ? (item.output / item.input) : 1,
          model_price: isTokenBased ? 0 : item.input || 0
        };
        
        return standardItem;
      });
      
      console.log(`✅ One Hub 官方格式转换完成: ${converted.length} 个模型`);
      console.log('📊 转换示例:', converted.slice(0, 2));
      
      return converted;
    }
    
    // 格式 2: 对象格式（实例 available_model API）
    if (data && typeof data === 'object' && data.data && typeof data.data === 'object') {
      console.log('🔄 检测到 One Hub 实例 API 格式（对象），开始转换...');
      
      const converted = [];
      const modelsData = data.data;
      
      for (const [modelName, modelInfo] of Object.entries(modelsData)) {
        if (!modelInfo || !modelInfo.price) continue;
        
        const priceInfo = modelInfo.price;
        const modelType = priceInfo.model || modelName;
        const type = priceInfo.type || 'times';
        
        // 判断计费类型
        // One Hub 使用 "times" 表示按次计费，"tokens" 表示按量计费
        const isPerUse = type === 'times';
        
        // 提取价格（One Hub 的价格单位需要转换）
        // One Hub 存储的是内部单位，需要除以 500 转换为美元
        // 特殊处理：0 或负数表示免费
        const ONE_HUB_PRICE_DIVISOR = 500;
        const rawInput = priceInfo.input || 0;
        const rawOutput = priceInfo.output || 0;
        
        // 检查是否为免费模型（价格为 0 或负数）
        const isFree = rawInput <= 0 && rawOutput <= 0;
        
        let inputPrice = 0;
        let outputPrice = 0;
        
        if (!isFree) {
          inputPrice = rawInput / ONE_HUB_PRICE_DIVISOR;
          outputPrice = rawOutput / ONE_HUB_PRICE_DIVISOR;
          
          // 🔧 关键修复：按量计费需要从 $/1K 转换为 $/1M
          // One Hub 按量计费显示为 $/1K，New API 使用 $/1M
          // 因此需要乘以 1000
          if (!isPerUse) {
            inputPrice = inputPrice * 1000;
            outputPrice = outputPrice * 1000;
            console.log(`  🔧 ${modelType} (按量): 原始 ${rawInput}/${ONE_HUB_PRICE_DIVISOR} = $${rawInput / ONE_HUB_PRICE_DIVISOR}/1K → 转换为 $${inputPrice}/1M`);
          } else {
            console.log(`  🔧 ${modelType} (按次): 原始 input=${rawInput}, output=${rawOutput} → 转换后 $${inputPrice}, $${outputPrice}`);
          }
        } else {
          console.log(`  🆓 ${modelType} (免费): input=${rawInput}, output=${rawOutput} → Free`);
        }
        
        // 转换为标准格式
        const standardItem = {
          model_name: modelType,
          quota_type: isPerUse ? 1 : 0, // 0=按量, 1=按次
          // 对于按次计费：直接使用转换后的价格
          // 对于按量计费：价格就是 ratio（因为我们会设置 basePrice=1）
          model_ratio: inputPrice,
          completion_ratio: inputPrice > 0 ? (outputPrice / inputPrice) : 1,
          model_price: isPerUse ? inputPrice : 0,
          // 标记这是 One Hub 直接价格格式
          _isOneHubDirectPrice: true
        };
        
        converted.push(standardItem);
      }
      
      console.log(`✅ One Hub 实例格式转换完成: ${converted.length} 个模型`);
      console.log('📊 转换示例:', converted.slice(0, 2));
      
      return converted;
    }
    
    // 不是 One Hub 格式，返回原数据
    return data;
  }
  
  // 检测是否为特殊价格格式的网站
  // 参数：apiUrl - 上游API的URL
  isDirectPriceWebsite(apiUrl = '') {
    const hostname = window.location.hostname;
    const href = window.location.href;
    
    // 检测 api.dev88.tech 或任何包含 dev88 的域名/URL
    const isDev88 = hostname.includes('dev88') ||
                   href.includes('dev88') ||
                   apiUrl.includes('dev88');
    
    console.log('🔍 网站检测:');
    console.log('   - window.location.hostname:', hostname);
    console.log('   - window.location.href:', href);
    console.log('   - API URL:', apiUrl);
    console.log('   - 检测结果:', isDev88 ? '✅ 特殊价格网站' : '❌ 标准网站');
    
    return isDev88;
  }

  async loadOfficialPrices() {
    return Promise.resolve(true);
  }

  async fetchUpstreamData(upstreamUrl) {
    // 保存 API URL
    this.apiUrl = upstreamUrl;
    
    try {
      // 步骤 1: 尝试直接 GET 请求（可能是 JSON API）
      console.log('🔍 尝试方法 1: 直接 GET 请求...');
      console.log('   目标 URL:', upstreamUrl);
      
      let response;
      let usedProxy = false;
      
      // 创建超时 Promise（30秒）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时（30秒）')), 30000);
      });
      
      try {
        const fetchPromise = fetch(upstreamUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/html',
            'Content-Type': 'application/json'
          }
        });
        
        response = await Promise.race([fetchPromise, timeoutPromise]);
        console.log('✓ GET 请求成功，状态码:', response.status);
      } catch (corsError) {
        // CORS 错误，尝试使用代理
        console.warn('⚠️  直接请求失败:', corsError.message);
        console.log('   尝试使用代理...');
        const corsProxies = [
          'https://api.allorigins.win/raw?url=',
          'https://corsproxy.io/?'
        ];
        
        let proxySuccess = false;
        for (const proxy of corsProxies) {
          try {
            console.log(`   尝试代理: ${proxy}`);
            response = await fetch(proxy + encodeURIComponent(upstreamUrl), {
              method: 'GET',
              headers: {
                'Accept': 'application/json, text/html',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            
            if (response.ok) {
              usedProxy = true;
              proxySuccess = true;
              console.log(`✓ 代理成功: ${proxy}`);
              break;
            }
          } catch (e) {
            console.log(`   代理失败: ${proxy}`);
            continue;
          }
        }
        
        if (!proxySuccess) {
          throw new Error('CORS 错误：无法直接访问该 URL，且所有代理都失败。\n\n解决方案：\n1. 使用本地服务器运行此工具（推荐）\n2. 安装浏览器 CORS 扩展\n3. 联系上游网站管理员添加 CORS 支持');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const textContent = await response.text();
      console.log('✓ 响应内容长度:', textContent.length, '字节');
      console.log('   前 100 字符:', textContent.substring(0, 100));
      
      // 检查是否返回了 JSON
      if (textContent.trim().startsWith('{') || textContent.trim().startsWith('[')) {
        console.log('✓ 检测到 JSON 响应，开始解析...');
        let data = JSON.parse(textContent);
        
        // 先检查数据格式
        if (data.data && Array.isArray(data.data)) {
          this.upstreamData = data.data;
        } else if (Array.isArray(data)) {
          this.upstreamData = data;
        } else {
          // 🆕 在抛出错误之前，尝试 One Hub 对象格式转换
          const converted = this.convertOneHubFormat(data);
          if (Array.isArray(converted)) {
            this.upstreamData = converted;
            console.log('✓ One Hub 格式转换成功，模型数量:', this.upstreamData.length);
          } else {
            throw new Error('无法识别的 JSON 数据格式');
          }
        }
        
        // 🆕 如果已经是数组，检查是否为 One Hub 数组格式
        if (this.upstreamData) {
          const converted = this.convertOneHubFormat(this.upstreamData);
          if (converted !== this.upstreamData) {
            // 转换成功，使用转换后的数据
            this.upstreamData = converted;
            console.log('✓ One Hub 数组格式转换成功');
          }
        }
        
        console.log(`✅ 成功加载 ${this.upstreamData.length} 个模型配置`);
        return this.upstreamData;
      }
      
      // 检查是否返回了 HTML
      if (textContent.trim().toLowerCase().startsWith('<!doctype') ||
          textContent.trim().toLowerCase().startsWith('<html')) {
        console.log('✓ 检测到 HTML 页面');
        
        // 🔧 特殊处理：如果是 dev88.tech 的 HTML 页面，说明需要特殊解析
        if (this.isDirectPriceWebsite(upstreamUrl)) {
          console.log('🌐 检测到 dev88.tech 特殊网站，尝试特殊解析...');
          const specialData = this.parseDev88Page(textContent);
          if (specialData) {
            this.upstreamData = specialData;
            console.log(`✅ 通过特殊解析成功加载 ${this.upstreamData.length} 个模型配置`);
            return this.upstreamData;
          }
        }
        
        // 步骤 2: 尝试从 HTML 中查找 API 端点
        const apiEndpoint = this.extractApiEndpoint(textContent, upstreamUrl);
        
        if (apiEndpoint) {
          console.log(`🔍 尝试方法 2: 检测到 API 端点 ${apiEndpoint}，发送 POST 请求...`);
          
          // 尝试 POST 请求到 API 端点
          try {
            response = await fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': new URL(upstreamUrl).origin,
                'Referer': upstreamUrl
              },
              body: JSON.stringify({})  // 空的 POST body
            });
            
            if (response.ok) {
              const apiData = await response.json();
              
              if (apiData.data && Array.isArray(apiData.data)) {
                this.upstreamData = apiData.data;
              } else if (Array.isArray(apiData)) {
                this.upstreamData = apiData;
              } else {
                throw new Error('API 返回的数据格式无法识别');
              }
              
              console.log(`✅ 通过 API 端点成功加载 ${this.upstreamData.length} 个模型配置`);
              return this.upstreamData;
            }
          } catch (apiError) {
            console.warn('⚠️  API 端点请求失败:', apiError.message);
          }
        }
        
        // 步骤 3: 降级到 HTML 解析
        console.log('🔍 尝试方法 3: HTML 智能解析...');
        return await this.parseHTMLPage(textContent);
      }

      console.log('✗ 无法识别的响应格式');
      console.log('   响应类型:', typeof textContent);
      console.log('   响应开头:', textContent.substring(0, 200));
      throw new Error('无法识别的响应格式：既不是 JSON 也不是 HTML');
      
    } catch (error) {
      console.error('获取上游数据失败:', error);
      throw new Error(`获取上游数据失败: ${error.message}`);
    }
  }

  extractApiEndpoint(htmlContent, baseUrl) {
    // 常见的 API 端点模式
    const patterns = [
      /['"]([^'"]*\/api\/fetch-pricing[^'"]*)['"]/i,
      /['"]([^'"]*\/api\/pricing[^'"]*)['"]/i,
      /['"]([^'"]*\/api\/models[^'"]*)['"]/i,
      /fetch\s*\(\s*['"]([^'"]*\/api\/[^'"]+)['"]/i,
      /axios\.\w+\s*\(\s*['"]([^'"]*\/api\/[^'"]+)['"]/i
    ];
    
    for (const pattern of patterns) {
      const match = htmlContent.match(pattern);
      if (match) {
        let endpoint = match[1];
        
        // 如果是相对路径，转换为绝对路径
        if (endpoint.startsWith('/')) {
          const urlObj = new URL(baseUrl);
          endpoint = `${urlObj.protocol}//${urlObj.host}${endpoint}`;
        } else if (!endpoint.startsWith('http')) {
          const urlObj = new URL(baseUrl);
          endpoint = `${urlObj.protocol}//${urlObj.host}/${endpoint}`;
        }
        
        console.log(`✓ 在 HTML 中发现 API 端点: ${endpoint}`);
        return endpoint;
      }
    }
    
    return null;
  }

  async parseHTMLPage(htmlContent) {
    try {
      // 创建一个临时 DOM 解析器
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // 尝试多种解析策略
      let extractedData = null;
      
      // 策略 1: 查找嵌入的 JSON 数据（常见于前端框架）
      extractedData = this.extractJSONFromScript(doc);
      
      if (!extractedData) {
        // 策略 2: 解析卡片式布局（Semi Design, Ant Design 等）
        extractedData = this.extractDataFromCards(doc);
      }
      
      if (!extractedData) {
        // 策略 3: 解析 HTML 表格
        extractedData = this.extractDataFromTable(doc);
      }
      
      if (!extractedData || extractedData.length === 0) {
        // 提供更详细的错误信息和解决建议
        const suggestions = this.generateParsingSuggestions(htmlContent);
        throw new Error(`HTML 页面解析失败：未能找到模型定价数据。\n\n${suggestions}`);
      }
      
      this.upstreamData = extractedData;
      console.log(`✅ 从 HTML 成功解析 ${this.upstreamData.length} 个模型配置`);
      return this.upstreamData;
      
    } catch (error) {
      throw new Error(`HTML 解析失败: ${error.message}`);
    }
  }

  extractJSONFromScript(doc) {
    // 查找所有 script 标签
    const scripts = doc.querySelectorAll('script');
    
    for (const script of scripts) {
      const content = script.textContent || script.innerHTML;
      
      // 尝试查找常见的数据模式
      const patterns = [
        /window\.__INITIAL_STATE__\s*=\s*({.+?});/s,
        /window\.DATA\s*=\s*({.+?});/s,
        /var\s+data\s*=\s*({.+?});/s,
        /const\s+data\s*=\s*({.+?});/s,
        /"data"\s*:\s*(\[.+?\])/s,
        /models\s*:\s*(\[.+?\])/s
      ];
      
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          try {
            const jsonData = JSON.parse(match[1]);
            
            // 检查是否是我们需要的数据格式
            if (jsonData.data && Array.isArray(jsonData.data)) {
              return jsonData.data;
            } else if (Array.isArray(jsonData)) {
              return jsonData;
            } else if (jsonData.models && Array.isArray(jsonData.models)) {
              return jsonData.models;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }
    
    return null;
  }

  extractDataFromCards(doc) {
    console.log('🔍 尝试解析卡片式布局...');
    
    // 扩展的选择器策略（12种）
    const cardSelectors = [
      '.semi-card',                    // Semi Design 标准
      'div.semi-card',                 // 显式指定 div
      '[class*="semi-card"]',          // 模糊匹配 Semi Design
      '[aria-busy]',                   // Semi Design 特有属性
      '.ant-card',                     // Ant Design
      '[class*="card"][class*="semi"]',// 同时包含 card 和 semi
      'div[class*="card"]',            // 任何包含 card 的 div
      '[class*="pricing"]',            // 定价相关类名
      '[class*="model"]',              // 模型相关类名
      '[class*="price"]',              // 价格相关类名
      'div[class*="item"]',            // 项目容器
      '[class*="list"] > div'          // 列表项
    ];
    
    let cards = [];
    let usedSelector = '';
    
    // 尝试每个选择器
    for (const selector of cardSelectors) {
      const foundCards = doc.querySelectorAll(selector);
      if (foundCards.length > 0) {
        // 验证找到的元素是否真的包含价格信息
        const validCards = Array.from(foundCards).filter(card => {
          const text = card.textContent || '';
          return text.includes('输入') || text.includes('输出') ||
                 text.includes('$') || text.includes('/M') ||
                 text.includes('Input') || text.includes('Output') ||
                 /\$?\d+\.?\d*/.test(text);
        });
        
        if (validCards.length > 0) {
          cards = validCards;
          usedSelector = selector;
          console.log(`✓ 找到 ${cards.length} 个有效卡片 (选择器: ${selector})`);
          break;
        }
      }
    }
    
    // 降级方案1：遍历所有 div，查找包含价格信息的容器
    if (cards.length === 0) {
      console.log('⚠️  预定义选择器未找到卡片，尝试降级方案1...');
      const allDivs = doc.querySelectorAll('div');
      console.log(`   页面共有 ${allDivs.length} 个 div 元素，开始筛选...`);
      
      const potentialCards = [];
      allDivs.forEach(div => {
        const text = div.textContent || '';
        // 更宽松的条件：包含价格相关信息
        if ((text.includes('输入') || text.includes('输出') || text.includes('Input') || text.includes('Output')) &&
            (text.includes('$') || text.includes('/M') || /\$?\d+\.?\d*/.test(text))) {
          potentialCards.push(div);
        }
      });
      
      if (potentialCards.length > 0) {
        cards = potentialCards;
        usedSelector = 'fallback-div-filter';
        console.log(`✓ 降级方案1找到 ${cards.length} 个潜在卡片`);
      }
    }
    
    // 降级方案2：查找包含价格信息的任何元素
    if (cards.length === 0) {
      console.log('⚠️  降级方案1失败，尝试降级方案2...');
      const allElements = doc.querySelectorAll('*');
      const priceElements = [];
      
      allElements.forEach(el => {
        const text = el.textContent || '';
        if (text.length < 500 && // 避免选择太大的容器
            (text.includes('$') || /\$?\d+\.?\d*/.test(text)) &&
            (text.includes('输入') || text.includes('输出') || text.includes('Input') || text.includes('Output'))) {
          priceElements.push(el);
        }
      });
      
      if (priceElements.length > 0) {
        cards = priceElements;
        usedSelector = 'fallback-element-filter';
        console.log(`✓ 降级方案2找到 ${cards.length} 个价格元素`);
      } else {
        console.log('✗ 未找到任何包含价格信息的元素');
        return null;
      }
    }
    
    const extractedData = [];
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      try {
        // 提取模型名称 - 增强的多层策略
        let modelName = '';
        const titleSelectors = [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',           // 所有标题标签
          '.title', '[class*="title"]',                 // 标题类
          '[class*="name"]', '[class*="model"]',       // 名称和模型类
          '.text-lg', '.text-xl', '.text-2xl',          // 文字大小类
          'strong', 'b',                               // 粗体文字
          '[class*="heading"]', '[class*="header"]'    // 标题相关类
        ];
        
        // 首先尝试在卡片内部查找
        for (const selector of titleSelectors) {
          const titleEl = card.querySelector(selector);
          if (titleEl) {
            const text = titleEl.textContent.trim();
            // 更宽松的过滤条件
            if (text && text.length < 100 &&
                !text.includes('价格') && !text.includes('Price') &&
                !text.includes('模型列表') && !text.includes('供应商') &&
                !text.includes('总计') && !text.includes('Total')) {
              modelName = text;
              break;
            }
          }
        }
        
        // 如果卡片内没找到，尝试在相邻元素中查找
        if (!modelName) {
          const prevSibling = card.previousElementSibling;
          const nextSibling = card.nextElementSibling;
          const siblings = [prevSibling, nextSibling].filter(Boolean);
          
          for (const sibling of siblings) {
            for (const selector of titleSelectors) {
              const titleEl = sibling.querySelector(selector);
              if (titleEl) {
                const text = titleEl.textContent.trim();
                if (text && text.length < 100 && !text.includes('价格')) {
                  modelName = text;
                  break;
                }
              }
            }
            if (modelName) break;
          }
        }
        
        // 最后尝试：从卡片的文本内容中提取第一行作为模型名
        if (!modelName) {
          const cardText = card.textContent.trim();
          const lines = cardText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          if (lines.length > 0) {
            const firstLine = lines[0];
            if (firstLine.length < 50 && !firstLine.includes('$') && !firstLine.includes('/M')) {
              modelName = firstLine;
            }
          }
        }
        
        // 如果还是没找到，生成一个默认名称
        if (!modelName) {
          modelName = `Model-${successCount + 1}`;
        }
        
        // 提取价格信息 - 大幅增强的正则匹配
        const fullText = card.textContent || '';
        
        let inputPrice = 0;
        let outputPrice = 0;
        
        // 匹配多种价格格式（中英文）
        const pricePatterns = [
          // 输入价格模式
          /输入\s*[:：]?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
          /input\s*[:：]?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
          /输入价格\s*[:：]?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
          /input\s+price\s*[:：]?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
          // 输出价格模式
          /输出\s*[:：]?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
          /output\s*[:：]?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
          /输出价格\s*[:：]?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
          /output\s+price\s*[:：]?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
          // 通用价格模式（带标签）
          /\$(\d+\.?\d*)\s*[/\/]\s*1M\s*(?:输入|input)/i,
          /\$(\d+\.?\d*)\s*[/\/]\s*1M\s*(?:输出|output)/i,
          // 简单价格模式
          /\$(\d+\.?\d*)/g
        ];
        
        // 查找所有价格
        const allPrices = [];
        const priceMatches = fullText.match(/\$(\d+\.?\d*)/g);
        if (priceMatches) {
          priceMatches.forEach(match => {
            const price = parseFloat(match.replace('$', ''));
            if (price > 0) allPrices.push(price);
          });
        }
        
        // 尝试匹配输入价格
        for (let i = 0; i < 4; i++) {
          const match = fullText.match(pricePatterns[i]);
          if (match) {
            inputPrice = parseFloat(match[1]);
            break;
          }
        }
        
        // 尝试匹配输出价格
        for (let i = 4; i < 8; i++) {
          const match = fullText.match(pricePatterns[i]);
          if (match) {
            outputPrice = parseFloat(match[1]);
            break;
          }
        }
        
        // 如果没有明确匹配，使用价格数组推断
        if (inputPrice === 0 && outputPrice === 0 && allPrices.length > 0) {
          if (allPrices.length >= 2) {
            inputPrice = allPrices[0];
            outputPrice = allPrices[1];
          } else if (allPrices.length === 1) {
            inputPrice = allPrices[0];
            outputPrice = allPrices[0]; // 假设输入输出价格相同
          }
        }
        
        // 提取计费类型
        let quotaType = 0;
        const tags = Array.from(card.querySelectorAll('.semi-tag, .ant-tag, [class*="tag"]'))
          .map(el => el.textContent.trim().toLowerCase());
        
        if (tags.some(tag => tag.includes('按次') || tag.includes('per-request') || tag.includes('per-call'))) {
          quotaType = 1;
        }
        
        // 验证价格数据的有效性
        if (inputPrice > 0 || outputPrice > 0) {
          // 反推倍率
          const assumedBasePrice = 2.0;
          const modelRatio = inputPrice > 0 ? inputPrice / assumedBasePrice : 0;
          const completionRatio = (inputPrice > 0 && outputPrice > 0) ? outputPrice / inputPrice : 1.0;
          
          const item = {
            model_name: modelName,
            quota_type: quotaType,
            model_ratio: Math.round(modelRatio * 10000) / 10000,
            model_price: quotaType === 1 ? inputPrice : 0,
            completion_ratio: Math.round(completionRatio * 10000) / 10000,
            _extracted_input: inputPrice,
            _extracted_output: outputPrice
          };
          
          extractedData.push(item);
          successCount++;
          console.log(`✓ [${successCount}/${i+1}] ${modelName} | 输入=$${inputPrice} 输出=$${outputPrice}`);
        } else {
          skipCount++;
        }
        
      } catch (error) {
        console.warn(`⚠️  解析第 ${i+1} 个卡片时出错:`, error.message);
        skipCount++;
        continue;
      }
    }
    
    // 输出解析统计
    console.log(`\n📊 解析统计：`);
    console.log(`   - 选择器: ${usedSelector}`);
    console.log(`   - 总卡片数: ${cards.length}`);
    console.log(`   - 成功提取: ${successCount}`);
    console.log(`   - 跳过数量: ${skipCount}`);
    
    if (extractedData.length > 0) {
      console.log(`✅ 从卡片布局成功提取 ${extractedData.length} 个模型`);
      return extractedData;
    }
    
    console.log('✗ 未能从卡片中提取有效数据');
    return null;
  }

  extractDataFromTable(doc) {
    // 查找所有表格
    const tables = doc.querySelectorAll('table');
    
    for (const table of tables) {
      const headers = Array.from(table.querySelectorAll('thead th, thead td')).map(th =>
        th.textContent.trim().toLowerCase()
      );
      
      // 检查是否包含关键列
      const hasModelName = headers.some(h =>
        h.includes('model') || h.includes('模型') || h.includes('名称')
      );
      const hasRatio = headers.some(h =>
        h.includes('ratio') || h.includes('倍率') || h.includes('比率')
      );
      
      if (!hasModelName) continue;
      
      // 确定列索引
      const colIndexes = {
        modelName: this.findColumnIndex(headers, ['model', '模型', 'name', '名称']),
        quotaType: this.findColumnIndex(headers, ['quota', '计费', 'type', '类型']),
        modelRatio: this.findColumnIndex(headers, ['model_ratio', 'modelratio', '模型倍率', 'ratio']),
        completionRatio: this.findColumnIndex(headers, ['completion', '输出倍率', 'output']),
        modelPrice: this.findColumnIndex(headers, ['price', '价格', 'model_price'])
      };
      
      if (colIndexes.modelName === -1) continue;
      
      // 提取数据行
      const rows = table.querySelectorAll('tbody tr');
      const extractedData = [];
      
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length === 0) continue;
        
        const modelName = cells[colIndexes.modelName]?.textContent.trim();
        if (!modelName) continue;
        
        const item = {
          model_name: modelName,
          quota_type: this.parseQuotaType(cells[colIndexes.quotaType]?.textContent),
          model_ratio: this.parseFloat(cells[colIndexes.modelRatio]?.textContent),
          completion_ratio: this.parseFloat(cells[colIndexes.completionRatio]?.textContent),
          model_price: this.parseFloat(cells[colIndexes.modelPrice]?.textContent)
        };
        
        extractedData.push(item);
      }
      
      if (extractedData.length > 0) {
        return extractedData;
      }
    }
    
    return null;
  }

  // 🔧 特殊解析：处理 dev88.tech 类型的网站
  parseDev88Page(htmlContent) {
    try {
      console.log('🔍 开始解析 dev88.tech 特殊页面...');
      
      // 创建临时 DOM 解析器
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // 查找所有包含价格信息的元素
      const priceElements = doc.querySelectorAll('[class*="price"], [class*="cost"], [data-price]');
      
      if (priceElements.length === 0) {
        console.log('⚠️ 未找到价格元素，尝试通用解析...');
        return null;
      }
      
      const extractedData = [];
      
      // 遍历价格元素，提取模型信息
      priceElements.forEach((element, index) => {
        try {
          const text = element.textContent || '';
          
          // 查找模型名称（通常在价格元素附近）
          let modelName = '';
          const parentElement = element.parentElement;
          if (parentElement) {
            // 尝试从父元素或兄弟元素中获取模型名
            const possibleNameElements = parentElement.querySelectorAll('h1, h2, h3, h4, [class*="name"], [class*="model"]');
            for (const nameEl of possibleNameElements) {
              const name = nameEl.textContent.trim();
              if (name && name.length < 100 && !name.includes('价格') && !name.includes('Price')) {
                modelName = name;
                break;
              }
            }
          }
          
          // 如果没找到模型名，使用索引
          if (!modelName) {
            modelName = `Model-${index + 1}`;
          }
          
          // 提取价格信息
          const priceMatch = text.match(/\$?(\d+\.?\d*)/);
          if (priceMatch) {
            const price = parseFloat(priceMatch[1]);
            
            // 判断计费类型（基于价格大小）
            const quotaType = price > 1 ? 0 : 1; // 价格大于1美元通常是按量计费
            
            const item = {
              model_name: modelName,
              quota_type: quotaType,
              model_ratio: quotaType === 0 ? price / 2 : 0, // 假设基础价为2美元
              completion_ratio: 1.0,
              model_price: quotaType === 1 ? price : 0
            };
            
            extractedData.push(item);
            console.log(`✓ 提取: ${modelName} | 价格: $${price} | 类型: ${quotaType === 1 ? '按次' : '按量'}`);
          }
        } catch (error) {
          console.warn(`⚠️ 解析价格元素 ${index + 1} 时出错:`, error.message);
        }
      });
      
      if (extractedData.length > 0) {
        console.log(`✅ 成功解析 ${extractedData.length} 个模型配置`);
        return extractedData;
      }
      
      console.log('✗ 未能从特殊页面中提取有效数据');
      return null;
      
    } catch (error) {
      console.error('dev88.tech 页面解析失败:', error);
      return null;
    }
  }

  findColumnIndex(headers, keywords) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      for (const keyword of keywords) {
        if (header.includes(keyword)) {
          return i;
        }
      }
    }
    return -1;
  }

  parseQuotaType(text) {
    if (!text) return 0;
    const lower = text.toLowerCase().trim();
    if (lower.includes('按次') || lower.includes('per') || lower === '1') {
      return 1;
    }
    return 0;
  }

  parseFloat(text) {
    if (!text) return 0;
    const cleaned = text.replace(/[^0-9.-]/g, '');
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
  }

  loadSampleData() {
    this.upstreamData = [
      {
        "id": 1,
        "model_name": "SLA/claude-3.5-sonnet-20241022",
        "quota_type": 0,
        "model_ratio": 1.5,
        "completion_ratio": 5.0,
        "model_price": 0
      },
      {
        "id": 2,
        "model_name": "SLA/gpt-4o",
        "quota_type": 0,
        "model_ratio": 2.5,
        "completion_ratio": 3.333,
        "model_price": 0
      },
      {
        "id": 3,
        "model_name": "SLA/gpt-4o-mini",
        "quota_type": 0,
        "model_ratio": 0.075,
        "completion_ratio": 2.0,
        "model_price": 0
      },
      {
        "id": 4,
        "model_name": "B4U/deepseek-chat",
        "quota_type": 0,
        "model_ratio": 0.07,
        "completion_ratio": 1.0,
        "model_price": 0
      },
      {
        "id": 5,
        "model_name": "API/dall-e-3",
        "quota_type": 1,
        "model_ratio": 0,
        "completion_ratio": 0,
        "model_price": 0.08
      }
    ];
    return this.upstreamData;
  }

  inferBasePrice() {
    if (!this.upstreamData || !this.officialPrices) {
      throw new Error('缺少必要数据');
    }
    
    // 🔧 One Hub 直接价格模式检测
    const hasOneHubDirectPrice = this.upstreamData.some(m => m._isOneHubDirectPrice);
    if (hasOneHubDirectPrice) {
      console.log('🌐 检测到 One Hub 直接价格格式：model_ratio 直接代表价格（已转换为美元）');
      this.inferredBasePrice = 1;
      return {
        basePrice: 1,
        confidence: 100,
        matchedModels: this.upstreamData.length,
        totalModels: this.upstreamData.length,
        distribution: {},
        note: 'One Hub 直接价格模式',
        isOneHubDirectPrice: true
      };
    }
    
    // 🔧 特殊网站：直接价格模式
    if (this.isDirectPriceWebsite(this.apiUrl)) {
      console.log('🌐 检测到特殊网站（直接价格模式）：model_ratio 直接代表价格');
      this.inferredBasePrice = 1;
      return {
        basePrice: 1,
        confidence: 100,
        matchedModels: this.upstreamData.length,
        totalModels: this.upstreamData.length,
        distribution: {},
        note: '特殊网站：直接价格模式'
      };
    }

    const possibleBasePrices = [];
    let matchCount = 0;
    
    // 统计按量计费模型数量
    const usageBasedModels = this.upstreamData.filter(m => m.quota_type === 0);
    console.log(`📊 模型统计: 总共 ${this.upstreamData.length} 个模型，其中按量计费 ${usageBasedModels.length} 个`);
    
    // ✅ 如果所有模型都是按次计费，则不需要推断基础价
    if (usageBasedModels.length === 0) {
      console.log('ℹ️ 所有模型均为按次计费，无需推断基础价');
      this.inferredBasePrice = 0;
      return {
        basePrice: 0,
        confidence: 100,
        matchedModels: 0,
        totalModels: this.upstreamData.length,
        distribution: {},
        note: '所有模型均为按次计费'
      };
    }

    for (const model of this.upstreamData) {
      if (model.quota_type !== 0) continue;
      if (!model.model_ratio || model.model_ratio === 0) continue;

      const modelName = this.extractOriginalModelName(model.model_name);
      
      if (this.officialPrices[modelName]) {
        const officialPrice = this.officialPrices[modelName];
        const calculatedBasePrice = officialPrice / model.model_ratio;
        const roundedBasePrice = Math.round(calculatedBasePrice * 100) / 100;
        possibleBasePrices.push(roundedBasePrice);
        matchCount++;
        console.log(`✓ 匹配: ${model.model_name} → ${modelName} | 官方$${officialPrice} / ${model.model_ratio} = $${roundedBasePrice}`);
      } else {
        console.log(`⚠️ 未匹配: ${model.model_name} → ${modelName}`);
      }
    }

    if (possibleBasePrices.length === 0) {
      throw new Error(`无法推断基础价：${usageBasedModels.length} 个按量计费模型中，没有找到匹配的官方价格数据。\n\n建议：\n1. 检查模型名称是否正确\n2. 尝试使用"加载示例数据"测试工具\n3. 或使用手动设置基础价功能`);
    }

    const frequency = {};
    let maxFreq = 0;
    let mostCommonPrice = null;

    possibleBasePrices.forEach(price => {
      frequency[price] = (frequency[price] || 0) + 1;
      if (frequency[price] > maxFreq) {
        maxFreq = frequency[price];
        mostCommonPrice = price;
      }
    });

    this.inferredBasePrice = mostCommonPrice;

    return {
      basePrice: this.inferredBasePrice,
      confidence: (maxFreq / possibleBasePrices.length * 100).toFixed(1),
      matchedModels: matchCount,
      totalModels: this.upstreamData.length,
      distribution: frequency
    };
  }

  extractOriginalModelName(modelName) {
    // 这个函数用于从上游模型名中提取"核心模型名"，用于在官方价格库中查找
    // 规则：去除所有前缀，只保留最纯粹的模型名
    
    let coreName = modelName;
    
    // 如果包含斜杠，提取最后一段
    if (modelName.includes('/')) {
      const parts = modelName.split('/');
      coreName = parts[parts.length - 1];  // 总是取最后一段用于价格匹配
    }
    
    // 策略 1: 直接精确匹配
    if (this.officialPrices[coreName]) {
      return coreName;
    }
    
    // 策略 2: 尝试变体匹配（大小写、连字符等）
    const variants = this.generateNameVariants(coreName);
    
    for (const variant of variants) {
      if (this.officialPrices[variant]) {
        return variant;
      }
    }
    
    // 策略 3: 模糊匹配（去除版本号/日期后缀）
    // 例如: "claude-4-sonnet" 匹配 "claude-4-sonnet-20250514"
    const fuzzyMatch = this.findFuzzyMatch(coreName);
    if (fuzzyMatch) {
      console.log(`✓ 模糊匹配: "${coreName}" → "${fuzzyMatch}"`);
      return fuzzyMatch;
    }

    console.log(`⚠️  未匹配: "${coreName}"`);
    return coreName;
  }
  
  findFuzzyMatch(partialName) {
    // 增强的模糊匹配策略：支持最新模型和各种变体
    const allOfficialNames = Object.keys(this.officialPrices);
    const lowerPartialName = partialName.toLowerCase();
    
    // 【策略 1】精确匹配
    if (allOfficialNames.includes(partialName)) {
      return partialName;
    }
    if (allOfficialNames.includes(lowerPartialName)) {
      return lowerPartialName;
    }
    
    // 【策略 2】智能规则匹配 - 支持常见变体和别名
    const fuzzyRules = [
      // GPT-4.1 系列
      { patterns: ['gpt4.1', 'gpt-41'], target: 'gpt-4.1' },
      { patterns: ['gpt4.1-mini', 'gpt-41-mini'], target: 'gpt-4.1-mini' },
      { patterns: ['gpt4.1-nano', 'gpt-41-nano'], target: 'gpt-4.1-nano' },
      
      // O4 系列
      { patterns: ['o4mini', 'o4-mini'], target: 'o4-mini' },
      
      // Kimi-K2 系列
      { patterns: ['kimi-k2', 'kimik2', 'kimi-k2-instruct', 'kimi-k2-0905'], target: 'kimi-k2-instruct-0905' },
      
      // Gemini Flash Lite
      { patterns: ['gemini-flash-lite', 'gemini-flash-lite-latest'], target: 'gemini-flash-lite-latest' },
      { patterns: ['gemini-2.5-flash', 'gemini-25-flash'], target: 'gemini-2.5-flash-preview-09-2025' },
      { patterns: ['gemini-2.5-flash-lite', 'gemini-25-flash-lite'], target: 'gemini-2.5-flash-lite-preview-09-2025' },
      
      // Qwen3 系列 - 处理连字符和点号变体
      { patterns: ['qwen-3-32b', 'qwen3-32b'], target: 'qwen3-32b' },
      { patterns: ['qwen-3-8b', 'qwen3-8b'], target: 'qwen3-8b' },
      { patterns: ['qwen-3-14b', 'qwen3-14b'], target: 'qwen3-14b' },
      { patterns: ['qwen-3-max', 'qwen3max'], target: 'qwen3-max' },
      { patterns: ['qwen-3-coder', 'qwen3coder'], target: 'qwen3-coder' },
      
      // Claude 4 系列 - 处理版本号变体
      { patterns: ['claude-4.1-opus', 'claude-41-opus', 'claude4.1-opus'], target: 'claude-opus-4-1' },
      { patterns: ['claude-4.5-sonnet', 'claude-45-sonnet', 'claude4.5-sonnet'], target: 'claude-sonnet-4-5' },
      { patterns: ['claude-4.5-haiku', 'claude-45-haiku', 'claude4.5-haiku'], target: 'claude-haiku-4-5' },
      
      // GPT-5 系列变体
      { patterns: ['gpt5', 'gpt-5-latest'], target: 'gpt-5' },
      { patterns: ['gpt5-chat', 'gpt-5-chat'], target: 'gpt-5-chat' },
      { patterns: ['gpt5-mini', 'gpt-5-mini'], target: 'gpt-5-mini' },
      { patterns: ['gpt5-nano', 'gpt-5-nano'], target: 'gpt-5-nano' },
      
      // DeepSeek V3 系列
      { patterns: ['deepseek-v31', 'deepseekv3.1'], target: 'deepseek-v3.1' },
      { patterns: ['deepseek-v3.1-thinking', 'deepseek-v31-thinking'], target: 'deepseek-v3.1-thinking' },
      
      // GLM 系列
      { patterns: ['glm4.5', 'glm-45'], target: 'glm-4.5' },
      { patterns: ['glm4.6', 'glm-46'], target: 'glm-4.6' },
      
      // O3 系列
      { patterns: ['o3', 'o3-latest'], target: 'o3-mini' },
      { patterns: ['o3mini', 'o3-mini'], target: 'o3-mini' }
    ];
    
    for (const rule of fuzzyRules) {
      if (rule.patterns.includes(lowerPartialName)) {
        return rule.target;
      }
    }
    
    // 【策略 3】精确前缀匹配 (claude-4-sonnet → claude-4-sonnet-20250514)
    let matches = allOfficialNames.filter(name =>
      name.startsWith(partialName + '-') || name.startsWith(partialName + '_')
    );
    
    if (matches.length > 0) {
      matches.sort((a, b) => a.length - b.length);
      return matches[0];
    }
    
    // 【策略 4】去除日期后缀匹配
    const datePattern = /-\d{8}$/;
    matches = allOfficialNames.filter(name => {
      const nameWithoutDate = name.replace(datePattern, '');
      return nameWithoutDate === partialName || nameWithoutDate === lowerPartialName;
    });
    
    if (matches.length > 0) {
      matches.sort((a, b) => {
        const dateA = a.match(/\d{8}$/)?.[0] || '0';
        const dateB = b.match(/\d{8}$/)?.[0] || '0';
        return dateB.localeCompare(dateA);
      });
      return matches[0];
    }
    
    // 【策略 5】处理版本号变体（点号 vs 连字符）
    // 例如: "claude-4.5-sonnet" → "claude-4-5-sonnet" 或反向
    const withDashVersion = lowerPartialName.replace(/\./g, '-');
    const withDotVersion = lowerPartialName.replace(/-(\d)/g, '.$1');
    
    if (allOfficialNames.includes(withDashVersion)) {
      return withDashVersion;
    }
    if (allOfficialNames.includes(withDotVersion)) {
      return withDotVersion;
    }
    
    // 尝试前缀匹配变体
    matches = allOfficialNames.filter(name =>
      name.startsWith(withDashVersion + '-') || name.startsWith(withDotVersion + '-')
    );
    if (matches.length > 0) {
      matches.sort((a, b) => a.length - b.length);
      return matches[0];
    }
    
    // 【策略 6】包含匹配（降级方案）
    matches = allOfficialNames.filter(name =>
      name.includes(partialName) || name.includes(lowerPartialName)
    );
    
    if (matches.length > 0) {
      matches.sort((a, b) => a.length - b.length);
      return matches[0];
    }
    
    // 【策略 7】智能分词匹配 - 处理复杂名称
    const parts = lowerPartialName.split(/[-\s_.\/]/);
    if (parts.length >= 2) {
      matches = allOfficialNames.filter(name => {
        const lowerName = name.toLowerCase();
        return parts.every(part => part.length < 2 || lowerName.includes(part));
      });
      
      if (matches.length > 0) {
        // 计算相似度分数
        const scored = matches.map(name => {
          let score = 0;
          const lowerName = name.toLowerCase();
          
          // 完整匹配的部分越多，分数越高
          for (const part of parts) {
            if (part.length >= 2 && lowerName.includes(part)) {
              score += part.length;
            }
          }
          
          // 长度越接近，分数越高
          const lengthDiff = Math.abs(name.length - partialName.length);
          score -= lengthDiff * 0.1;
          
          return { name, score };
        });
        
        scored.sort((a, b) => b.score - a.score);
        return scored[0].name;
      }
    }
    
    return null;
  }

  extractSmartModelName(modelName) {
    // 这个函数用于生成最终的模型名（添加用户前缀后的名称）
    // 规则：
    // 1. 如果有描述性前缀（抗截断、假流式、[满血1m] 等）→ 保留
    // 2. 如果有常规提供商前缀（Qwen/、THUDM/等）→ 去除中间层，只保留模型名
    
    if (!modelName.includes('/')) {
      return modelName;  // 无前缀，直接返回
    }
    
    const parts = modelName.split('/');
    
    // 描述性前缀关键词（中文）
    const descriptivePrefixes = [
      '假流式', '流式', '抗截断', '流式抗截断',
      '免审', '审核', '无审核', '快速',
      '稳定', '高速', '优化', '加速',
      '满血', '满额', '长文本', '超长'
    ];
    
    // 检查是否为描述性前缀的函数
    const isDescriptive = (part) => {
      // 1. 包含方括号标签（如 [满血1m]、[免审]、[抗截断]）
      if (part.includes('[') || part.includes(']')) {
        return true;
      }
      // 2. 包含中文描述性关键词
      return descriptivePrefixes.some(prefix => part.includes(prefix));
    };
    
    if (parts.length === 2) {
      // 两段格式：A/B
      const firstPart = parts[0];
      
      // 检查第一段是否为描述性前缀
      if (isDescriptive(firstPart)) {
        return modelName;  // 保留完整：如 "抗截断/claude-3.5-sonnet" 或 "[满血1m]/gemini-2.5-pro"
      } else {
        return parts[1];  // 去除提供商：如 "Qwen/Qwen3" → "Qwen3"
      }
    } else if (parts.length >= 3) {
      // 三段或更多格式：A/B/C...
      const secondPart = parts[1];
      
      // 检查第二段是否为描述性前缀
      if (isDescriptive(secondPart)) {
        // 保留描述性前缀+模型：如 "小丑/[满血1m]/gemini-2.5-pro" → "[满血1m]/gemini-2.5-pro"
        return parts.slice(1).join('/');
      } else {
        // 去除中间层，只保留最后一段：如 "SLA/Qwen/Qwen3-VL" → "Qwen3-VL"
        return parts[parts.length - 1];
      }
    }
    
    return modelName;
  }

  generateNameVariants(name) {
    const variants = new Set([name]);

    const withDots = name.replace(/(\d)-(\d)/g, '$1.$2');
    const withDashes = name.replace(/(\d)\.(\d)/g, '$1-$2');
    variants.add(withDots);
    variants.add(withDashes);

    const lowerParams = name.replace(/(\d+\.?\d*)B\b/gi, (match, num) => `${num}b`);
    const upperParams = name.replace(/(\d+\.?\d*)b\b/gi, (match, num) => `${num}B`);
    variants.add(lowerParams);
    variants.add(upperParams);

    const withUnderscores = name.replace(/-/g, '_');
    const withHyphens = name.replace(/_/g, '-');
    variants.add(withUnderscores);
    variants.add(withHyphens);

    variants.add(name.toLowerCase());
    variants.add(name.toUpperCase());
    variants.add(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());

    const combo1 = withDots.replace(/(\d+\.?\d*)b\b/gi, (match, num) => `${num}B`);
    const combo2 = withDashes.replace(/(\d+\.?\d*)B\b/gi, (match, num) => `${num}b`);
    variants.add(combo1);
    variants.add(combo2);

    const commonPrefixes = ['', 'meta-llama/', 'Qwen/', 'THUDM/', 'deepseek-ai/'];
    const baseVariants = Array.from(variants);
    for (const prefix of commonPrefixes) {
      for (const variant of baseVariants) {
        if (!variant.includes('/')) {
          variants.add(prefix + variant);
        }
      }
    }

    return Array.from(variants);
  }

  calculatePricing() {
    if (!this.upstreamData || this.inferredBasePrice === null) {
      throw new Error('缺少必要数据或未推断基础价');
    }

    this.results = [];
    const hasOneHubDirectPrice = this.upstreamData.some(m => m._isOneHubDirectPrice);
    const isDirectPrice = this.isDirectPriceWebsite(this.apiUrl);
    const priceMultiplier = isDirectPrice ? 2 : 1; // dev88.tech 需要 2倍转换
    
    if (hasOneHubDirectPrice) {
      console.log('💰 使用 One Hub 直接价格模式（已转换为美元）');
    } else if (isDirectPrice) {
      console.log('💰 使用直接价格模式，转换系数: 2x');
    }

    for (const model of this.upstreamData) {
      let inputPrice = 0;
      let outputPrice = 0;
      let pricingMode = '';

      if (model.quota_type === 1) {
        pricingMode = '按次计费';
        inputPrice = model.model_price || 0;
        outputPrice = model.model_price || 0;
      } else if (model.quota_type === 0) {
        pricingMode = '按量计费';
        // 修复：正确处理 0 值
        // model_ratio 为 0 时使用默认值 1
        const modelRatio = (model.model_ratio !== undefined && model.model_ratio !== null) ? model.model_ratio : 1;
        // completion_ratio 为 0 时保留 0（表示输出免费）
        const completionRatio = (model.completion_ratio !== undefined && model.completion_ratio !== null) ? model.completion_ratio : 1;

        // 🔧 One Hub 直接价格模式
        if (hasOneHubDirectPrice || model._isOneHubDirectPrice) {
          // One Hub 直接价格：model_ratio 已经是转换后的美元价格
          // 无需再次转换，直接使用
          inputPrice = modelRatio;
        }
        // 🔧 其他直接价格模式
        else if (isDirectPrice) {
          // 直接价格模式：model_ratio 就是价格，乘以转换系数
          inputPrice = modelRatio * priceMultiplier;
        }
        // 标准模式
        else {
          // 标准模式：basePrice × modelRatio
          inputPrice = this.inferredBasePrice * modelRatio;
        }
        outputPrice = inputPrice * completionRatio;
      } else {
        pricingMode = '未知模式';
      }

      inputPrice = Math.round(inputPrice * 10000) / 10000;
      outputPrice = Math.round(outputPrice * 10000) / 10000;

      // ✅ Bug #021 修复：增加 smartName 字段用于配置生成
      this.results.push({
        modelName: model.model_name,
        originalName: this.extractOriginalModelName(model.model_name),
        smartName: this.extractSmartModelName(model.model_name),  // ✅ 新增：用于配置生成
        pricingMode: pricingMode,
        quotaType: model.quota_type,
        modelRatio: model.model_ratio,
        completionRatio: model.completion_ratio,
        inputPrice: inputPrice,
        outputPrice: outputPrice,
        rawModelPrice: model.model_price,
        modelId: model.id
      });
    }

    this.results.sort((a, b) => a.modelName.localeCompare(b.modelName));

    return this.results;
  }

  getResults() {
    return this.results;
  }

  exportToCSV() {
    const headers = ['模型名称', '原始名称', '计费模式', '输入价格($/1M)', '输出价格($/1M)', 'Model Ratio', 'Completion Ratio'];
    const rows = this.results.map(r => [
      r.modelName,
      r.originalName,
      r.pricingMode,
      r.inputPrice,
      r.outputPrice,
      r.modelRatio || 'N/A',
      r.completionRatio || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  setBasePrice(price) {
    this.inferredBasePrice = price;
  }
}

window.PricingEngine = PricingEngine;

// {{END_MODIFICATIONS}}