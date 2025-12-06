// PriceSyncPro Extension - Background Service Worker
// 这个脚本在后台运行，处理扩展的生命周期事件

chrome.runtime.onInstalled.addListener(() => {
  console.log("PriceSyncPro Extension 已安装");
});

// 工具函数：异步延迟
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 工具函数：生成随机延迟（500-1500ms）
function randomDelay() {
  return Math.floor(Math.random() * 1000) + 500;
}

// 工具函数：生成完整的浏览器请求头（增强版 - 支持 Cloudflare）
function generateBrowserHeaders(url) {
  const urlObj = new URL(url);
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    Referer: `${urlObj.origin}/`,
    Origin: urlObj.origin,
    "Cache-Control": "max-age=0",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Dest": "document",
    "sec-ch-ua":
      '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-ch-ua-arch": '"x86"',
    "sec-ch-ua-bitness": '"64"',
    "sec-ch-ua-full-version": '"142.0.7444.176"',
    "sec-ch-ua-full-version-list":
      '"Chromium";v="142.0.7444.176", "Google Chrome";v="142.0.7444.176", "Not_A Brand";v="99.0.0.0"',
    "sec-ch-ua-model": '""',
    "sec-ch-ua-platform-version": '"19.0.0"',
    Priority: "u=0, i",
  };
}

// 工具函数：从浏览器读取目标域名的所有 Cookies（包括父域名）
async function getCookiesForDomain(url) {
  return new Promise(async (resolve) => {
    console.log(`🔍 尝试读取 Cookies，目标 URL: ${url}`);

    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    console.log(`🔍 解析后的域名: ${hostname}`);

    // 提取父域名
    const parts = hostname.split(".");
    const parentDomain =
      parts.length > 2 ? parts.slice(-2).join(".") : hostname;
    console.log(`🔍 父域名: ${parentDomain}`);

    // 方案 1：使用 url 参数读取
    chrome.cookies.getAll({ url: url }, (cookiesFromUrl) => {
      console.log(
        `🔍 [方案1-url参数] 找到 ${cookiesFromUrl.length} 个:`,
        cookiesFromUrl.map((c) => `${c.name}@${c.domain}`)
      );

      // 方案 2：使用 domain 参数读取（不带点）
      chrome.cookies.getAll({ domain: hostname }, (cookiesFromDomain) => {
        console.log(
          `🔍 [方案2-domain=${hostname}] 找到 ${cookiesFromDomain.length} 个:`,
          cookiesFromDomain.map((c) => `${c.name}@${c.domain}`)
        );

        // 方案 3：使用 domain 参数读取父域名（带点）
        chrome.cookies.getAll(
          { domain: `.${parentDomain}` },
          (cookiesFromParent) => {
            console.log(
              `🔍 [方案3-domain=.${parentDomain}] 找到 ${cookiesFromParent.length} 个:`,
              cookiesFromParent.map((c) => `${c.name}@${c.domain}`)
            );

            // 合并所有 Cookies（去重）
            const allCookies = [
              ...cookiesFromUrl,
              ...cookiesFromDomain,
              ...cookiesFromParent,
            ];
            const uniqueCookies = Array.from(
              new Map(allCookies.map((c) => [c.name, c])).values()
            );

            console.log(
              `🔍 [合并去重] 最终 ${uniqueCookies.length} 个:`,
              uniqueCookies.map((c) => `${c.name}@${c.domain}`)
            );

            if (uniqueCookies.length === 0) {
              console.error(`❌ 所有方案都未找到 Cookies！`);
              console.error(`💡 可能原因：扩展权限不足或用户未访问过该域名`);
              resolve("");
              return;
            }

            const cookieString = uniqueCookies
              .map((c) => `${c.name}=${c.value}`)
              .join("; ");
            console.log(`🍪 Cookie 字符串长度: ${cookieString.length} 字符`);

            const cfClearance = uniqueCookies.find(
              (c) => c.name === "cf_clearance"
            );
            if (cfClearance) {
              console.log(`✅ 找到 cf_clearance (域名: ${cfClearance.domain})`);
            } else {
              console.warn("⚠️ 未找到 cf_clearance");
            }

            resolve(cookieString);
          }
        );
      });
    });
  });
}

