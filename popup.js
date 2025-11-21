// PriceSyncPro Extension - Popup Script
// 这个脚本运行在插件的弹出窗口中

let currentResults = null;
let currentApiUrl = '';
let presets = [];
let lastUsedConfig = null;
let urlPrefixMap = {}; // URL到前缀的映射

// 监听来自content script的进度消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'syncProgress') {
    showStatus(request.message, 'info');
  }
});

// ========================================
// 全局键盘快捷键
// ========================================
document.addEventListener('keydown', (e) => {
  // Esc 键：关闭所有打开的对话框
  if (e.key === 'Escape') {
    if (confirmModal.classList.contains('show')) {
      confirmModal.classList.remove('show');
    }
    if (inputModal.classList.contains('show')) {
      inputModal.classList.remove('show');
    }
    if (listModal.classList.contains('show')) {
      listModal.classList.remove('show');
    }
  }
  
  // Ctrl+Enter 或 Cmd+Enter：智能同步
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!smartSyncBtn.disabled) {
      smartSyncBtn.click();
    }
  }
  
  // Ctrl+S 或 Cmd+S：保存预设
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (getFullUpstreamUrl()) {
      savePresetBtn.click();
    }
  }
});

// 为保存预设按钮添加快捷键提示
document.addEventListener('DOMContentLoaded', () => {
  if (savePresetBtn) {
    savePresetBtn.title = '保存当前配置为预设\n⌨️ 快捷键: Ctrl+S';
  }
});

// DOM 元素
const smartSyncBtn = document.getElementById('smartSyncBtn');
const smartSyncBtnText = document.getElementById('smartSyncBtnText');
const batchUpdateBtn = document.getElementById('batchUpdateBtn');
const syncModeHint = document.getElementById('syncModeHint');
const syncModeText = document.getElementById('syncModeText');

// 快速同步模式的URL相关元素
const upstreamBaseUrlInput = document.getElementById('upstreamBaseUrl');
const apiPathSelect = document.getElementById('apiPathSelect');
const apiPathCustomInput = document.getElementById('apiPathCustom');
const modelPrefixInput = document.getElementById('modelPrefix');
const tokenGroupSelect = document.getElementById('tokenGroupSelect');
const channelSelect = document.getElementById('channelSelect');

// 模式切换相关元素
const quickSyncModeBtn = document.getElementById('quickSyncModeBtn');
const autoConfigModeBtn = document.getElementById('autoConfigModeBtn');
const quickSyncMode = document.getElementById('quickSyncMode');
const autoConfigMode = document.getElementById('autoConfigMode');

// 自动配置模式的URL相关元素
const upstreamBaseUrlAutoInput = document.getElementById('upstreamBaseUrlAuto');
const apiPathSelectAuto = document.getElementById('apiPathSelectAuto');
const apiPathCustomAutoInput = document.getElementById('apiPathCustomAuto');
const modelPrefixAuto = document.getElementById('modelPrefixAuto');
const apiKeyInput = document.getElementById('apiKeyInput');
const channelTagInput = document.getElementById('channelTagInput');

// 向后兼容：创建虚拟的 upstreamUrlInput 对象
const upstreamUrlInput = {
  get value() {
    return getFullUpstreamUrl();
  },
  set value(val) {
    setFullUpstreamUrl(val);
  },
  addEventListener: function(event, handler) {
    if (upstreamBaseUrlInput) upstreamBaseUrlInput.addEventListener(event, handler);
    if (apiPathSelect) apiPathSelect.addEventListener(event, handler);
  },
  parentElement: upstreamBaseUrlInput?.parentElement,
  focus: function() {
    if (upstreamBaseUrlInput) upstreamBaseUrlInput.focus();
  },
  style: upstreamBaseUrlInput?.style || {}
};

const upstreamUrlAuto = {
  get value() {
    return getFullUpstreamUrlAuto();
  },
  set value(val) {
    setFullUpstreamUrlAuto(val);
  },
  addEventListener: function(event, handler) {
    if (upstreamBaseUrlAutoInput) upstreamBaseUrlAutoInput.addEventListener(event, handler);
    if (apiPathSelectAuto) apiPathSelectAuto.addEventListener(event, handler);
  }
};

// 当前模式状态
let currentMode = 'quick'; // 'quick' 或 'auto'

// ========================================
// URL和前缀处理辅助函数
// ========================================

/**
 * 获取完整的上游URL（快速同步模式）
 * @returns {string} 完整的URL
 */
function getFullUpstreamUrl() {
  if (!upstreamBaseUrlInput) return '';
  
  const baseUrl = upstreamBaseUrlInput.value.trim();
  if (!baseUrl) return '';
  
  const apiPath = apiPathSelect?.value || 'api/pricing';
  
  // 如果选择了自定义路径
  if (apiPath === 'custom') {
    const customPath = apiPathCustomInput?.value.trim() || '';
    if (!customPath) return baseUrl;
    // 确保路径不以 / 开头（会自动添加）
    const cleanPath = customPath.replace(/^\/+/, '');
    return `${baseUrl}/${cleanPath}`;
  }
  
  // 使用预设路径
  return `${baseUrl}/${apiPath}`;
}

/**
 * 设置完整的上游URL（快速同步模式）
 * @param {string} fullUrl - 完整的URL
 */
