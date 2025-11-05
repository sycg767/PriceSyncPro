// PriceSyncPro Extension - Popup Script
// 这个脚本运行在插件的弹出窗口中

let currentResults = null;
let currentApiUrl = '';
let presets = [];
let lastUsedConfig = null;

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
  
  // Ctrl+Enter 或 Cmd+Enter：快速更新
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!quickUpdateBtn.disabled) {
      quickUpdateBtn.click();
    }
  }
  
  // Ctrl+S 或 Cmd+S：保存预设
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (upstreamUrlInput.value.trim()) {
      savePresetBtn.click();
    }
  }
});

// DOM 元素
const analyzeBtn = document.getElementById('analyzeBtn');
const syncBtn = document.getElementById('syncBtn');
const exportSqlBtn = document.getElementById('exportSqlBtn');
const quickUpdateBtn = document.getElementById('quickUpdateBtn');
const upstreamUrlInput = document.getElementById('upstreamUrl');
const modelPrefixInput = document.getElementById('modelPrefix');
const presetSelect = document.getElementById('presetSelect');
const savePresetBtn = document.getElementById('savePresetBtn');

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
        const presetItem = document.createElement('div');
        presetItem.className = 'preset-item';
        presetItem.innerHTML = `
          <div class="preset-item-header">
            <span class="preset-item-name">${item.prefix || '(无前缀)'}</span>
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
        // ✅ 已登录 - 自动隐藏 Banner
        infoBannerText.innerHTML = '✅ 已连接到 New API 后台';
        infoBanner.style.background = 'rgba(52, 199, 89, 0.08)';
        infoBanner.style.color = '#34C759';
        
        // 1.5秒后自动淡出并隐藏
        setTimeout(() => {
          infoBanner.style.transition = 'opacity 0.4s ease';
          infoBanner.style.opacity = '0';
          setTimeout(() => {
            infoBanner.classList.add('hidden');
          }, 400);
        }, 1500);
      } else {
        // ❌ 未登录 - 显示警告提示
        infoBannerText.innerHTML = '⚠️ 请先登录 New API 后台，然后点击右上角刷新按钮';
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
    chrome.storage.local.get(['presets', 'lastUsedConfig'], (result) => {
      presets = result.presets || [];
      lastUsedConfig = result.lastUsedConfig || null;
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
  chrome.storage.local.set({ lastUsedConfig: lastUsedConfig });
  updateQuickUpdateButton();
}

/**
 * 渲染预设下拉列表
 * 将所有预设添加到下拉选择框中
 * @returns {void}
 */
function renderPresetSelect() {
  // 清空现有选项（保留第一个默认选项）
  presetSelect.innerHTML = '<option value="">-- 手动输入或选择预设 --</option>';
  
  // 添加预设选项
  presets.forEach((preset, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = preset.prefix || '(无前缀)';
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
    upstreamUrlInput.value = preset.url;
    modelPrefixInput.value = preset.prefix || '';
    showStatus(`✅ 已加载预设: ${preset.name}`, 'success');
    
    // 更新快速更新按钮状态
    updateQuickUpdateButton();
  }
});

// 监听输入框变化，实时更新快速更新按钮
upstreamUrlInput.addEventListener('input', updateQuickUpdateButton);
modelPrefixInput.addEventListener('input', updateQuickUpdateButton);

// 保存新预设
savePresetBtn.addEventListener('click', async () => {
  const url = upstreamUrlInput.value.trim();
  const prefix = modelPrefixInput.value.trim();
  
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
  
  // 添加新预设
  presets.push({
    name: name.trim(),
    url: url,
    prefix: prefix,
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
  
  // 更新预设
  presets[index] = {
    ...preset,
    name: result.name.trim(),
    url: result.url.trim(),
    prefix: result.prefix.trim(),
    updatedAt: Date.now()
  };
  
  savePresets();
  renderPresetSelect();
  showStatus(`✅ 已更新预设: ${result.name}`, 'success');
}

// 更新快速更新按钮状态
function updateQuickUpdateButton() {
  const url = upstreamUrlInput.value.trim();
  const prefix = modelPrefixInput.value.trim();
  
  if (url) {
    quickUpdateBtn.disabled = false;
    quickUpdateBtn.title = `使用当前配置快速更新: ${prefix || '无前缀'}`;
  } else {
    quickUpdateBtn.disabled = true;
    quickUpdateBtn.title = '请先输入上游定价 URL';
  }
}

// 快速更新按钮点击事件（使用当前配置：分析+自动同步）
quickUpdateBtn.addEventListener('click', async () => {
  const upstreamUrl = upstreamUrlInput.value.trim();
  const prefix = modelPrefixInput.value.trim();
  
  if (!upstreamUrl) {
    showStatus('⚠️ 请先输入上游定价 URL', 'error');
    return;
  }
  
  saveConfig();
  
  quickUpdateBtn.disabled = true;
  quickUpdateBtn.innerHTML = '<span class="loading"></span>快速更新中...';
  
  try {
    showStatus('⚡ 正在获取上游定价数据...', 'info');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 确保 content script 已加载
    const scriptReady = await ensureContentScript(tab.id);
    if (!scriptReady) {
      showStatus(
        '❌ 无法连接到页面脚本<br><br>' +
        '💡 <strong>解决方法：</strong><br>' +
        '1. 刷新当前页面（F5）<br>' +
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
      let statusMsg = `✅ 快速更新成功！<br><br>` +
        `📊 分析了 ${analyzeResponse.results.length} 个模型<br>` +
        `🚀 同步统计：<br>` +
        `• ModelPrice: ${syncResponse.stats.modelPriceCount} 个<br>` +
        `• ModelRatio: ${syncResponse.stats.modelRatioCount} 个<br>` +
        `• CompletionRatio: ${syncResponse.stats.completionRatioCount} 个`;
      
      showStatus(statusMsg, 'success');
      
      syncBtn.disabled = false;
      exportSqlBtn.disabled = false;
    } else {
      showStatus(`❌ 同步失败：${syncResponse.error}`, 'error');
    }
    
  } catch (error) {
    showStatus(`❌ 错误：${error.message}`, 'error');
  } finally {
    quickUpdateBtn.disabled = false;
    quickUpdateBtn.innerHTML = '<span class="btn-icon">⚡</span><span>快速更新（分析+同步）</span>';
  }
});

// 从 storage 加载保存的配置
chrome.storage.local.get(['upstreamUrl', 'modelPrefix'], (result) => {
  if (result.upstreamUrl) {
    upstreamUrlInput.value = result.upstreamUrl;
  }
  if (result.modelPrefix) {
    modelPrefixInput.value = result.modelPrefix;
  }
  
  // 加载预设和最后使用的配置
  loadPresets().then(() => {
    renderPresetSelect();
    updateQuickUpdateButton();
  });
  
  // 加载完配置后检测登录状态
  checkLoginStatus();
  
  // 初始化 URL 验证
  initUrlValidation();
});

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
    
    // 禁用同步和导出按钮
    syncBtn.disabled = true;
    exportSqlBtn.disabled = true;
    
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
      updateQuickUpdateButton();
      showStatus('✅ 已清空所有配置', 'success');
    });
  }
}

// 保存配置
function saveConfig() {
  chrome.storage.local.set({
    upstreamUrl: upstreamUrlInput.value.trim(),
    modelPrefix: modelPrefixInput.value.trim()
  });
}

// 显示状态消息
function showStatus(message, type = 'info') {
  statusDiv.className = `status-card show status-${type}`;
  statusDiv.innerHTML = message;
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
    
    // ✅ 显示价格（方便与上游对比）- 使用安全数值
    const inputPriceCell = document.createElement('td');
    inputPriceCell.className = 'price-cell';
    inputPriceCell.textContent = `$${safeInputPrice.toFixed(4)}`;
    inputPriceCell.title = `倍率: ${safeModelRatio.toFixed(4)}`;
    row.appendChild(inputPriceCell);
    
    // ✅ 显示价格（方便与上游对比）- 使用安全数值
    const outputPriceCell = document.createElement('td');
    outputPriceCell.className = 'price-cell';
    outputPriceCell.textContent = `$${safeOutputPrice.toFixed(4)}`;
    outputPriceCell.title = `倍率: ${safeCompletionRatio.toFixed(4)}`;
    row.appendChild(outputPriceCell);
    
    // 🚀 添加到 fragment 而不是直接添加到 DOM
    fragment.appendChild(row);
  });
  
  // 🚀 一次性批量插入所有行（触发一次重排）
  resultsTableBody.appendChild(fragment);
  
  // 显示结果区域
  resultsSection.classList.add('show');
}



// 分析上游价格
analyzeBtn.addEventListener('click', async () => {
  const upstreamUrl = upstreamUrlInput.value.trim();
  
  if (!upstreamUrl) {
    showStatus('⚠️ 请输入上游定价 URL', 'error');
    return;
  }

  saveConfig();

  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<span class="loading"></span>分析中...';

  try {
    showStatus('📡 正在连接页面...', 'info');

    // 向 content script 发送消息
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 确保 content script 已加载
    const scriptReady = await ensureContentScript(tab.id);
    if (!scriptReady) {
      showStatus(
        '❌ 无法连接到页面脚本<br><br>' +
        '💡 <strong>解决方法：</strong><br>' +
        '1. 刷新当前页面（F5）<br>' +
        '2. 重新打开此插件<br>' +
        '3. 确保在 New API 后台页面使用',
        'error'
      );
      return;
    }
    
    showStatus('📡 正在获取上游定价数据...', 'info');
    
    const result = await sendMessageWithRetry(tab.id, {
      action: 'analyzePricing',
      upstreamUrl: upstreamUrl
    });
    
    if (!result.success) {
      if (result.needRefresh) {
        showStatus(
          '❌ 连接页面失败<br><br>' +
          '💡 <strong>请刷新页面后重试：</strong><br>' +
          '1. 按 F5 刷新当前页面<br>' +
          '2. 重新打开此插件<br>' +
          '3. 点击"开始分析"按钮',
          'error'
        );
      } else {
        showStatus(`❌ 错误：${result.error}`, 'error');
      }
      return;
    }
    
    const response = result.response;

    if (response.success) {
      currentResults = response.results;
      currentApiUrl = response.apiUrl;
      
      // 保存为最后使用的配置
      const url = upstreamUrlInput.value.trim();
      const prefix = modelPrefixInput.value.trim();
      saveLastUsedConfig(url, prefix);
      
      // 渲染结果表格
      renderResultsTable(response.results, prefix);
      
      // 构建状态消息
      let statusMsg = `✅ 分析完成！共计算 ${response.results.length} 个模型`;
      
      if (response.basePrice > 0) {
        statusMsg += `<br>💰 基础价格: $${response.basePrice} (置信度: ${response.confidence}%)`;
      }
      
      if (response.stats) {
        statusMsg += `<br>📊 按次计费: ${response.stats.perUse} 个 | 按量计费: ${response.stats.usageBased} 个`;
      }
      
      showStatus(statusMsg, 'success');

      syncBtn.disabled = false;
      exportSqlBtn.disabled = false;
    } else {
      showStatus(`❌ 分析失败：${response.error}`, 'error');
      resultsSection.classList.remove('show');
    }
  } catch (error) {
    showStatus(`❌ 错误：${error.message}`, 'error');
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '🔍 开始分析上游价格';
  }
});

// 一键同步到后台
syncBtn.addEventListener('click', async () => {
  if (!currentResults || !currentApiUrl) {
    showStatus('⚠️ 请先完成价格分析', 'error');
    return;
  }

  const prefix = modelPrefixInput.value.trim();
  
  // 统计信息
  const perUseCount = currentResults.filter(r => r.quotaType === 1).length;
  const usageBasedCount = currentResults.filter(r => r.quotaType === 0).length;

  // 显示自定义确认对话框
  const confirmed = await showConfirmDialog({
    title: '🚀 确认同步到后台',
    message: '即将同步价格配置到 New API 后台系统',
    info: [
      { label: '模型总数', value: `${currentResults.length} 个` },
      { label: '按次计费', value: `${perUseCount} 个` },
      { label: '按量计费', value: `${usageBasedCount} 个` },
      { label: '模型前缀', value: prefix || '(无前缀)' }
    ],
    confirmText: '确认同步',
    cancelText: '取消'
  });

  if (!confirmed) {
    return;
  }

  syncBtn.disabled = true;
  syncBtn.innerHTML = '<span class="loading"></span>同步中...';

  try {
    showStatus('🔄 正在同步配置到后台...', 'info');

    // 向 content script 发送消息
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const result = await sendMessageWithRetry(tab.id, {
      action: 'syncToBackend',
      results: currentResults,
      apiUrl: currentApiUrl,
      prefix: prefix
    });
    
    if (!result.success) {
      if (result.needRefresh) {
        showStatus(
          '❌ 连接页面失败<br><br>' +
          '💡 <strong>请刷新页面后重试：</strong><br>' +
          '1. 按 F5 刷新当前页面<br>' +
          '2. 重新打开此插件<br>' +
          '3. 重新点击同步按钮',
          'error'
        );
      } else {
        showStatus(`❌ 错误：${result.error}`, 'error');
      }
      return;
    }
    
    const response = result.response;

    if (response.success) {
      let statusMsg = `✅ 同步成功！<br><br>` +
        `📊 更新统计：<br>` +
        `• ModelPrice: ${response.stats.modelPriceCount} 个<br>` +
        `• ModelRatio: ${response.stats.modelRatioCount} 个<br>` +
        `• CompletionRatio: ${response.stats.completionRatioCount} 个`;
      
      showStatus(statusMsg, 'success');
      
      // 🎯 自动保存为预设（如果还未保存）
      const url = upstreamUrlInput.value.trim();
      const currentPrefix = modelPrefixInput.value.trim();
      const existingIndex = presets.findIndex(p => p.url === url && p.prefix === currentPrefix);
      
      if (existingIndex === -1) {
        // 配置不存在，自动保存
        const autoName = currentPrefix ? `${currentPrefix}配置` : `默认配置`;
        presets.push({
          name: autoName,
          url: url,
          prefix: currentPrefix,
          createdAt: Date.now(),
          autoSaved: true
        });
        savePresets();
        renderPresetSelect();
        
        // 更新状态提示
        setTimeout(() => {
          showStatus(
            statusMsg + '<br><br>💾 已自动保存为预设：' + autoName,
            'success'
          );
        }, 100);
      }
    } else {
      showStatus(`❌ 同步失败：${response.error}`, 'error');
    }
  } catch (error) {
    showStatus(`❌ 错误：${error.message}`, 'error');
  } finally {
    syncBtn.disabled = false;
    syncBtn.innerHTML = '🚀 一键同步到后台';
  }
});

// 生成并复制 SQL
exportSqlBtn.addEventListener('click', async () => {
  if (!currentResults) {
    showStatus('⚠️ 请先完成价格分析', 'error');
    return;
  }

  const prefix = modelPrefixInput.value.trim();

  try {
    // 向 content script 发送消息
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const result = await sendMessageWithRetry(tab.id, {
      action: 'generateSQL',
      results: currentResults,
      prefix: prefix
    });
    
    if (!result.success) {
      if (result.needRefresh) {
        showStatus(
          '❌ 连接页面失败<br><br>' +
          '💡 <strong>请刷新页面后重试</strong>',
          'error'
        );
      } else {
        showStatus(`❌ 错误：${result.error}`, 'error');
      }
      return;
    }
    
    const response = result.response;

    if (response.success) {
      // 复制到剪贴板
      await navigator.clipboard.writeText(response.sql);
      
      showStatus(
        `✅ SQL 已生成并复制到剪贴板！<br><br>` +
        `📊 统计：<br>` +
        `• ModelPrice: ${response.stats.modelPriceCount} 个<br>` +
        `• ModelRatio: ${response.stats.modelRatioCount} 个<br>` +
        `• CompletionRatio: ${response.stats.completionRatioCount} 个`,
        'success'
      );
    } else {
      showStatus(`❌ 生成失败：${response.error}`, 'error');
    }
  } catch (error) {
    showStatus(`❌ 错误：${error.message}`, 'error');
  }
});