// 工具函数：从标签页内发起请求（绕过 HttpOnly Cookie 限制）
async function fetchFromTab(url, apiUrl) {
  // 自动去除尾部斜杠，确保 URL 规范化
  const cleanUrl = url.trim().replace(/\/+$/, "");
  const cleanApiUrl = apiUrl.trim().replace(/\/+$/, "");

  const urlObj = new URL(cleanUrl);
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

  console.log(`🌐 打开标签页发起请求: ${baseUrl}`);

  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: baseUrl, active: false }, async (tab) => {
      console.log(`✅ 标签页 ID: ${tab.id}`);

      // 等待页面加载和 Cloudflare 验证
      setTimeout(async () => {
        try {
          console.log(`📡 注入脚本到标签页 ${tab.id}`);

          // 注入脚本发起请求（使用清理后的 URL）
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async (targetUrl) => {
              try {
                const response = await fetch(targetUrl, {
                  credentials: "include",
                });

                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}`);
                }

                const text = await response.text();
                try {
                  return { success: true, data: JSON.parse(text) };
                } catch {
                  return { success: true, data: text };
                }
              } catch (error) {
                return { success: false, error: error.message };
              }
            },
            args: [cleanApiUrl],
          });

          await chrome.tabs.remove(tab.id);

          const result = results[0].result;
          if (result.success) {
            console.log(`✅ 标签页请求成功`);
            resolve(result.data);
          } else {
            console.error(`❌ 标签页请求失败: ${result.error}`);
            reject(new Error(result.error));
          }
        } catch (error) {
          console.error(`❌ 脚本注入失败:`, error);
          try {
            await chrome.tabs.remove(tab.id);
          } catch {}
          reject(error);
        }
      }, 8000);
    });
  });
}

// 核心函数：带重试的 fetch（指数退避 + 标签页请求）
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;
  let usedTabFetch = false;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 尝试 ${attempt}/${maxRetries}: ${url}`);

      if (attempt > 1) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ 等待 ${delay}ms 后重试...`);
        await sleep(delay);
      } else {
        await sleep(randomDelay());
      }

      const response = await fetch(url, options);

      // 🔧 修复:只在检测到Cloudflare保护时才使用标签页模式
      if (response.status === 403 && !usedTabFetch) {
        // 检查响应头和内容,判断是否为Cloudflare保护
        const contentType = response.headers.get("content-type") || "";
        const server = response.headers.get("server") || "";
        const cfRay = response.headers.get("cf-ray");

        // 🔧 关键修复：更严格的 Cloudflare 特征检测
        // 必须同时满足以下条件之一才认为是 CF：
        // 1. 有 cf-ray 响应头（CF 的标志）
        // 2. server 响应头包含 cloudflare 且返回 HTML（避免误判普通 403）
        const isCloudflare =
          cfRay ||
          (server.toLowerCase().includes("cloudflare") &&
            contentType.includes("text/html"));

        if (isCloudflare) {
          console.warn(
            `⚠️ 检测到Cloudflare保护 (cf-ray: ${cfRay}, server: ${server}), 切换到标签页请求模式`
          );
          usedTabFetch = true;
          try {
            const data = await fetchFromTab(url, url);
            return data;
          } catch (tabError) {
            console.error(`❌ 标签页请求也失败:`, tabError.message);
            throw new Error(
              `HTTP 403: Cloudflare保护\n\n建议：请先在浏览器中访问该网站并完成验证`
            );
          }
        } else {
          // 非Cloudflare的403错误,直接抛出，不使用标签页模式
          console.warn(
            `⚠️ 收到403但非Cloudflare保护（cf-ray: ${cfRay}, server: ${server}），可能是权限不足或未登录`
          );
          throw new Error(
            `HTTP 403: 访问被拒绝\n\n可能原因：\n1. 未登录或权限不足\n2. API密钥无效\n3. IP被限制`
          );
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }
    } catch (error) {
      console.error(`❌ 尝试 ${attempt} 失败:`, error.message);
      lastError = error;

      // 如果已经使用过标签页模式且失败，直接抛出错误，不再重试
      if (usedTabFetch) {
        throw lastError;
      }

      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }

  throw lastError;
}

// 从 session Cookie 中提取用户 ID
function extractUserIdFromSession(sessionValue) {
  try {
    // Session 格式: base64编码的数据
    // 解码后包含 "id" 字段
    const decoded = atob(sessionValue);
    console.log("📜 Session 解码内容:", decoded);

    // 尝试提取 ID（通常在 session 中有 id 字段）
    // 格式可能是: ...id\x03int\x04\x02\x00\x02... 或类似
    const idMatch = decoded.match(/id[^\d]*(\d+)/);
    if (idMatch) {
      return idMatch[1];
    }

    // 如果没有找到，返回 1 作为默认值（管理员通常是 ID 1）
    return "1";
  } catch (e) {
    console.warn("解析 session 失败:", e);
    return "1"; // 默认返回 1
  }
}

// 处理来自 Content Script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 处理获取 Cookie
  if (request.action === "getCookies") {
    chrome.cookies.getAll(
      {
        url: request.url,
      },
      (cookies) => {
        console.log("📋 获取到的所有 Cookies:", cookies);
        console.log(
          "📋 Cookie 名称列表:",
          cookies.map((c) => c.name)
        );

        const sessionCookie = cookies.find((c) => c.name === "session");

        if (sessionCookie) {
          const userId = extractUserIdFromSession(sessionCookie.value);
          console.log(`✓ 从 session 提取用户 ID: ${userId}`);

          sendResponse({
            success: true,
            newApiUser: userId,
            allCookies: cookies,
            sessionValue: sessionCookie.value,
          });
        } else {
          console.error("❌ 未找到 session Cookie");
          sendResponse({
            success: false,
            error: "未找到 session Cookie，请确保已登录",
            availableCookies: cookies.map((c) => c.name),
          });
        }
      }
    );

    return true; // 异步响应
  }

  // 处理跨域 fetch 请求（绕过 CORS + 反爬虫 + Cloudflare）
  if (request.action === "fetchCORS") {
    console.log("🌐 处理跨域请求:", request.url);

    // 异步处理（需要读取 Cookies）
    (async () => {
      try {
        // 1. 读取目标域名的所有 Cookies
        const cookieString = await getCookiesForDomain(request.url);

        // 2. 生成完整的浏览器请求头
        const browserHeaders = generateBrowserHeaders(request.url);
        const mergedHeaders = { ...browserHeaders, ...(request.headers || {}) };

        // 3. 如果有 Cookies，添加到请求头
        if (cookieString) {
          mergedHeaders["Cookie"] = cookieString;
        }

        console.log("🔑 合并后的请求头:", mergedHeaders);

        // 4. 使用带重试的 fetch
        const data = await fetchWithRetry(
          request.url,
          {
            method: request.method || "GET",
            headers: mergedHeaders,
            body: request.body || undefined,
            credentials: "include", // 携带 Cookie
          },
          3
        );

        console.log("✅ 跨域请求成功（可能经过重试）");
        sendResponse({
          success: true,
          data: data,
        });
      } catch (error) {
        console.error("❌ 跨域请求最终失败:", error);
        sendResponse({
          success: false,
          error: error.message,
        });
      }
    })();

    return true; // 异步响应
  }
});