function setFullUpstreamUrl(fullUrl) {
  if (!upstreamBaseUrlInput || !fullUrl) return;
  
  try {
    const urlObj = new URL(fullUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const path = urlObj.pathname.replace(/^\//, ''); // 去掉开头的 /
    
    upstreamBaseUrlInput.value = baseUrl;
    
    // 尝试匹配预设路径
    if (path === 'api/pricing') {
      apiPathSelect.value = 'api/pricing';
      if (apiPathCustomInput) apiPathCustomInput.style.display = 'none';
    } else if (path === 'api/available_model') {
      apiPathSelect.value = 'api/available_model';
      if (apiPathCustomInput) apiPathCustomInput.style.display = 'none';
    } else if (path) {
      // 自定义路径
      apiPathSelect.value = 'custom';
      if (apiPathCustomInput) {
        apiPathCustomInput.value = path;
        apiPathCustomInput.style.display = 'block';
      }
    }
  } catch (e) {
    // 如果不是有效的URL，直接设置到基础URL
    upstreamBaseUrlInput.value = fullUrl;
  }
}

/**
 * 获取完整的上游URL（自动配置模式）
 * @returns {string} 完整的URL
 */
function getFullUpstreamUrlAuto() {
  if (!upstreamBaseUrlAutoInput) return '';
  
  const baseUrl = upstreamBaseUrlAutoInput.value.trim();
  if (!baseUrl) return '';
  
  const apiPath = apiPathSelectAuto?.value || 'api/pricing';
  
  // 如果选择了自定义路径
  if (apiPath === 'custom') {
    const customPath = apiPathCustomAutoInput?.value.trim() || '';
    if (!customPath) return baseUrl;
    const cleanPath = customPath.replace(/^\/+/, '');
    return `${baseUrl}/${cleanPath}`;
  }
  
  return `${baseUrl}/${apiPath}`;
}

/**
 * 设置完整的上游URL（自动配置模式）
 * @param {string} fullUrl - 完整的URL
 */
function setFullUpstreamUrlAuto(fullUrl) {
  if (!upstreamBaseUrlAutoInput || !fullUrl) return;
  
  try {
    const urlObj = new URL(fullUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const path = urlObj.pathname.replace(/^\//, '');
    
    upstreamBaseUrlAutoInput.value = baseUrl;
    
    if (path === 'api/pricing') {
      apiPathSelectAuto.value = 'api/pricing';
      if (apiPathCustomAutoInput) apiPathCustomAutoInput.style.display = 'none';
    } else if (path === 'api/available_model') {
      apiPathSelectAuto.value = 'api/available_model';
      if (apiPathCustomAutoInput) apiPathCustomAutoInput.style.display = 'none';
    } else if (path) {
      apiPathSelectAuto.value = 'custom';
      if (apiPathCustomAutoInput) {
        apiPathCustomAutoInput.value = path;
        apiPathCustomAutoInput.style.display = 'block';
      }
    }
  } catch (e) {
    upstreamBaseUrlAutoInput.value = fullUrl;
  }
}

/**
 * 获取规范化的渠道前缀（自动添加末尾的 /）
 * @returns {string} 带有末尾斜杠的前缀
 */
function getNormalizedPrefix() {
  const prefix = modelPrefixInput?.value.trim() || '';
  if (!prefix) return '';
  // 如果用户输入的前缀末尾没有 /，自动添加
  return prefix.endsWith('/') ? prefix : prefix + '/';
}

/**
 * 设置渠道前缀（自动去掉末尾的 /）
 * @param {string} prefix - 前缀
 */
function setPrefix(prefix) {
  if (!modelPrefixInput) return;
  // 显示时去掉末尾的 /，让UI更友好
  modelPrefixInput.value = prefix.replace(/\/+$/, '');
}

// ========================================
// 模式切换逻辑
// ========================================
function switchMode(mode) {
  currentMode = mode;
  
  if (mode === 'quick') {
    // 切换到快速同步模式
    quickSyncModeBtn.classList.add('active');
    autoConfigModeBtn.classList.remove('active');
    quickSyncMode.classList.add('active');
    autoConfigMode.classList.remove('active');
    
    // 更新按钮文本
    smartSyncBtnText.textContent = '智能同步';
  } else {
    // 切换到自动配置模式
    quickSyncModeBtn.classList.remove('active');
    autoConfigModeBtn.classList.add('active');
    quickSyncMode.classList.remove('active');
    autoConfigMode.classList.add('active');
    
    // 更新按钮文本
    smartSyncBtnText.textContent = '一键自动配置';
  }
  
  // 重新验证输入
  updateSmartSyncButton();
}

// 模式切换按钮事件监听
if (quickSyncModeBtn) {
  quickSyncModeBtn.addEventListener('click', () => switchMode('quick'));
}

if (autoConfigModeBtn) {
  autoConfigModeBtn.addEventListener('click', () => switchMode('auto'));
}

// 自动配置模式字段同步到快速模式
if (upstreamUrlAuto) {
  upstreamUrlAuto.addEventListener('input', () => {
    upstreamUrlInput.value = upstreamUrlAuto.value;
    // 保存自动配置模式的URL
    chrome.storage.local.set({ autoConfigUrl: upstreamUrlAuto.value });
    validateInputs();
  });
}

if (modelPrefixAuto) {
  modelPrefixAuto.addEventListener('input', () => {
    modelPrefixInput.value = modelPrefixAuto.value;
    // 保存自动配置模式的前缀
    chrome.storage.local.set({ autoConfigPrefix: modelPrefixAuto.value });
    validateInputs();
  });
}

// 保存API密钥输入
if (apiKeyInput) {
  apiKeyInput.addEventListener('input', () => {
    chrome.storage.local.set({ autoConfigApiKey: apiKeyInput.value });
  });
}

// 保存渠道标签输入
if (channelTagInput) {
  channelTagInput.addEventListener('input', () => {
    chrome.storage.local.set({ autoConfigChannelTag: channelTagInput.value });
  });
}

// 快速模式字段同步到自动配置模式（这部分已经在上面的事件监听中处理）
const refreshChannelsBtn = document.getElementById('refreshChannelsBtn');
const channelHint = document.getElementById('channelHint');
const presetSelect = document.getElementById('presetSelect');
const savePresetBtn = document.getElementById('savePresetBtn');
const advancedToggle = document.getElementById('advancedToggle');
const advancedToggleIcon = document.getElementById('advancedToggleIcon');
const advancedOptions = document.getElementById('advancedOptions');
const tableSearchInput = document.getElementById('tableSearchInput');
const prefixSuggestions = document.getElementById('prefixSuggestions');
const prefixSuggestionButtons = document.getElementById('prefixSuggestionButtons');

// 渠道列表缓存
let channelsList = [];

// URL 验证相关元素（稍后动态创建）
let urlValidationHint = null;
const statusDiv = document.getElementById('status');
const resultsSection = document.getElementById('resultsSection');
const resultsStats = document.getElementById('resultsStats');
const resultsTableBody = document.getElementById('resultsTableBody');
const infoBanner = document.getElementById('infoBanner');
const infoBannerText = document.getElementById('infoBannerText');
const closeBannerBtn = document.getElementById('closeBannerBtn');

// 右上角功能按钮
const refreshBtn = document.querySelector('.header-actions button[title="刷新"]');
const settingsBtn = document.querySelector('.header-actions button[title="设置"]');

// 模态对话框元素
const confirmModal = document.getElementById('confirmModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalInfoBox = document.getElementById('modalInfoBox');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');

// 输入对话框元素
const inputModal = document.getElementById('inputModal');
const inputModalTitle = document.getElementById('inputModalTitle');
const inputModalMessage = document.getElementById('inputModalMessage');
const inputModalField = document.getElementById('inputModalField');
const inputModalCancelBtn = document.getElementById('inputModalCancelBtn');
const inputModalConfirmBtn = document.getElementById('inputModalConfirmBtn');

// 列表管理对话框元素
const listModal = document.getElementById('listModal');
const listModalTitle = document.getElementById('listModalTitle');
const listModalMessage = document.getElementById('listModalMessage');
const presetListContainer = document.getElementById('presetListContainer');
const listModalCancelBtn = document.getElementById('listModalCancelBtn');

// 多字段编辑对话框元素（延迟获取，因为DOM可能还未完全加载）
let multiFieldModal, editNameField, editUrlField, editPrefixField;

// 确保DOM加载后获取元素
document.addEventListener('DOMContentLoaded', () => {
  multiFieldModal = document.getElementById('multiFieldModal');
  editNameField = document.getElementById('editNameField');
  editUrlField = document.getElementById('editUrlField');
  editPrefixField = document.getElementById('editPrefixField');
  
  console.log('多字段编辑对话框元素:', {
    multiFieldModal: !!multiFieldModal,
    editNameField: !!editNameField,
    editUrlField: !!editUrlField,
    editPrefixField: !!editPrefixField
  });
});

// ========================================
// 自定义确认对话框
// ========================================

/**
 * 显示自定义确认对话框
 * @param {Object} options - 对话框配置选项
 * @param {string} [options.title='确认操作'] - 对话框标题
 * @param {string} [options.message='确认要执行此操作吗？'] - 提示消息
 * @param {Array<{label: string, value: string}>} [options.info] - 信息列表
 * @param {string} [options.confirmText='确认'] - 确认按钮文本
 * @param {string} [options.cancelText='取消'] - 取消按钮文本
 * @returns {Promise<boolean>} 用户是否确认（true=确认，false=取消）
 */
function showConfirmDialog(options) {
  return new Promise((resolve) => {
    // 获取当前的按钮元素（可能已经被替换过）
    const currentCancelBtn = document.getElementById('modalCancelBtn');
    const currentConfirmBtn = document.getElementById('modalConfirmBtn');
    
    // 设置标题和消息
    modalTitle.textContent = options.title || '确认操作';
    modalMessage.textContent = options.message || '确认要执行此操作吗？';
    
    // 设置信息框内容
    if (options.info && options.info.length > 0) {
      modalInfoBox.innerHTML = '';
      options.info.forEach(item => {
        const infoItem = document.createElement('div');
        infoItem.className = 'modal-info-item';
        infoItem.innerHTML = `
          <span class="modal-info-label">${item.label}</span>
          <span class="modal-info-value">${item.value}</span>
        `;
        modalInfoBox.appendChild(infoItem);
      });
      modalInfoBox.style.display = 'block';
    } else {
      modalInfoBox.style.display = 'none';
    }
    
    // 设置按钮文本
    currentCancelBtn.textContent = options.cancelText || '取消';
    currentConfirmBtn.textContent = options.confirmText || '确认';
    
    // 显示模态框
    confirmModal.classList.add('show');
    
    // 绑定事件（先移除旧事件）
    const newCancelBtn = currentCancelBtn.cloneNode(true);
    const newConfirmBtn = currentConfirmBtn.cloneNode(true);
    currentCancelBtn.parentNode.replaceChild(newCancelBtn, currentCancelBtn);
    currentConfirmBtn.parentNode.replaceChild(newConfirmBtn, currentConfirmBtn);
    
    // 取消按钮
    const handleCancel = () => {
      confirmModal.classList.remove('show');
      confirmModal.removeEventListener('click', handleOverlayClick);
      resolve(false);
    };
    
    newCancelBtn.addEventListener('click', handleCancel);
    
    // 确认按钮
    const handleConfirm = () => {
      confirmModal.classList.remove('show');
      confirmModal.removeEventListener('click', handleOverlayClick);
      resolve(true);
    };
    
    newConfirmBtn.addEventListener('click', handleConfirm);
    
    // 点击遮罩层关闭
    const handleOverlayClick = (e) => {
      if (e.target === confirmModal) {
        confirmModal.classList.remove('show');
        confirmModal.removeEventListener('click', handleOverlayClick);
        resolve(false);
      }
    };
    
    confirmModal.addEventListener('click', handleOverlayClick);
  });
}

// ========================================
// 自定义输入对话框
// ========================================

/**
 * 显示自定义输入对话框
 * @param {Object} options - 对话框配置选项
 * @param {string} [options.title='输入信息'] - 对话框标题
 * @param {string} [options.message='请输入内容'] - 提示消息
 * @param {string} [options.placeholder='请输入...'] - 输入框占位符
 * @param {string} [options.defaultValue=''] - 默认值
 * @returns {Promise<string|null>} 用户输入的内容（null=取消）
 */
function showInputDialog(options) {
  return new Promise((resolve) => {
    // 获取当前的按钮元素
    const currentCancelBtn = document.getElementById('inputModalCancelBtn');
    const currentConfirmBtn = document.getElementById('inputModalConfirmBtn');
    
    // 设置标题和消息
    inputModalTitle.textContent = options.title || '输入信息';
    inputModalMessage.textContent = options.message || '请输入内容';
    
    // 设置输入框
    inputModalField.value = options.defaultValue || '';
    inputModalField.placeholder = options.placeholder || '请输入...';
    
    // 显示模态框
    inputModal.classList.add('show');
    
    // 聚焦到输入框
    setTimeout(() => {
      inputModalField.focus();
      inputModalField.select();
    }, 100);
    
    // 绑定事件（先移除旧事件）
    const newCancelBtn = currentCancelBtn.cloneNode(true);
    const newConfirmBtn = currentConfirmBtn.cloneNode(true);
    currentCancelBtn.parentNode.replaceChild(newCancelBtn, currentCancelBtn);
    currentConfirmBtn.parentNode.replaceChild(newConfirmBtn, currentConfirmBtn);
    
    // 取消按钮
    const handleCancel = () => {
      inputModal.classList.remove('show');
      inputModal.removeEventListener('click', handleOverlayClick);
      resolve(null);
    };
    
    newCancelBtn.addEventListener('click', handleCancel);
    
    // 确认按钮
    const handleConfirm = () => {
      const value = inputModalField.value.trim();
      if (value) {
        inputModal.classList.remove('show');
        inputModal.removeEventListener('click', handleOverlayClick);
        resolve(value);
      } else {
        inputModalField.focus();
      }
    };
    
    newConfirmBtn.addEventListener('click', handleConfirm);
    
    // 回车键确认
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleConfirm();
      }
    };
    
    inputModalField.addEventListener('keypress', handleKeyPress);
    
    // 点击遮罩层关闭
    const handleOverlayClick = (e) => {
      if (e.target === inputModal) {
        inputModal.classList.remove('show');
        inputModal.removeEventListener('click', handleOverlayClick);
        inputModalField.removeEventListener('keypress', handleKeyPress);
        resolve(null);
      }
    };
    
    inputModal.addEventListener('click', handleOverlayClick);
  });
}

// ========================================
// 自定义列表管理对话框
// ========================================

let selectedPresetIndex = null;

/**
 * 显示列表管理对话框
 * @param {Object} options - 对话框配置选项
 * @param {string} [options.title='管理列表'] - 对话框标题
 * @param {string} [options.message='选择一个项目'] - 提示消息
 * @param {Array<Object>} options.items - 列表项数组
 * @returns {Promise<{action: string, index: number}|null>} 用户操作结果（null=取消）
 */
function showListManagerDialog(options) {
  return new Promise((resolve) => {
    selectedPresetIndex = null;
    
    // 设置标题和消息
    listModalTitle.textContent = options.title || '管理列表';
    listModalMessage.textContent = options.message || '选择一个项目';
    
    // 渲染列表
    presetListContainer.innerHTML = '';
    
    if (!options.items || options.items.length === 0) {
      presetListContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">暂无数据</div>
        </div>
      `;
    } else {
      options.items.forEach((item, index) => {
        // 提取URL域名用于显示
        let urlDomain = '';
        try {
          const urlObj = new URL(item.url);
          urlDomain = urlObj.hostname;
        } catch (e) {
          urlDomain = item.url.substring(0, 30) + '...';
        }
        
        const presetItem = document.createElement('div');
        presetItem.className = 'preset-item';
        presetItem.innerHTML = `
          <div class="preset-item-header">
            <span class="preset-item-name">${item.prefix || '(无前缀)'}</span>
            <span class="preset-item-url" style="font-size: 11px; color: var(--color-text-secondary); margin-left: 8px;">📍 ${urlDomain}</span>
          </div>
          <div class="preset-item-actions">
            <button class="preset-action-btn preset-edit-btn" data-index="${index}" title="编辑">✏️</button>
            <button class="preset-action-btn preset-delete-btn" data-index="${index}" title="删除">🗑️</button>
          </div>
        `;
        
        // 点击整个项目选中
        presetItem.addEventListener('click', (e) => {
          // 如果点击的是按钮，不触发选中
          if (e.target.classList.contains('preset-action-btn')) {
            return;
          }
          
          // 移除其他选中状态
          presetListContainer.querySelectorAll('.preset-item').forEach(el => {
            el.classList.remove('selected');
          });
          
          // 添加选中状态
          presetItem.classList.add('selected');
          selectedPresetIndex = index;
        });
        
        // 编辑按钮
        const editBtn = presetItem.querySelector('.preset-edit-btn');
        editBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          listModal.classList.remove('show');
          resolve({ action: 'edit', index: index });
        });
        
        // 删除按钮
        const deleteBtn = presetItem.querySelector('.preset-delete-btn');
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          listModal.classList.remove('show');
          resolve({ action: 'delete', index: index });
        });
        
        presetListContainer.appendChild(presetItem);
      });
    }
    
    // 显示模态框
    listModal.classList.add('show');
    
    // 获取当前的按钮元素
    const currentCancelBtn = document.getElementById('listModalCancelBtn');
    
    // 绑定事件（先移除旧事件）
    const newCancelBtn = currentCancelBtn.cloneNode(true);
    currentCancelBtn.parentNode.replaceChild(newCancelBtn, currentCancelBtn);
    
    // 取消按钮事件
    const handleCancel = () => {
      listModal.classList.remove('show');
      listModal.removeEventListener('click', handleOverlayClick);
      resolve(null);
    };
    
    newCancelBtn.addEventListener('click', handleCancel);
    
    // 点击遮罩层关闭 - 使用命名函数避免重复绑定
    const handleOverlayClick = (e) => {
      if (e.target === listModal) {
        listModal.classList.remove('show');
        listModal.removeEventListener('click', handleOverlayClick);
        resolve(null);
      }
    };
    
    listModal.addEventListener('click', handleOverlayClick);
  });
}

/**
 * 检测用户登录状态
 * 通过检查 Cookie 判断用户是否已登录 New API 后台
 * @returns {Promise<void>}
 */
async function checkLoginStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    
    // 显示 Banner（如果之前被隐藏）
    infoBanner.classList.remove('hidden');
    infoBanner.style.opacity = '1';
    
    // 检查是否在 New API 页面
    if (!url || (!url.includes('localhost') && !url.includes('127.0.0.1') && !url.match(/https?:\/\/[^\/]+/))) {
      infoBannerText.textContent = '⚠️ 请在 New API 后台页面打开此插件';
      infoBanner.style.background = 'rgba(255, 149, 0, 0.08)';
      infoBanner.style.color = '#FF9500';
      closeBannerBtn.style.display = 'flex';
      return;
    }
    
    // 尝试获取 Cookie
    chrome.runtime.sendMessage({
      action: 'getCookies',
      url: url
    }, (response) => {
      if (response && response.success && response.newApiUser) {
        // ✅ 已登录 - 显示成功状态
        infoBannerText.innerHTML = `✅ 已连接 | 用户: ${response.newApiUser.username || '未知'}`;
        infoBanner.style.background = 'rgba(52, 199, 89, 0.08)';
        infoBanner.style.color = '#34C759';
        
        // 3秒后自动淡出并隐藏
        setTimeout(() => {
          infoBanner.style.transition = 'opacity 0.4s ease';
          infoBanner.style.opacity = '0';
          setTimeout(() => {
            infoBanner.classList.add('hidden');
          }, 400);
        }, 3000);
      } else {
        // ❌ 未登录 - 显示明确的操作指引
        infoBannerText.innerHTML = '⚠️ 未检测到登录状态 | 请登录后点击右上角 ⟳ 刷新';
        infoBanner.style.background = 'rgba(255, 149, 0, 0.08)';
        infoBanner.style.color = '#FF9500';
        closeBannerBtn.style.display = 'flex';
      }
    });
  } catch (error) {
    console.error('检测登录状态失败:', error);
    infoBannerText.textContent = 'ℹ️ 请在 New API 后台页面使用此插件';
    infoBanner.style.background = 'rgba(0, 122, 255, 0.08)';
    infoBanner.style.color = '#007AFF';
    closeBannerBtn.style.display = 'flex';
  }
}

// Banner 关闭按钮事件
if (closeBannerBtn) {
  closeBannerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    infoBanner.style.transition = 'opacity 0.3s ease';
    infoBanner.style.opacity = '0';
    setTimeout(() => {
      infoBanner.classList.add('hidden');
    }, 300);
  });
}

// ========================================
// 配置预设管理
// ========================================

/**
 * 从 Chrome Storage 加载所有配置预设
 * @returns {Promise<void>}
 */
async function loadPresets() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['presets', 'lastUsedConfig', 'urlPrefixMap'], (result) => {
      presets = result.presets || [];
      lastUsedConfig = result.lastUsedConfig || null;
      urlPrefixMap = result.urlPrefixMap || {};
      resolve();
    });
  });
}

/**
 * 保存预设列表到 Chrome Storage
 * @returns {void}
 */
function savePresets() {
  chrome.storage.local.set({ presets: presets });
}

/**
 * 保存最后使用的配置
 * @param {string} url - 上游定价 URL
 * @param {string} prefix - 模型前缀
 * @returns {void}
 */
function saveLastUsedConfig(url, prefix) {
  lastUsedConfig = { url, prefix, timestamp: Date.now() };
  
  // 保存URL-前缀关联
  if (url && prefix) {
    urlPrefixMap[url] = prefix;
    chrome.storage.local.set({ urlPrefixMap: urlPrefixMap });
  }
  
  chrome.storage.local.set({ lastUsedConfig: lastUsedConfig });
  updateSmartSyncButton();
}

/**
 * 渲染预设下拉列表
 * 将所有预设添加到下拉选择框中
 * @returns {void}
 */
function renderPresetSelect() {
  // 清空现有选项（保留第一个默认选项）
  presetSelect.innerHTML = '<option value="">选择配置预设...</option>';
  
  // 如果没有预设，添加提示
  if (presets.length === 0) {
    const emptyOption = document.createElement('option');
    emptyOption.disabled = true;
    emptyOption.textContent = '暂无保存的预设配置';
    presetSelect.appendChild(emptyOption);
    return;
  }
  
  // 添加预设选项
  presets.forEach((preset, index) => {
    // 提取URL域名
    let urlDomain = '';
    try {
      const urlObj = new URL(preset.url);
      urlDomain = urlObj.hostname;
      // 简化域名显示（去掉www和端口）
      urlDomain = urlDomain.replace(/^www\./, '').split(':')[0];
    } catch (e) {
      urlDomain = '';
    }
    
    const option = document.createElement('option');
    option.value = index;
    
    // 优化显示格式：前缀 · 域名
    const prefixText = preset.prefix || '默认';
    const displayText = urlDomain
      ? `${prefixText} · ${urlDomain}`
      : `${prefixText}`;
    
    option.textContent = displayText;
    option.title = `${preset.name || prefixText}\n${preset.url}`; // 悬停显示完整信息
    presetSelect.appendChild(option);
  });
}

// 预设选择变化
presetSelect.addEventListener('change', () => {
  const selectedValue = presetSelect.value;
  
  if (selectedValue === '') {
    return;
  }
  
  const index = parseInt(selectedValue);
  const preset = presets[index];
  
  if (preset) {
    setFullUpstreamUrl(preset.url);
    setPrefix(preset.prefix || '');
    
    // 恢复渠道 ID（如果有）
    if (preset.channelId) {
      channelSelect.value = preset.channelId;
    }
    
    showStatus(`✅ 已加载预设: ${preset.name}`, 'success');
    
    // 更新智能同步按钮状态
    updateSmartSyncButton();
  }
});

// 监听输入框变化
upstreamUrlInput.addEventListener('input', () => {
  updateSmartSyncButton();
  showPrefixSuggestions();
  clearTimeout(window._matchTimeout);
  window._matchTimeout = setTimeout(() => {
    autoMatchChannelFromUrl();
  }, 500);
});
// modelPrefixInput 的事件监听已在上面处理

// 高级选项折叠功能
if (advancedToggle) {
  advancedToggle.addEventListener('click', () => {
    const isHidden = advancedOptions.style.display === 'none';
    advancedOptions.style.display = isHidden ? 'block' : 'none';
    advancedToggleIcon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  });
}

// 表格搜索功能
if (tableSearchInput) {
  tableSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    const rows = resultsTableBody.querySelectorAll('tr');
    
    let visibleCount = 0;
    rows.forEach(row => {
      const modelName = row.querySelector('.model-name')?.textContent.toLowerCase() || '';
      if (modelName.includes(searchTerm)) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    
    // 更新统计信息
    if (searchTerm) {
      resultsStats.textContent = `找到 ${visibleCount} 个匹配项`;
    }
  });
}

// 保存新预设
savePresetBtn.addEventListener('click', async () => {
  const url = getFullUpstreamUrl();
  const prefix = getNormalizedPrefix();
  
  if (!url) {
    showStatus('⚠️ 请先输入上游定价 URL', 'error');
    return;
  }
  
  // 检查是否已存在相同配置
  const existingIndex = presets.findIndex(p => p.url === url && p.prefix === prefix);
  
  if (existingIndex !== -1) {
    showStatus('ℹ️ 该配置已存在于预设中', 'info');
    presetSelect.value = existingIndex;
    return;
  }
  
  // 使用自定义输入对话框询问预设名称
  const name = await showInputDialog({
    title: '💾 保存配置预设',
    message: '为此配置起一个易识别的名称',
    placeholder: '例如：OpenAI 官方配置',
    defaultValue: `${prefix || '默认'}配置`
  });
  
  if (!name) return;
  
  // 添加新预设（包含渠道 ID）
  const channelId = channelSelect.value.trim();
  presets.push({
    name: name.trim(),
    url: url,
    prefix: prefix,
    channelId: channelId || null,
    createdAt: Date.now()
  });
  
  savePresets();
  renderPresetSelect();
  showStatus(`✅ 预设"${name}"已保存`, 'success');
});

// 显示预设管理器
async function showPresetManager() {
  if (presets.length === 0) {
    showStatus('ℹ️ 暂无保存的预设', 'info');
    return;
  }
  
  // 使用自定义列表管理对话框
  const result = await showListManagerDialog({
    title: '📋 管理配置预设',
    message: '点击预设项右侧的按钮进行编辑或删除',
    items: presets
  });
  
  if (result === null) {
    return;
  }
  
  // 编辑预设
  if (result.action === 'edit') {
    await editPreset(result.index);
    // 编辑完成后重新打开管理器
    await showPresetManager();
  }
  
  // 删除预设
  if (result.action === 'delete') {
    const confirmed = await showConfirmDialog({
      title: '⚠️ 确认删除',
      message: `确定要删除预设"${presets[result.index].name}"吗？`,
      info: [
        { label: 'URL', value: presets[result.index].url },
        { label: '前缀', value: presets[result.index].prefix || '(无)' }
      ],
      confirmText: '确认删除',
      cancelText: '取消'
    });
    
    if (confirmed) {
      const deletedName = presets[result.index].name;
      presets.splice(result.index, 1);
      savePresets();
      renderPresetSelect();
      showStatus(`✅ 已删除预设: ${deletedName}`, 'success');
      
      // 如果还有预设，重新打开管理器
      if (presets.length > 0) {
        await showPresetManager();
      }
    } else {
      // 取消删除，重新打开管理器
      await showPresetManager();
    }
  }
}

/**
 * 显示多字段编辑对话框
 * @param {Object} preset - 预设配置对象
 * @param {string} preset.name - 预设名称
 * @param {string} preset.url - 上游定价 URL
 * @param {string} [preset.prefix] - 模型前缀
 * @returns {Promise<{name: string, url: string, prefix: string}|null>} 编辑结果（null=取消）
 */
function showMultiFieldEditDialog(preset) {
  return new Promise((resolve) => {
    // 如果元素未加载，尝试重新获取
    if (!multiFieldModal) {
      multiFieldModal = document.getElementById('multiFieldModal');
      editNameField = document.getElementById('editNameField');
      editUrlField = document.getElementById('editUrlField');
      editPrefixField = document.getElementById('editPrefixField');
    }
    
    if (!multiFieldModal || !editNameField || !editUrlField || !editPrefixField) {
      console.error('多字段编辑对话框元素未找到');
      resolve(null);
      return;
    }
    
    // 填充当前值
    editNameField.value = preset.name;
    editUrlField.value = preset.url;
    editPrefixField.value = preset.prefix || '';
    
    // 显示对话框
    multiFieldModal.classList.add('show');
    
    // 聚焦到第一个字段
    setTimeout(() => {
      editNameField.focus();
      editNameField.select();
    }, 100);
    
    // 获取当前的按钮元素
    const currentCancelBtn = document.getElementById('multiFieldModalCancelBtn');
    const currentConfirmBtn = document.getElementById('multiFieldModalConfirmBtn');
    
    // 绑定事件（先移除旧事件）
    const newCancelBtn = currentCancelBtn.cloneNode(true);
    const newConfirmBtn = currentConfirmBtn.cloneNode(true);
    currentCancelBtn.parentNode.replaceChild(newCancelBtn, currentCancelBtn);
    currentConfirmBtn.parentNode.replaceChild(newConfirmBtn, currentConfirmBtn);
    
    // 取消按钮
    const handleCancel = () => {
      multiFieldModal.classList.remove('show');
      multiFieldModal.removeEventListener('click', handleOverlayClick);
      resolve(null);
    };
    
    newCancelBtn.addEventListener('click', handleCancel);
    
    // 确认按钮
    const handleConfirm = () => {
      const name = editNameField.value.trim();
      const url = editUrlField.value.trim();
      const prefix = editPrefixField.value.trim();
      
      if (!name) {
        // 显示提示
        editNameField.style.borderColor = 'var(--color-danger)';
        editNameField.focus();
        setTimeout(() => {
          editNameField.style.borderColor = '';
        }, 2000);
        return;
      }
      
      if (!url) {
        // 显示提示
        editUrlField.style.borderColor = 'var(--color-danger)';
        editUrlField.focus();
        setTimeout(() => {
          editUrlField.style.borderColor = '';
        }, 2000);
        return;
      }
      
      multiFieldModal.classList.remove('show');
      multiFieldModal.removeEventListener('click', handleOverlayClick);
      editPrefixField.removeEventListener('keypress', handleKeyPress);
      resolve({ name, url, prefix });
    };
    
    newConfirmBtn.addEventListener('click', handleConfirm);
    
    // 回车键确认（在最后一个字段）
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleConfirm();
      }
    };
    
    editPrefixField.addEventListener('keypress', handleKeyPress);
    
    // Tab 键在字段间切换
    const handleTab = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.target === editNameField) {
          editUrlField.focus();
        } else if (e.target === editUrlField) {
          editPrefixField.focus();
        } else if (e.target === editPrefixField) {
          editNameField.focus();
        }
      }
    };
    
    editNameField.addEventListener('keydown', handleTab);
    editUrlField.addEventListener('keydown', handleTab);
    editPrefixField.addEventListener('keydown', handleTab);
    
    // 点击遮罩层关闭
    const handleOverlayClick = (e) => {
      if (e.target === multiFieldModal) {
        multiFieldModal.classList.remove('show');
        multiFieldModal.removeEventListener('click', handleOverlayClick);
        editPrefixField.removeEventListener('keypress', handleKeyPress);
        editNameField.removeEventListener('keydown', handleTab);
        editUrlField.removeEventListener('keydown', handleTab);
        editPrefixField.removeEventListener('keydown', handleTab);
        resolve(null);
      }
    };
    
    multiFieldModal.addEventListener('click', handleOverlayClick);
  });
}

/**
 * 编辑指定索引的预设配置
 * @param {number} index - 预设在数组中的索引
 * @returns {Promise<void>}
 */
async function editPreset(index) {
  const preset = presets[index];
  
  if (!preset) {
    showStatus('❌ 预设不存在', 'error');
    return;
  }
  
  // 使用多字段编辑对话框
  const result = await showMultiFieldEditDialog(preset);
  
  if (!result) {
    return; // 用户取消
  }
  
  // 验证 URL 格式
  const urlValidation = validateUrl(result.url);
  if (!urlValidation.valid) {
    showStatus(`❌ URL 格式错误：${urlValidation.error}`, 'error');
    // 重新打开编辑对话框
    await editPreset(index);
    return;
  }
  
  // 更新预设（保留渠道 ID）
  const channelId = channelSelect.value.trim();
  presets[index] = {
    ...preset,
    name: result.name.trim(),
    url: result.url.trim(),
    prefix: result.prefix.trim(),
    channelId: channelId || preset.channelId || null,
    updatedAt: Date.now()
  };
  
  savePresets();
  renderPresetSelect();
  showStatus(`✅ 已更新预设: ${result.name}`, 'success');
}

// 更新智能同步按钮状态
function updateSmartSyncButton() {
  const url = getFullUpstreamUrl();
  const channelId = channelSelect.value.trim();
  
  if (!url) {
    smartSyncBtn.disabled = true;
    smartSyncBtnText.textContent = '智能同步';
    syncModeHint.style.display = 'none';
    return;
  }
  
  smartSyncBtn.disabled = false;
  
  // 根据是否选择渠道决定同步模式
  if (channelId) {
    smartSyncBtnText.textContent = '完整同步（模型+价格）';
    syncModeText.textContent = '将同步模型列表并更新价格';
    syncModeHint.style.display = 'block';
  } else {
    smartSyncBtnText.textContent = '快速更新（仅价格）';
    syncModeText.textContent = '仅更新价格配置';
    syncModeHint.style.display = 'block';
  }
}

// 智能同步按钮点击事件（增强版，集成自动配置）
smartSyncBtn.addEventListener('click', async () => {
  // ✅ 防止重复点击
  if (smartSyncBtn.disabled) {
    return;
  }
  
  // ✅ 修复：根据当前模式决定执行哪个功能
  if (currentMode === 'auto') {
    // 自动配置模式：创建渠道、供货商、模型，然后自动同步价格
    smartSyncBtn.disabled = true;
    const originalButtonHTML = smartSyncBtn.innerHTML;
    smartSyncBtn.innerHTML = '<span class="spinner"></span>自动配置中...';
    
    try {
      // 步骤1: 创建渠道、供货商、模型
      const autoConfigResult = await performAutoConfiguration();
      
      if (!autoConfigResult.success) {
        return;
      }
      
      // 步骤2: 等待渠道列表刷新
      showStatus('⏳ 正在刷新渠道列表...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadChannelList();
      
      // 步骤3: 自动选择刚创建的渠道
      const createdChannelName = autoConfigResult.channelName;
      const matchedChannel = channelsList.find(ch => ch.name === createdChannelName);
      
      if (matchedChannel) {
        channelSelect.value = matchedChannel.id;
        chrome.storage.local.set({ channelId: matchedChannel.id });
        showStatus(`✅ 已自动选择渠道: ${createdChannelName}`, 'success');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // 步骤4: 自动执行完整同步（模型列表 + 价格），跳过确认对话框
      smartSyncBtn.innerHTML = '<span class="spinner"></span>同步模型和价格中...';
      // 传递自动配置模式使用的前缀
      await performCompleteSyncLogic(true, normalizedPrefix);
      
    } catch (error) {
      showStatus(`❌ 自动配置失败：${error.message}`, 'error');
    } finally {
      // ✅ 强制恢复按钮状态
      smartSyncBtn.disabled = false;
      // 恢复按钮的原始 HTML，而不是调用 updateSmartSyncButton，
      // 因为后者会设置错误的文本，并且无法恢复按钮的图标和原始状态。
      smartSyncBtn.innerHTML = originalButtonHTML;
    }
    
  } else {
    // 快速同步模式：根据是否选择渠道决定同步模式
    const channelId = channelSelect.value.trim();
    
    if (channelId) {
      await performCompleteSyncLogic();
    } else {
      await performQuickUpdateLogic();
    }
  }
});

// ========================================
// 批量更新所有渠道按钮
// ========================================
if (batchUpdateBtn) {
  batchUpdateBtn.addEventListener('click', async () => {
    await performBatchUpdateAllChannels();
  });
}

/**
 * 批量更新所有渠道的价格配置
 * 遍历所有渠道，使用其base_url自动更新价格
 */
async function performBatchUpdateAllChannels() {
  // 确认操作
  const confirmed = await showConfirmDialog({
    title: '🔄 批量更新所有渠道',
    message: '将自动获取所有渠道的URL并更新其价格配置\n\n这可能需要一些时间，确定继续吗？',
    info: [
      { label: '渠道数量', value: `${channelsList.length} 个` },
      { label: '预计耗时', value: `约 ${Math.ceil(channelsList.length * 2)} 秒` }
    ],
    confirmText: '开始批量更新',
    cancelText: '取消'
  });
  
  if (!confirmed) {
    return;
  }
  
  // 禁用按钮
  batchUpdateBtn.disabled = true;
  const originalHTML = batchUpdateBtn.innerHTML;
  batchUpdateBtn.innerHTML = '<span class="spinner"></span>批量更新中...';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 确保 content script 已加载
    const scriptReady = await ensureContentScript(tab.id);
    if (!scriptReady) {
      showStatus('❌ 无法连接到页面脚本，请刷新页面后重试', 'error');
      return;
    }
    
    // 如果渠道列表为空，先加载
    if (channelsList.length === 0) {
      showStatus('📋 正在加载渠道列表...', 'info');
      await loadChannelList();
      
      if (channelsList.length === 0) {
        showStatus('⚠️ 没有找到可用的渠道', 'error');
        return;
      }
    }
    
    showStatus(`🚀 开始批量更新 ${channelsList.length} 个渠道...`, 'info');
    showProgress(0, '准备中...');
    
    let successCount = 0;
    let failedCount = 0;
    const failedChannels = [];
    
    // 遍历所有渠道
    for (let i = 0; i < channelsList.length; i++) {
      const channel = channelsList[i];
      const progress = Math.round(((i + 1) / channelsList.length) * 100);
      
      showProgress(progress, `处理 ${i + 1}/${channelsList.length}: ${channel.name}`);
      showStatus(`🔄 [${i + 1}/${channelsList.length}] 正在更新渠道: ${channel.name}`, 'info');
      
      try {
        if (!channel.baseUrl) {
          console.warn(`渠道 ${channel.name} 没有 base_url，跳过`);
          failedCount++;
          failedChannels.push({ name: channel.name, reason: '缺少 base_url' });
          continue;
        }
        
        // 提取渠道前缀
        const prefix = channel.name.endsWith('/') ? channel.name : channel.name + '/';
        
        // 智能尝试两种API路径
        const apiPaths = [
          { path: '/api/pricing', name: 'New API' },
          { path: '/api/available_model', name: 'One Hub' }
        ];
        let analyzeResult = null;
        let usedPath = null;
        const attemptErrors = [];
        
        for (const apiConfig of apiPaths) {
          const upstreamUrl = `${channel.baseUrl}${apiConfig.path}`;
          
          const result = await sendMessageWithRetry(tab.id, {
            action: 'analyzePricing',
            upstreamUrl: upstreamUrl
          });
          
          if (result.success && result.response.success) {
            analyzeResult = result;
            usedPath = apiConfig.path;
            break;
          } else {
            // 记录失败原因
            const error = result.error || result.response?.error || '未知错误';
            attemptErrors.push(`${apiConfig.name}(${apiConfig.path}): ${error}`);
          }
        }
        
        if (!analyzeResult) {
          failedCount++;
          const detailedReason = attemptErrors.join(' | ');
          failedChannels.push({ name: channel.name, reason: detailedReason });
          continue;
        }
        
        const results = analyzeResult.response.results;
        const apiUrl = analyzeResult.response.apiUrl;
        
        // 步骤2: 同步到后台
        const syncResult = await sendMessageWithRetry(tab.id, {
          action: 'syncToBackend',
          results: results,
          apiUrl: apiUrl,
          prefix: prefix
        });
        
        if (!syncResult.success || !syncResult.response.success) {
          const error = syncResult.error || syncResult.response?.error || '未知错误';
          console.error(`渠道 ${channel.name} 同步失败:`, error);
          failedCount++;
          failedChannels.push({ name: channel.name, reason: error });
          continue;
        }
        
        successCount++;
        console.log(`✅ 渠道 ${channel.name} 更新成功`);
        
        // 稍微延迟，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`处理渠道 ${channel.name} 时出错:`, error);
        failedCount++;
        failedChannels.push({ name: channel.name, reason: error.message });
      }
    }
    
    // 显示最终结果
    showProgress(100, '✅ 批量更新完成');
    
    let resultMsg = `🎉 批量更新完成！\n\n`;
    resultMsg += `✅ 成功: ${successCount} 个渠道\n`;
    
    if (failedCount > 0) {
      resultMsg += `❌ 失败: ${failedCount} 个渠道\n\n`;
      resultMsg += `失败的渠道：\n`;
      failedChannels.forEach(ch => {
        resultMsg += `• ${ch.name}: ${ch.reason}\n`;
      });
    }
    
    showStatus(resultMsg, successCount > 0 ? 'success' : 'error');
    
    setTimeout(() => {
      hideProgress();
    }, 3000);
    
  } catch (error) {
    showStatus(`❌ 批量更新失败：${error.message}`, 'error');
    hideProgress();
  } finally {
    // 恢复按钮
    batchUpdateBtn.disabled = false;
    batchUpdateBtn.innerHTML = originalHTML;
  }
}

// 快速更新逻辑（仅价格）
async function performQuickUpdateLogic() {
  const upstreamUrl = getFullUpstreamUrl();
  const prefix = getNormalizedPrefix();
  
  if (!upstreamUrl) {
    showStatus('⚠️ 请先输入上游定价 URL', 'error');
    return;
  }
  
  // ✅ 防止重复执行
  if (smartSyncBtn.disabled) {
    return;
  }
  
  saveConfig();
  
  smartSyncBtn.disabled = true;
  smartSyncBtn.innerHTML = '<span class="spinner"></span>快速更新中...';
  
  try {
    showStatus('⚡ 正在获取上游定价数据...', 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 确保 content script 已加载
    const scriptReady = await ensureContentScript(tab.id);
    if (!scriptReady) {
      showStatus(
        '❌ 无法连接到页面脚本\n\n' +
        '💡 解决方法：\n' +
        '1. 刷新当前页面（F5）\n' +
        '2. 重新打开此插件',
        'error'
      );
      return;
    }
    
    // 步骤1: 分析价格
    const analyzeResult = await sendMessageWithRetry(tab.id, {
      action: 'analyzePricing',
      upstreamUrl: upstreamUrl
    });
    
    if (!analyzeResult.success) {
      showStatus(`❌ 分析失败：${analyzeResult.error}`, 'error');
      return;
    }
    
    const analyzeResponse = analyzeResult.response;
    
    if (!analyzeResponse.success) {
      showStatus(`❌ 分析失败：${analyzeResponse.error}`, 'error');
      return;
    }
    
    currentResults = analyzeResponse.results;
    currentApiUrl = analyzeResponse.apiUrl;
    
    // 保存为最后使用的配置
    saveLastUsedConfig(upstreamUrl, prefix);
    
    // 渲染结果表格
    renderResultsTable(analyzeResponse.results, prefix);
    
    showStatus('⚡ 分析完成，正在同步到后台...', 'info');
    
    // 步骤2: 自动同步到后台
    const syncResult = await sendMessageWithRetry(tab.id, {
      action: 'syncToBackend',
      results: currentResults,
      apiUrl: currentApiUrl,
      prefix: prefix
    });
    
    if (!syncResult.success) {
      showStatus(`❌ 同步失败：${syncResult.error}`, 'error');
      return;
    }
    
    const syncResponse = syncResult.response;
    
    if (syncResponse.success) {
      let statusMsg = `✅ 快速更新成功！\n\n` +
        `📊 分析了 ${analyzeResponse.results.length} 个模型\n` +
        `🚀 同步统计：\n` +
        `• ModelPrice: ${syncResponse.stats.modelPriceCount} 个\n` +
        `• ModelRatio: ${syncResponse.stats.modelRatioCount} 个\n` +
        `• CompletionRatio: ${syncResponse.stats.completionRatioCount} 个`;
      
      showStatus(statusMsg, 'success');
    } else {
      showStatus(`❌ 同步失败：${syncResponse.error}`, 'error');
    }
    
  } catch (error) {
    showStatus(`❌ 错误：${error.message}`, 'error');
  } finally {
    smartSyncBtn.disabled = false;
    updateSmartSyncButton();
  }
}

// 完整同步逻辑（模型+价格）
async function performCompleteSyncLogic(skipConfirmation = false) {
  const upstreamUrl = getFullUpstreamUrl();
  const prefix = getNormalizedPrefix();
  const channelId = channelSelect.value.trim();
  
  if (!upstreamUrl) {
    showStatus('⚠️ 请先输入上游定价 URL', 'error');
    return;
  }
  
  if (!channelId) {
    showStatus('⚠️ 请先选择渠道', 'error');
    channelSelect.focus();
    return;
  }
  
  // ✅ 防止重复执行（仅在非自动配置模式下检查）
  if (currentMode !== 'auto' && smartSyncBtn.disabled) {
    return;
  }
  
  const channelIdNum = parseInt(channelId);
  if (isNaN(channelIdNum) || channelIdNum <= 0) {
    showStatus('❌ 渠道 ID 格式错误', 'error');
    return;
  }
  
  // 显示确认对话框（除非跳过确认）
  if (!skipConfirmation) {
    const confirmed = await showConfirmDialog({
      title: '🎯 确认完整同步',
      message: '将执行以下操作：\n1. 同步上游模型列表到渠道\n2. 分析上游价格\n3. 同步价格配置到后台',
      info: [
        { label: '渠道 ID', value: channelIdNum.toString() },
        { label: '上游 URL', value: upstreamUrl.substring(0, 40) + '...' },
        { label: '模型前缀', value: prefix || '(无前缀)' }
      ],
      confirmText: '开始完整同步',
      cancelText: '取消'
    });
    
    if (!confirmed) {
      return;
    }
  }
  
  saveConfig();
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 确保 content script 已加载
    const scriptReady = await ensureContentScript(tab.id);
    if (!scriptReady) {
      showStatus(
        '❌ 无法连接到页面脚本\n\n' +
        '💡 解决方法：\n' +
        '1. 刷新当前页面（F5）\n' +
        '2. 重新打开此插件',
        'error'
      );
      return;
    }
    
    // 步骤1: 同步模型列表
    showProgress(10, '步骤 1/3: 同步模型列表');
    showStatus('🔄 步骤 1/3: 正在同步上游模型列表...', 'info');
    
    const syncModelsResult = await sendMessageWithRetry(tab.id, {
      action: 'syncChannelModels',
      channelId: channelIdNum,
      prefix: prefix,
      tokenGroup: tokenGroupSelect.value,
      upstreamUrl: upstreamUrl
    });
    
    if (!syncModelsResult.success) {
      showStatus(`❌ 同步模型列表失败：${syncModelsResult.error}`, 'error');
      return;
    }
    
    const syncModelsResponse = syncModelsResult.response;
    
    if (!syncModelsResponse.success) {
      showStatus(`❌ 同步模型列表失败：${syncModelsResponse.error}`, 'error');
      return;
    }
    
    showProgress(40, `步骤 1/3 完成 (${syncModelsResponse.stats.totalModels}个)`);
    showStatus(`✅ 步骤 1/3 完成：已同步 ${syncModelsResponse.stats.totalModels} 个模型`, 'success');
    
    // 步骤2: 分析价格
    showProgress(50, '步骤 2/3: 分析价格');
    showStatus('🔍 步骤 2/3: 正在分析上游价格...', 'info');
    
    const analyzeResult = await sendMessageWithRetry(tab.id, {
      action: 'analyzePricing',
      upstreamUrl: upstreamUrl
    });
    
    if (!analyzeResult.success) {
      showStatus(`❌ 分析价格失败：${analyzeResult.error}`, 'error');
      return;
    }
    
    const analyzeResponse = analyzeResult.response;
    
    if (!analyzeResponse.success) {
      showStatus(`❌ 分析价格失败：${analyzeResponse.error}`, 'error');
      return;
    }
    
    currentResults = analyzeResponse.results;
    currentApiUrl = analyzeResponse.apiUrl;
    
    // 保存为最后使用的配置
    saveLastUsedConfig(upstreamUrl, prefix);
    
    // 渲染结果表格
    renderResultsTable(analyzeResponse.results, prefix);
    
    showProgress(70, `步骤 2/3 完成 (${analyzeResponse.results.length}个)`);
    showStatus(`✅ 步骤 2/3 完成：已分析 ${analyzeResponse.results.length} 个模型`, 'success');
    
    // 步骤3: 同步价格到后台
    showProgress(80, '步骤 3/3: 同步价格');
    showStatus('🚀 步骤 3/3: 正在同步价格到后台...', 'info');
    
    const syncPriceResult = await sendMessageWithRetry(tab.id, {
      action: 'syncToBackend',
      results: currentResults,
      apiUrl: currentApiUrl,
      prefix: prefix
    });
    
    if (!syncPriceResult.success) {
      showStatus(`❌ 同步价格失败：${syncPriceResult.error}`, 'error');
      return;
    }
    
    const syncPriceResponse = syncPriceResult.response;
    
    if (syncPriceResponse.success) {
      showProgress(100, '✅ 完整同步成功');
      let statusMsg = `🎉 完整同步成功！\n\n` +
        `📊 步骤 1 - 模型列表：${syncModelsResponse.stats.totalModels} 个\n` +
        `📊 步骤 2 - 价格分析：${analyzeResponse.results.length} 个\n` +
        `📊 步骤 3 - 同步统计：\n` +
        `• ModelPrice: ${syncPriceResponse.stats.modelPriceCount} 个\n` +
        `• ModelRatio: ${syncPriceResponse.stats.modelRatioCount} 个\n` +
        `• CompletionRatio: ${syncPriceResponse.stats.completionRatioCount} 个`;
      
      showStatus(statusMsg, 'success');
      
      // 自动保存为预设
      const existingIndex = presets.findIndex(p => p.url === upstreamUrl && p.prefix === prefix);
      if (existingIndex === -1) {
        const autoName = prefix ? `${prefix}配置` : `默认配置`;
        presets.push({
          name: autoName,
          url: upstreamUrl,
          prefix: prefix,
          channelId: channelId,
          createdAt: Date.now(),
          autoSaved: true
        });
        savePresets();
        renderPresetSelect();
        console.log(`💾 已自动保存预设: ${autoName}`);
      }
    } else {
      showStatus(`❌ 同步价格失败：${syncPriceResponse.error}`, 'error');
    }
    
  } catch (error) {
    showStatus(`❌ 错误：${error.message}`, 'error');
  } finally {
    hideProgress();
  }
}

// 根据 URL 自动匹配渠道
async function autoMatchChannelFromUrl() {
  const upstreamUrl = getFullUpstreamUrl();
  
  if (!upstreamUrl || channelsList.length === 0) return;
  
  try {
    // 提取上游 URL 的域名
    const urlObj = new URL(upstreamUrl);
    const upstreamHost = urlObj.hostname;
    
    console.log('🔍 智能匹配渠道：上游域名 =', upstreamHost);
    
    // 查找匹配的渠道
    let bestMatch = null;
    let bestMatchScore = 0;
    
    for (const channel of channelsList) {
      if (!channel.baseUrl) continue;
      
      try {
        const channelUrlObj = new URL(channel.baseUrl);
        const channelHost = channelUrlObj.hostname;
        
        // 计算匹配度
        let score = 0;
        
        // 完全匹配
        if (channelHost === upstreamHost) {
          score = 100;
        }
        // 包含匹配
        else if (upstreamHost.includes(channelHost) || channelHost.includes(upstreamHost)) {
          score = 80;
        }
        // 去掉子域名后匹配
        else {
          const upstreamDomain = upstreamHost.split('.').slice(-2).join('.');
          const channelDomain = channelHost.split('.').slice(-2).join('.');
          if (upstreamDomain === channelDomain) {
            score = 60;
          }
        }
        
        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatch = channel;
        }
      } catch (e) {
        // 跳过无效的 base_url
        continue;
      }
    }
    
    // 如果找到匹配且置信度够高，自动选择
    if (bestMatch && bestMatchScore >= 60) {
      console.log(`✅ 找到匹配渠道: ${bestMatch.name} (ID: ${bestMatch.id}, 匹配度: ${bestMatchScore}%)`);
      
      // 自动选择渠道
      channelSelect.value = bestMatch.id;
      chrome.storage.local.set({ channelId: bestMatch.id });
      
      // 显示提示
      channelHint.innerHTML = `🎯 已自动匹配渠道: ${bestMatch.name} (匹配度: ${bestMatchScore}%)`;
      channelHint.style.color = 'var(--color-success)';
      
      setTimeout(() => {
        channelHint.innerHTML = '💡 选择要同步模型列表的渠道';
        channelHint.style.color = 'var(--color-text-secondary)';
      }, 4000);
      
      // 更新按钮状态
      updateSmartSyncButton();
    }
  } catch (e) {
    // URL 格式错误，忽略
    console.debug('URL 格式暂不完整，跳过自动匹配');
  }
}

// 根据前缀自动匹配渠道
function autoMatchChannelFromPrefix() {
  const prefix = modelPrefixInput?.value.trim() || '';
  
  if (!prefix || channelsList.length === 0) return;
  
  console.log('🔍 根据前缀匹配渠道:', prefix);
  
  // 查找渠道名称包含前缀的渠道
  const matchedChannel = channelsList.find(ch => {
    const channelName = ch.name.toLowerCase();
    const prefixLower = prefix.toLowerCase().replace(/\/$/, ''); // 移除末尾斜杠
    return channelName.includes(prefixLower);
  });
  
  if (matchedChannel) {
    console.log(`✅ 找到匹配渠道: ${matchedChannel.name} (ID: ${matchedChannel.id})`);
    channelSelect.value = matchedChannel.id;
    chrome.storage.local.set({ channelId: matchedChannel.id });
    
    channelHint.innerHTML = `🎯 已根据前缀自动选择渠道: ${matchedChannel.name}`;
    channelHint.style.color = 'var(--color-success)';
    
    setTimeout(() => {
      channelHint.innerHTML = '💡 选择要同步模型列表的渠道';
      channelHint.style.color = 'var(--color-text-secondary)';
    }, 3000);
    
    updateSmartSyncButton();
  }
}

// 从 storage 加载保存的配置
chrome.storage.local.get([
  'upstreamUrl', 'upstreamBaseUrl', 'apiPath',
  'modelPrefix', 'tokenGroup', 'channelId',
  'autoConfigBaseUrl', 'autoConfigApiPath',
  'autoConfigPrefix', 'autoConfigApiKey', 'autoConfigChannelTag'
], (result) => {
  // 优先使用新格式（分离的baseUrl和apiPath）
  if (result.upstreamBaseUrl && upstreamBaseUrlInput) {
    upstreamBaseUrlInput.value = result.upstreamBaseUrl;
  } else if (result.upstreamUrl) {
    // 向后兼容：如果只有旧格式的完整URL，则拆分它
    setFullUpstreamUrl(result.upstreamUrl);
  }
  
  if (result.apiPath && apiPathSelect) {
    apiPathSelect.value = result.apiPath;
    if (result.apiPath === 'custom' && apiPathCustomInput) {
      apiPathCustomInput.style.display = 'block';
    }
  }
  
  if (result.modelPrefix) {
    setPrefix(result.modelPrefix);
  }
  if (result.tokenGroup) {
    tokenGroupSelect.value = result.tokenGroup;
  }
  
  // 恢复自动配置模式的输入
  if (result.autoConfigBaseUrl && upstreamBaseUrlAutoInput) {
    upstreamBaseUrlAutoInput.value = result.autoConfigBaseUrl;
  }
  if (result.autoConfigApiPath && apiPathSelectAuto) {
    apiPathSelectAuto.value = result.autoConfigApiPath;
    if (result.autoConfigApiPath === 'custom' && apiPathCustomAutoInput) {
      apiPathCustomAutoInput.style.display = 'block';
    }
  }
  if (result.autoConfigPrefix && modelPrefixAuto) {
    modelPrefixAuto.value = result.autoConfigPrefix.replace(/\/+$/, '');
  }
  if (result.autoConfigApiKey && apiKeyInput) {
    apiKeyInput.value = result.autoConfigApiKey;
  }
  if (result.autoConfigChannelTag && channelTagInput) {
    channelTagInput.value = result.autoConfigChannelTag;
  }
  
  // 加载预设和最后使用的配置
  loadPresets().then(() => {
    renderPresetSelect();
    updateSmartSyncButton();
  });
  
  // 加载完配置后检测登录状态
  checkLoginStatus();
  
  // 初始化 URL 验证
  initUrlValidation();
  
  // 自动加载渠道列表
  loadChannelList();
  
  // 如果有保存的渠道 ID，恢复选择
  if (result.channelId) {
    setTimeout(() => {
      channelSelect.value = result.channelId;
    }, 500);
  }
});

// ========================================
// 渠道列表管理
// ========================================

/**
 * 加载渠道列表
 */
async function loadChannelList() {
  try {
    channelSelect.disabled = true;
    channelSelect.innerHTML = '<option value="">-- 加载中... --</option>';
    channelHint.innerHTML = '⏳ 正在加载渠道列表...';
    channelHint.style.color = 'var(--color-text-secondary)';
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 确保 content script 已加载
    const scriptReady = await ensureContentScript(tab.id);
    if (!scriptReady) {
      channelSelect.innerHTML = '<option value="">-- 请刷新页面 --</option>';
      channelHint.innerHTML = '❌ 无法连接到页面，请刷新后重试';
      channelHint.style.color = 'var(--color-danger)';
      return;
    }
    
    // 获取渠道列表
    const result = await sendMessageWithRetry(tab.id, {
      action: 'getChannelList'
    });
    
    if (!result.success) {
      channelSelect.innerHTML = '<option value="">-- 加载失败 --</option>';
      channelHint.innerHTML = '❌ 获取渠道列表失败，请检查登录状态';
      channelHint.style.color = 'var(--color-danger)';
      return;
    }
    
    const response = result.response;
    
    if (response.success && response.channels) {
      channelsList = response.channels;
      renderChannelSelect(response.channels);
      channelHint.innerHTML = `✅ 已加载 ${response.channels.length} 个渠道`;
      channelHint.style.color = 'var(--color-success)';
      
      // 渠道列表加载完成后，尝试根据前缀自动匹配
      autoMatchChannelFromPrefix();
      
      // 2秒后隐藏成功提示
      setTimeout(() => {
        channelHint.innerHTML = '💡 选择要同步模型列表的渠道';
        channelHint.style.color = 'var(--color-text-secondary)';
      }, 2000);
    } else {
      channelSelect.innerHTML = '<option value="">-- 无可用渠道 --</option>';
      channelHint.innerHTML = '⚠️ 未找到可用渠道';
      channelHint.style.color = 'var(--color-warning)';
    }
  } catch (error) {
    console.error('加载渠道列表失败:', error);
    channelSelect.innerHTML = '<option value="">-- 加载失败 --</option>';
    channelHint.innerHTML = '❌ 加载失败，请点击刷新按钮重试';
    channelHint.style.color = 'var(--color-danger)';
  } finally {
    channelSelect.disabled = false;
  }
}

/**
 * 渲染渠道下拉列表
 */
function renderChannelSelect(channels) {
  channelSelect.innerHTML = '<option value="">-- 请选择渠道 --</option>';
  
  channels.forEach(channel => {
    const option = document.createElement('option');
    option.value = channel.id;
    // 简化显示：渠道名称 (模型数)
    option.textContent = `${channel.name} (${channel.models}个)`;
    option.dataset.baseUrl = channel.baseUrl;
    option.dataset.tag = channel.tag || '';
    channelSelect.appendChild(option);
  });
}

// 刷新渠道列表按钮
if (refreshChannelsBtn) {
  refreshChannelsBtn.addEventListener('click', async () => {
    refreshChannelsBtn.style.transform = 'rotate(360deg)';
    refreshChannelsBtn.style.transition = 'transform 0.5s ease';
    
    await loadChannelList();
    
    setTimeout(() => {
      refreshChannelsBtn.style.transform = '';
    }, 500);
  });
}

// 渠道选择变化时保存并触发智能匹配
channelSelect.addEventListener('change', () => {
  const channelId = channelSelect.value;
  if (channelId) {
    chrome.storage.local.set({ channelId: channelId });
    performIntelligentChannelMatch();
  }
  
  // 更新智能同步按钮状态
  updateSmartSyncButton();
});

// 智能渠道匹配函数
function performIntelligentChannelMatch() {
  const selectedOption = channelSelect.options[channelSelect.selectedIndex];
  if (!selectedOption || selectedOption.value === '') return;
  
  const baseUrl = selectedOption.dataset.baseUrl;
  const upstreamUrl = upstreamUrlInput.value.trim();
  
  if (!baseUrl || !upstreamUrl) return;
  
  // 提取域名进行匹配
  const cleanBaseUrl = baseUrl.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
  const cleanUpstreamUrl = upstreamUrl.replace(/^https?:\/\//, '').split('/')[0].replace(/:\d+$/, '');
  
  if (cleanUpstreamUrl.includes(cleanBaseUrl) || cleanBaseUrl.includes(cleanUpstreamUrl)) {
    channelHint.innerHTML = '✅ 检测到渠道 URL 与上游 URL 匹配，建议使用此渠道';
    channelHint.style.color = 'var(--color-success)';
    
    setTimeout(() => {
      channelHint.innerHTML = '💡 选择要同步模型列表的渠道';
      channelHint.style.color = 'var(--color-text-secondary)';
    }, 3000);
  }
}

// ========================================
// URL 输入实时验证
// ========================================

/**
 * 验证 URL 格式
 * @param {string} url - 要验证的 URL
 * @returns {Object} 验证结果 { valid: boolean, error: string, suggestion: string }
 */
function validateUrl(url) {
  if (!url || url.trim() === '') {
    return { valid: false, error: '', suggestion: '' };
  }
  
  url = url.trim();
  
  // 检查协议
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      valid: false,
      error: '❌ 缺少协议',
      suggestion: `💡 建议：https://${url}`
    };
  }
  
  // 检查是否是有效的 URL
  try {
    const urlObj = new URL(url);
    
    // 检查主机名
    if (!urlObj.hostname || urlObj.hostname === '') {
      return {
        valid: false,
        error: '❌ 无效的主机名',
        suggestion: ''
      };
    }
    
    // 检查路径（建议包含路径）
    if (urlObj.pathname === '/' || urlObj.pathname === '') {
      return {
        valid: true,
        error: '',
        suggestion: '💡 提示：URL 通常应包含 API 路径（如 /api/pricing）'
      };
    }
    
    // 一切正常
    return { valid: true, error: '', suggestion: '' };
    
  } catch (e) {
    return {
      valid: false,
      error: '❌ URL 格式错误',
      suggestion: '💡 示例：https://api.example.com/api/pricing'
    };
  }
}

/**
 * 初始化 URL 验证功能
 */
function initUrlValidation() {
  // 创建验证提示元素
  urlValidationHint = document.createElement('div');
  urlValidationHint.className = 'input-hint';
  urlValidationHint.style.marginTop = '6px';
  urlValidationHint.style.fontSize = '12px';
  urlValidationHint.style.lineHeight = '1.3';
  urlValidationHint.style.display = 'none';
  
  // 插入到 URL 输入框后面
  const urlInputWrapper = upstreamUrlInput.parentElement;
  urlInputWrapper.parentElement.appendChild(urlValidationHint);
  
  // 监听输入事件（实时验证）
  upstreamUrlInput.addEventListener('input', () => {
    const url = upstreamUrlInput.value.trim();
    const result = validateUrl(url);
    
    if (url === '') {
      // 空输入，隐藏提示
      urlValidationHint.style.display = 'none';
      upstreamUrlInput.style.borderColor = '';
      return;
    }
    
    if (!result.valid) {
      // 无效 URL
      urlValidationHint.style.display = 'block';
      urlValidationHint.style.color = 'var(--color-danger)';
      urlValidationHint.innerHTML = result.error + (result.suggestion ? '<br>' + result.suggestion : '');
      upstreamUrlInput.style.borderColor = 'var(--color-danger)';
    } else if (result.suggestion) {
      // 有效但有建议
      urlValidationHint.style.display = 'block';
      urlValidationHint.style.color = 'var(--color-warning)';
      urlValidationHint.innerHTML = result.suggestion;
      upstreamUrlInput.style.borderColor = 'var(--color-success)';
    } else {
      // 完全有效
      urlValidationHint.style.display = 'block';
      urlValidationHint.style.color = 'var(--color-success)';
      urlValidationHint.innerHTML = '✅ URL 格式正确';
      upstreamUrlInput.style.borderColor = 'var(--color-success)';
      
      // 2秒后自动隐藏成功提示
      setTimeout(() => {
        if (upstreamUrlInput.value.trim() === url) {
          urlValidationHint.style.display = 'none';
          upstreamUrlInput.style.borderColor = '';
        }
      }, 2000);
    }
  });
  
  // 失去焦点时的处理
  upstreamUrlInput.addEventListener('blur', () => {
    const url = upstreamUrlInput.value.trim();
    const result = validateUrl(url);
    
    // 如果有错误，保持显示；如果只是建议或成功，隐藏
    if (result.valid) {
      setTimeout(() => {
        urlValidationHint.style.display = 'none';
        upstreamUrlInput.style.borderColor = '';
      }, 300);
    }
  });
  
  // 获得焦点时重新验证
  upstreamUrlInput.addEventListener('focus', () => {
    const url = upstreamUrlInput.value.trim();
    if (url) {
      const result = validateUrl(url);
      if (!result.valid) {
        urlValidationHint.style.display = 'block';
      }
    }
  });
}

// ========================================
// 右上角按钮功能
// ========================================

// 刷新按钮 - 重新检测登录状态和重置表单
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    // 重新检测登录状态
    checkLoginStatus();
    
    // 清空结果
    resultsSection.classList.remove('show');
    currentResults = null;
    currentApiUrl = '';
    
    // 显示刷新提示
    showStatus('🔄 已刷新页面状态', 'info');
    
    // 按钮动画
    refreshBtn.style.transform = 'rotate(360deg)';
    refreshBtn.style.transition = 'transform 0.5s ease';
    setTimeout(() => {
      refreshBtn.style.transform = '';
    }, 500);
  });
}

