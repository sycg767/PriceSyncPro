// PriceSyncPro Extension - Background Service Worker
// 这个脚本在后台运行，处理扩展的生命周期事件

chrome.runtime.onInstalled.addListener(() => {
  console.log('PriceSyncPro Extension 已安装');
});

// 从 session Cookie 中提取用户 ID
function extractUserIdFromSession(sessionValue) {
  try {
    // Session 格式: base64编码的数据
    // 解码后包含 "id" 字段
    const decoded = atob(sessionValue);
    console.log('📜 Session 解码内容:', decoded);
    
    // 尝试提取 ID（通常在 session 中有 id 字段）
    // 格式可能是: ...id\x03int\x04\x02\x00\x02... 或类似
    const idMatch = decoded.match(/id[^\d]*(\d+)/);
    if (idMatch) {
      return idMatch[1];
    }
    
    // 如果没有找到，返回 1 作为默认值（管理员通常是 ID 1）
    return '1';
  } catch (e) {
    console.warn('解析 session 失败:', e);
    return '1'; // 默认返回 1
  }
}

// 处理来自 Content Script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 处理获取 Cookie
  if (request.action === 'getCookies') {
    chrome.cookies.getAll({
      url: request.url
    }, (cookies) => {
      console.log('📋 获取到的所有 Cookies:', cookies);
      console.log('📋 Cookie 名称列表:', cookies.map(c => c.name));
      
      const sessionCookie = cookies.find(c => c.name === 'session');
      
      if (sessionCookie) {
        const userId = extractUserIdFromSession(sessionCookie.value);
        console.log(`✓ 从 session 提取用户 ID: ${userId}`);
        
        sendResponse({
          success: true,
          newApiUser: userId,
          allCookies: cookies,
          sessionValue: sessionCookie.value
        });
      } else {
        console.error('❌ 未找到 session Cookie');
        sendResponse({
          success: false,
          error: '未找到 session Cookie，请确保已登录',
          availableCookies: cookies.map(c => c.name)
        });
      }
    });
    
    return true; // 异步响应
  }
  
  // 处理跨域 fetch 请求（绕过 CORS）
  if (request.action === 'fetchCORS') {
    console.log('🌐 处理跨域请求:', request.url);
    console.log('🔑 请求头:', request.headers);
    
    fetch(request.url, {
      method: request.method || 'GET',
      headers: request.headers || {},
      body: request.body || undefined,
      credentials: 'include'  // 关键修复：携带 Cookie
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('✓ 跨域请求成功');
        sendResponse({
          success: true,
          data: data
        });
      })
      .catch(error => {
        console.error('❌ 跨域请求失败:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });
    
    return true; // 异步响应
  }
});