// 设置按钮 - 显示设置菜单
if (settingsBtn) {
  settingsBtn.addEventListener('click', async () => {
    // 第一步：选择操作类型
    const action = await showConfirmDialog({
      title: '⚙️ 设置菜单',
      message: '请选择要执行的操作',
      info: [
        { label: '预设数量', value: `${presets.length} 个` },
        { label: '最后使用', value: lastUsedConfig ? new Date(lastUsedConfig.timestamp).toLocaleString('zh-CN') : '无记录' }
      ],
      confirmText: '📋 管理预设',
      cancelText: 'ℹ️ 关于'
    });
    
    // 用户点击"管理预设"
    if (action === true) {
      await showPresetManager();
      return;
    }
    
    // 用户点击"关于"
    if (action === false) {
      await showAboutDialog();
      return;
    }
  });
}

// 显示关于对话框
async function showAboutDialog() {
  return new Promise((resolve) => {
    // 获取当前的按钮元素和modal body
    const currentCancelBtn = document.getElementById('modalCancelBtn');
    const currentConfirmBtn = document.getElementById('modalConfirmBtn');
    const modalBody = document.querySelector('#confirmModal .modal-body');
    
    // 设置标题
    modalTitle.textContent = 'PriceSyncPro';
    
    // 保存原始内容以便恢复
    const originalContent = modalBody.innerHTML;
    
    // 创建关于内容
    const aboutHTML = `
      <div class="about-content">
        <div class="about-logo">🚀</div>
        <div class="about-version">版本 1.0.0</div>
        <div class="about-description">
          New API 定价同步助手<br>
          一键同步上游模型定价配置
        </div>
        <div class="about-links">
          <a href="https://github.com/sycg767/PriceSyncPro" target="_blank" class="about-link-btn" id="githubLink">
            <span class="about-link-icon">
              <svg class="github-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </span>
            <span>GitHub 仓库</span>
          </a>
          
          <a href="https://github.com/sycg767/PriceSyncPro/issues" target="_blank" class="about-link-btn" id="issuesLink">
            <span class="about-link-icon">🐛</span>
            <span>问题反馈</span>
          </a>
          
          <a href="https://github.com/sycg767/PriceSyncPro/blob/main/README.md" target="_blank" class="about-link-btn" id="docsLink">
            <span class="about-link-icon">📖</span>
            <span>完整文档</span>
          </a>
        </div>
      </div>
    `;
    
    // 替换modal body内容
    modalBody.innerHTML = aboutHTML;
    
    // 设置按钮文本
    currentCancelBtn.style.display = 'none';
    currentConfirmBtn.textContent = '关闭';
    
    // 显示模态框
    confirmModal.classList.add('show');
    
    // 链接点击事件
    setTimeout(() => {
      const githubLink = document.getElementById('githubLink');
      const issuesLink = document.getElementById('issuesLink');
      const docsLink = document.getElementById('docsLink');
      
      if (githubLink) {
        githubLink.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: 'https://github.com/sycg767/PriceSyncPro' });
        });
      }
      
      if (issuesLink) {
        issuesLink.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: 'https://github.com/sycg767/PriceSyncPro/issues' });
        });
      }
      
      if (docsLink) {
        docsLink.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: 'https://github.com/sycg767/PriceSyncPro/blob/main/README.md' });
        });
      }
    }, 100);
    
    // 绑定事件（先移除旧事件）
    const newConfirmBtn = currentConfirmBtn.cloneNode(true);
    currentConfirmBtn.parentNode.replaceChild(newConfirmBtn, currentConfirmBtn);
    
    // 关闭按钮
    const handleClose = () => {
      confirmModal.classList.remove('show');
      confirmModal.removeEventListener('click', handleOverlayClick);
      
      // 恢复原始内容
      modalBody.innerHTML = originalContent;
      currentCancelBtn.style.display = '';
      
      resolve(true);
    };
    
    newConfirmBtn.addEventListener('click', handleClose);
    
    // 点击遮罩层关闭
    const handleOverlayClick = (e) => {
      if (e.target === confirmModal) {
        handleClose();
      }
    };
    
    confirmModal.addEventListener('click', handleOverlayClick);
  });
}

// 添加一个独立的"清空配置"功能（可以通过其他方式触发）
async function clearAllConfigs() {
  const confirmed = await showConfirmDialog({
    title: '⚠️ 危险操作',
    message: '确定要清空所有预设和历史配置吗？此操作无法撤销！',
    info: [
      { label: '预设数量', value: `${presets.length} 个` },
      { label: '历史记录', value: lastUsedConfig ? '有记录' : '无记录' }
    ],
    confirmText: '确认清空',
    cancelText: '取消'
  });
  
  if (confirmed) {
    presets = [];
    lastUsedConfig = null;
    chrome.storage.local.clear(() => {
      savePresets();
      renderPresetSelect();
      updateSmartSyncButton();
      showStatus('✅ 已清空所有配置', 'success');
    });
  }
}

// 保存配置
function saveConfig() {
  const config = {
    upstreamUrl: getFullUpstreamUrl(),
    upstreamBaseUrl: upstreamBaseUrlInput?.value.trim() || '',
    apiPath: apiPathSelect?.value || 'api/pricing',
    modelPrefix: getNormalizedPrefix(),
    tokenGroup: tokenGroupSelect?.value || ''
  };
  
  if (config.apiPath === 'custom' && apiPathCustomInput) {
    config.apiPathCustom = apiPathCustomInput.value.trim();
  }
  
  chrome.storage.local.set(config);
}

// 显示状态消息
function showStatus(message, type = 'info') {
  statusDiv.className = `status-card show status-${type}`;
  // 将换行符转换为 <br> 标签以支持多行显示
  statusDiv.innerHTML = message.replace(/\n/g, '<br>');
}

// 进度条控制
const progressBar = document.getElementById('progressBar');
const progressBarFill = progressBar?.querySelector('.progress-bar-fill');
const progressBarText = progressBar?.querySelector('.progress-bar-text');

function showProgress(percent, text) {
  if (!progressBar) return;
  progressBar.style.display = 'block';
  if (progressBarFill) progressBarFill.style.width = `${percent}%`;
  if (progressBarText) progressBarText.textContent = text || `${percent}%`;
}

function hideProgress() {
  if (progressBar) progressBar.style.display = 'none';
}

// ========================================
// Content Script 通信增强
// ========================================

// 带重试的消息发送
async function sendMessageWithRetry(tabId, message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message);
      return { success: true, response };
    } catch (error) {
      
      if (i < maxRetries - 1) {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 尝试重新注入 content script
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
          });
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (injectError) {
        }
      } else {
        // 最后一次失败
        return {
          success: false,
          error: '无法连接到页面脚本',
          needRefresh: true
        };
      }
    }
  }
}

/**
 * 确保 Content Script 已加载（按需注入）
 * @param {number} tabId - 标签页 ID
 * @returns {Promise<boolean>} 是否成功加载
 */
async function ensureContentScript(tabId) {
  try {
    // 先尝试发送一个测试消息
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    console.log('✓ Content Script 已存在');
    return true;
  } catch (error) {
    // 如果失败，尝试注入
    console.log('🔧 首次使用，正在注入 Content Script...');
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      // 等待脚本初始化
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 验证注入成功
      try {
        await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        console.log('✓ Content Script 注入成功');
        return true;
      } catch (verifyError) {
        console.error('❌ Content Script 注入后验证失败');
        return false;
      }
    } catch (injectError) {
      console.error('❌ Content Script 注入失败:', injectError);
      return false;
    }
  }
}

// 渲染结果表格（性能优化版：使用 DocumentFragment 批量插入）
function renderResultsTable(results, prefix = '') {
  // 清空表格
  resultsTableBody.innerHTML = '';
  
  // 统计
  const perUseCount = results.filter(r => r.quotaType === 1).length;
  const usageBasedCount = results.filter(r => r.quotaType === 0).length;
  
  // 显示统计信息
  resultsStats.textContent = `共 ${results.length} 个模型 (按次: ${perUseCount}, 按量: ${usageBasedCount})`;
  
  // 🚀 性能优化：使用 DocumentFragment 批量插入
  const fragment = document.createDocumentFragment();
  
  // 生成表格行
  results.forEach((result, index) => {
    // ✅ 修复：确保使用正确的模型名称逻辑
    const finalModelName = prefix ? prefix + result.smartName : result.smartName;
    
    // ✅ 安全获取数值，处理 null/undefined
    const safeInputPrice = (result.inputPrice != null) ? result.inputPrice : 0;
    const safeOutputPrice = (result.outputPrice != null) ? result.outputPrice : 0;
    const safeModelRatio = (result.modelRatio != null) ? result.modelRatio : 0;
    const safeCompletionRatio = (result.completionRatio != null) ? result.completionRatio : 0;
    
    const row = document.createElement('tr');
    
    // 模型名称
    const nameCell = document.createElement('td');
    nameCell.className = 'model-name';
    nameCell.textContent = finalModelName;
    nameCell.title = finalModelName; // 悬停显示完整名称
    row.appendChild(nameCell);
    
    // 计费方式
    const modeCell = document.createElement('td');
    const modeBadge = document.createElement('span');
    modeBadge.className = result.quotaType === 1 ? 'mode-badge mode-per-use' : 'mode-badge mode-usage';
    modeBadge.textContent = result.pricingMode;
    modeCell.appendChild(modeBadge);
    row.appendChild(modeCell);
    
    // ✅ 智能价格精度显示
    const formatPrice = (price) => {
      if (price === 0) return '$0';
      if (price >= 1) return `$${price.toFixed(2)}`;
      if (price >= 0.01) return `$${price.toFixed(4)}`;
      return `$${price.toFixed(6)}`;
    };
    
    const inputPriceCell = document.createElement('td');
    inputPriceCell.className = 'price-cell';
    inputPriceCell.textContent = formatPrice(safeInputPrice);
    inputPriceCell.title = `精确值: $${safeInputPrice}\n倍率: ${safeModelRatio.toFixed(4)}`;
    row.appendChild(inputPriceCell);
    
    const outputPriceCell = document.createElement('td');
    outputPriceCell.className = 'price-cell';
    outputPriceCell.textContent = formatPrice(safeOutputPrice);
    outputPriceCell.title = `精确值: $${safeOutputPrice}\n倍率: ${safeCompletionRatio.toFixed(4)}`;
    row.appendChild(outputPriceCell);
    
    // 🚀 添加到 fragment 而不是直接添加到 DOM
    fragment.appendChild(row);
  });
  
  // 🚀 一次性批量插入所有行（触发一次重排）
  resultsTableBody.appendChild(fragment);
  
  // 显示结果区域
  resultsSection.classList.add('show');
}


// ========================================
// 自动配置功能（一键创建渠道、供货商、模型）
// ========================================

/**
 * 执行自动配置（创建渠道、供货商、模型）
 * @returns {Promise<Object>} 配置结果
 */
async function performAutoConfiguration() {
  const upstreamUrl = getFullUpstreamUrlAuto();
  // 使用自动配置模式的前缀输入框
  const prefix = modelPrefixAuto?.value.trim() || '';
  const normalizedPrefix = prefix ? (prefix.endsWith('/') ? prefix : prefix + '/') : '';
  const apiKey = apiKeyInput?.value.trim() || '';
  const channelTag = channelTagInput?.value.trim() || '公益';
  const channelGroup = tokenGroupSelect?.value.trim() || 'default';
  
  if (!upstreamUrl) {
    showStatus('⚠️ 请先输入上游定价 URL', 'error');
    return { success: false, error: '缺少上游 URL' };
  }
  
  if (!apiKey) {
    showStatus('⚠️ 请先输入 API 密钥以创建渠道', 'error');
    return { success: false, error: '缺少 API 密钥' };
  }
  
  if (!normalizedPrefix) {
    showStatus('⚠️ 请先输入渠道前缀', 'error');
    return { success: false, error: '缺少渠道前缀' };
  }
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 确保 content script 已加载
    const scriptReady = await ensureContentScript(tab.id);
    if (!scriptReady) {
      showStatus('❌ 无法连接到页面脚本，请刷新页面后重试', 'error');
      return { success: false, error: '无法连接到页面' };
    }
    
    showStatus('🚀 步骤 1/3: 正在创建渠道...', 'info');
    showProgress(10, '创建渠道中...');
    
    // 步骤1: 提取 base_url（去掉 /api/pricing 后缀）
    let baseUrl = upstreamUrl;
    if (baseUrl.endsWith('/api/pricing')) {
      baseUrl = baseUrl.replace(/\/api\/pricing$/, '');
    }
    
    // 步骤2: 生成渠道名称（使用前缀去掉末尾斜杠）
    const channelName = normalizedPrefix.replace(/\/$/, '');
    
    // 步骤3: 创建渠道数据
    const channelData = {
      type: 1, // OpenAI 类型
      name: channelName,
      key: apiKey,
      base_url: baseUrl,
      models: 'gpt-3.5-turbo', // 占位模型（字符串格式），后续会被同步覆盖
      groups: channelGroup, // 字符串格式
      tag: channelTag,
      auto_ban: 0 // 关闭自动禁用
    };
    
    // 调用创建渠道 API
    const createChannelResult = await sendMessageWithRetry(tab.id, {
      action: 'createChannel',
      channelData: channelData
    });
    
    if (!createChannelResult.success) {
      showStatus(`❌ 创建渠道失败：${createChannelResult.error}`, 'error');
      hideProgress();
      return { success: false, error: createChannelResult.error };
    }
    
    const channelResponse = createChannelResult.response;
    
    // 检查是否已存在
    if (!channelResponse.success) {
      if (channelResponse.error && channelResponse.error.includes('已存在')) {
        showStatus('ℹ️ 渠道已存在，跳过创建步骤', 'info');
        // 继续执行供货商创建
      } else {
        showStatus(`❌ 创建渠道失败：${channelResponse.error}`, 'error');
        hideProgress();
        return { success: false, error: channelResponse.error };
      }
    } else {
      showStatus(`✅ 步骤 1/3: 渠道"${channelName}"创建成功`, 'success');
    }
    
    showProgress(40, '步骤 1/3 完成');
    
    // 步骤4: 创建供货商
    showStatus('🚀 步骤 2/3: 正在创建供货商...', 'info');
    showProgress(50, '创建供货商中...');
    
    const vendorIcon = normalizedPrefix.replace(/\/$/, '');
    // ✅ 修复：NewAPI 期望的字段名是 name 和 icon，而不是 vendor_name 和 vendor_icon
    const vendorData = {
      name: channelName,
      icon: vendorIcon
    };
    
    const createVendorResult = await sendMessageWithRetry(tab.id, {
      action: 'createVendor',
      vendorData: vendorData
    });
    
    if (!createVendorResult.success) {
      showStatus(`❌ 创建供货商失败：${createVendorResult.error}`, 'error');
      hideProgress();
      return { success: false, error: createVendorResult.error };
    }
    
    const vendorResponse = createVendorResult.response;
    
    if (!vendorResponse.success) {
      if (vendorResponse.error && vendorResponse.error.includes('已存在')) {
        showStatus('ℹ️ 供货商已存在，跳过创建步骤', 'info');
        // 需要获取现有供货商的 ID
        // TODO: 这里需要查询供货商列表获取 vendor_id
      } else {
        showStatus(`❌ 创建供货商失败：${vendorResponse.error}`, 'error');
        hideProgress();
        return { success: false, error: vendorResponse.error };
      }
    } else {
      showStatus(`✅ 步骤 2/3: 供货商"${channelName}"创建成功`, 'success');
    }
    
    // ✅ 修复：vendor_id 在 data 对象中，不是在响应根级别
    const vendorId = vendorResponse.data?.id;
    
    if (!vendorId) {
      showStatus('❌ 未能获取供货商 ID', 'error');
      hideProgress();
      return { success: false, error: '未能获取供货商 ID' };
    }
    
    showProgress(70, '步骤 2/3 完成');
    
    // 步骤5: 创建模型配置
    showStatus('🚀 步骤 3/3: 正在创建模型配置...', 'info');
    showProgress(80, '创建模型配置中...');
    
    // ✅ 修复：NewAPI 期望的字段名是 model_name，而不是 name
    // 添加 icon 字段（使用去掉斜杠的前缀）
    const modelIcon = normalizedPrefix.replace(/\/$/, '');
    const modelConfigData = {
      model_name: normalizedPrefix,
      name_rule: 1, // 前缀匹配
      vendor_id: vendorId,
      icon: modelIcon, // 模型图标（例如：yb）
      tags: channelTag  // ✅ 修复：字段名是 tags（复数），不是 tag
    };
    
    const createModelResult = await sendMessageWithRetry(tab.id, {
      action: 'createModel',
      modelData: modelConfigData
    });
    
    if (!createModelResult.success) {
      showStatus(`❌ 创建模型配置失败：${createModelResult.error}`, 'error');
      hideProgress();
      return { success: false, error: createModelResult.error };
    }
    
    const modelResponse = createModelResult.response;
    
    if (!modelResponse.success) {
      if (modelResponse.error && modelResponse.error.includes('已存在')) {
        showStatus('ℹ️ 模型配置已存在，跳过创建步骤', 'info');
      } else {
        showStatus(`❌ 创建模型配置失败：${modelResponse.error}`, 'error');
        hideProgress();
        return { success: false, error: modelResponse.error };
      }
    } else {
      showStatus(`✅ 步骤 3/3: 模型配置创建成功`, 'success');
    }
    
    showProgress(100, '✅ 自动配置完成');
    
    // 显示最终成功消息
    showStatus(
      `🎉 自动配置完成！\n\n` +
      `✅ 渠道：${channelName}\n` +
      `✅ 供货商：${channelName}\n` +
      `✅ 模型前缀：${normalizedPrefix}\n` +
      `✅ 标签：${channelTag}\n\n` +
      `💡 现在可以使用"智能同步"功能同步价格了`,
      'success'
    );
    
    // 刷新渠道列表
    setTimeout(() => {
      loadChannelList();
    }, 1000);
    
    hideProgress();
    
    return {
      success: true,
      channelName: channelName,
      vendorId: vendorId
    };
    
  } catch (error) {
    showStatus(`❌ 自动配置失败：${error.message}`, 'error');
    hideProgress();
    return { success: false, error: error.message };
  }
}

/**
 * 增强版智能同步（集成自动配置）
 */
async function performEnhancedSmartSync() {
  // 根据当前模式决定工作流程
  const isAutoMode = (currentMode === 'auto');
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  const channelId = channelSelect.value.trim();
  
  // 如果启用了自动配置且没有选择渠道
  if (autoConfigEnabled && !channelId && apiKey) {
    const confirmed = await showConfirmDialog({
      title: '🚀 一键自动配置',
      message: '检测到您启用了自动配置功能。\n\n将自动执行以下操作：\n1. 创建渠道\n2. 创建供货商\n3. 创建模型配置\n4. 同步模型列表\n5. 同步价格',
      info: [
        { label: '上游 URL', value: upstreamUrlInput.value.trim().substring(0, 40) + '...' },
        { label: '模型前缀', value: modelPrefixInput.value.trim() || '(无前缀)' },
        { label: '渠道标签', value: document.getElementById('channelTagInput').value.trim() || '公益' }
      ],
      confirmText: '开始自动配置',
      cancelText: '取消'
    });
    
    if (!confirmed) {
      return;
    }
    
    smartSyncBtn.disabled = true;
    smartSyncBtn.innerHTML = '<span class="spinner"></span>自动配置中...';
    
    // 执行自动配置
    const autoConfigResult = await performAutoConfiguration();
    
    if (!autoConfigResult.success) {
      smartSyncBtn.disabled = false;
      updateSmartSyncButton();
      return;
    }
    
    // 等待渠道列表刷新
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 自动配置成功后，继续执行完整同步
    smartSyncBtn.innerHTML = '<span class="spinner"></span>同步价格中...';
    await performCompleteSyncLogic();
    
  } else {
    // 原有逻辑：根据是否选择渠道决定同步模式
    const channelId = channelSelect.value.trim();
    
    if (channelId) {
      await performCompleteSyncLogic();
    } else {
      await performQuickUpdateLogic();
    }
  }
  
  // ✅ 修复：确保在所有路径下都恢复按钮状态
  smartSyncBtn.disabled = false;
  updateSmartSyncButton();
}

// 初始化：自动配置开关提示
document.addEventListener('DOMContentLoaded', () => {
  // 自动配置开关变化时更新提示
  const autoConfigToggle = document.getElementById('autoConfigToggle');
  const apiKeyInput = document.getElementById('apiKeyInput');
  
  if (autoConfigToggle && apiKeyInput) {
    autoConfigToggle.addEventListener('change', () => {
      if (autoConfigToggle.checked && !apiKeyInput.value.trim()) {
        showStatus('💡 提示：启用自动配置需要填写 API 密钥', 'info');
        setTimeout(() => {
          apiKeyInput.focus();
        }, 500);
      }
    });
  }
});

