
const NS_PREFIX = 'ns_';
const UNIFIED_PROFILE_KEY = 'ns_ai_user_profile';
const ALT_PROFILE_KEY = 'ns_test_user_profile';
const PROFILE_KEYS = ['info', 'scores', 'hobbies', 'personalityAnswers', 'personalityCustomAnswers', 'customPersonalityAnswers', 'personalitySelfReflect', 'mbtiType', 'mbtiData', 'riasecScores', 'riasecTopCode', 'techOrientation', 'choicePressure', 'goals'];

/**
 * Đồng bộ toàn bộ dữ liệu 5 bước vào 1 object JSON duy nhất trong LocalStorage: 'ns_ai_user_profile'
 */
function syncUnifiedProfile(updatedKey, updatedValue) {
  try {
    let profile = {};
    const raw = localStorage.getItem(UNIFIED_PROFILE_KEY) || localStorage.getItem(ALT_PROFILE_KEY);
    if (raw) {
      try { profile = JSON.parse(raw) || {}; } catch (e) {}
    }
    if (!profile.info) profile.info = {};
    if (!profile.scores) profile.scores = {};
    if (!profile.hobbies) profile.hobbies = { selected: [], custom: '' };
    if (!profile.personality) profile.personality = { answers: [], customAnswers: {}, customPersonalityAnswers: [], selfReflect: {}, mbtiType: null, mbtiData: null };
    if (!profile.goals) profile.goals = { selected: [], admissionMethods: [], other: '' };

    if (updatedKey === 'info') profile.info = updatedValue;
    else if (updatedKey === 'scores') profile.scores = updatedValue;
    else if (updatedKey === 'hobbies') profile.hobbies = updatedValue;
    else if (updatedKey === 'personalityAnswers') profile.personality.answers = updatedValue;
    else if (updatedKey === 'personalityCustomAnswers') profile.personality.customAnswers = updatedValue;
    else if (updatedKey === 'customPersonalityAnswers') profile.personality.customPersonalityAnswers = updatedValue;
    else if (updatedKey === 'personalitySelfReflect') profile.personality.selfReflect = updatedValue;
    else if (updatedKey === 'mbtiType') profile.personality.mbtiType = updatedValue;
    else if (updatedKey === 'mbtiData') profile.personality.mbtiData = updatedValue;
    else if (updatedKey === 'riasecScores') profile.personality.riasecScores = updatedValue;
    else if (updatedKey === 'riasecTopCode') profile.personality.riasecTopCode = updatedValue;
    else if (updatedKey === 'techOrientation') profile.personality.techOrientation = updatedValue;
    else if (updatedKey === 'choicePressure') profile.personality.choicePressure = updatedValue;
    else if (updatedKey === 'goals') profile.goals = updatedValue;

    profile.lastUpdated = new Date().toISOString();
    const jsonStr = JSON.stringify(profile);
    localStorage.setItem(UNIFIED_PROFILE_KEY, jsonStr);
    localStorage.setItem(ALT_PROFILE_KEY, jsonStr);
    return profile;
  } catch (err) {
    console.error('Lỗi khi đồng bộ ns_ai_user_profile:', err);
  }
}

/**
 * Lấy object hồ sơ tổng hợp từ LocalStorage
 */
function getUnifiedProfile() {
  try {
    const raw = localStorage.getItem(UNIFIED_PROFILE_KEY) || localStorage.getItem(ALT_PROFILE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === 'object') return p;
    }
  } catch (e) {}

  // Fallback cấu trúc từ các key riêng lẻ nếu có
  return {
    info: read('info') || {},
    scores: read('scores') || {},
    hobbies: read('hobbies') || { selected: [], custom: '' },
    personality: {
      answers: read('personalityAnswers') || [],
      customAnswers: read('personalityCustomAnswers') || {},
      selfReflect: read('personalitySelfReflect') || { strengths: '', idealEnv: '', vision: '' },
      mbtiType: read('mbtiType') || null,
      mbtiData: read('mbtiData') || null
    },
    goals: read('goals') || { selected: [], admissionMethods: [], other: '' },
    lastUpdated: new Date().toISOString()
  };
}

function save(key, value, syncToAccount = true) {
  try {
    localStorage.setItem(NS_PREFIX + key, JSON.stringify(value));
    
    // Đồng bộ vào một object JSON thống nhất 'ns_ai_user_profile'
    syncUnifiedProfile(key, value);

    if (syncToAccount && PROFILE_KEYS.includes(key)) {
      syncCurrentProfileToAccount();
    }
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

function read(key) {
  try {
    // 1. Thử lấy từ object hồ sơ thống nhất ns_ai_user_profile
    const rawUnified = localStorage.getItem(UNIFIED_PROFILE_KEY) || localStorage.getItem(ALT_PROFILE_KEY);
    if (rawUnified) {
      const u = JSON.parse(rawUnified);
      if (u) {
        if (key === 'info' && u.info) return u.info;
        if (key === 'scores' && u.scores) return u.scores;
        if (key === 'hobbies' && u.hobbies) return u.hobbies;
        if (key === 'personalityAnswers' && u.personality && u.personality.answers) return u.personality.answers;
        if (key === 'personalityCustomAnswers' && u.personality && u.personality.customAnswers) return u.personality.customAnswers;
        if (key === 'customPersonalityAnswers' && u.personality && u.personality.customPersonalityAnswers) return u.personality.customPersonalityAnswers;
        if (key === 'personalitySelfReflect' && u.personality && u.personality.selfReflect) return u.personality.selfReflect;
        if (key === 'mbtiType' && u.personality && u.personality.mbtiType) return u.personality.mbtiType;
        if (key === 'mbtiData' && u.personality && u.personality.mbtiData) return u.personality.mbtiData;
        if (key === 'riasecScores' && u.personality && u.personality.riasecScores) return u.personality.riasecScores;
        if (key === 'riasecTopCode' && u.personality && u.personality.riasecTopCode) return u.personality.riasecTopCode;
        if (key === 'techOrientation' && u.personality && u.personality.techOrientation) return u.personality.techOrientation;
        if (key === 'choicePressure' && u.personality && u.personality.choicePressure) return u.personality.choicePressure;
        if (key === 'goals' && u.goals) return u.goals;
      }
    }
    // 2. Fallback sang key riêng lẻ (NS_PREFIX + key)
    return JSON.parse(localStorage.getItem(NS_PREFIX + key));
  } catch (e) {
    return null;
  }
}

/**
 * Điền nhanh dữ liệu mẫu cho Bước 1 (Thông tin) phục vụ test nhanh cho Giám Khảo
 */
function fillDemoInfo() {
  const nameInput = document.getElementById('studentName');
  const provinceSelect = document.getElementById('province');
  const gradeSelect = document.getElementById('grade');

  if (nameInput) nameInput.value = 'Minh Khang';
  if (provinceSelect) provinceSelect.value = 'Hà Nội';
  if (gradeSelect) gradeSelect.value = '12';

  save('info', {
    name: 'Minh Khang',
    province: 'Hà Nội',
    grade: '12'
  });

  const banner = document.getElementById('demoAlertBanner');
  if (banner) {
    banner.style.display = 'block';
    banner.innerHTML = '✅ <strong>Đã điền nhanh thông tin mẫu (Minh Khang - Hà Nội - Lớp 12)!</strong> Bạn có thể bấm <strong>"Lưu & tiếp tục →"</strong> để chuyển sang Bước 2, hoặc bấm <strong>"⚡ Xem thử toàn bộ hồ sơ mẫu"</strong> để sang thẳng trang Kết quả.';
  }
}

function resetAllData(showMessage = true) {
  const preservedKeys = ['ns_accounts', 'ns_current_user', 'ns_chat_sessions', 'ns_current_chat_id', 'ns_topbar_collapsed'];
  Object.keys(localStorage)
    .filter(k => k.startsWith(NS_PREFIX) && !preservedKeys.includes(k))
    .forEach(k => localStorage.removeItem(k));

  // Nếu người dùng đang đăng nhập, làm mới luôn hồ sơ trong tài khoản
  const current = getCurrentUser();
  if (current) {
    const accounts = getAllAccounts();
    const acc = getAccount(current);
    if (acc) {
      acc.profile = {};
      acc.updatedAt = new Date().toISOString();
      accounts[acc.username] = acc;
      saveAccountsMap(accounts);
    }
  }

  if (showMessage) {
    alert('Đã tạo phiên mới. Dữ liệu phân tích đã được làm mới.');
    location.href = 'index.html';
  }
}

/**
 * Nạp bộ dữ liệu mẫu chuẩn (Dành cho Ban Giám Khảo & Trải nghiệm nhanh)
 * Bao gồm đầy đủ 5 trụ cột: Thông tin, Điểm số, Sở thích, Tính cách MBTI, Mục tiêu
 */
function loadDemoDataAndRedirect() {
  // 1. Thông tin cơ bản
  save('info', {
    name: 'Minh Khang',
    province: 'Hà Nội',
    grade: '12'
  });

  // 2. Điểm số các môn học thế mạnh (Toán, Lý, Hóa, Tin, Anh, Công nghệ)
  save('scores', {
    'Toán': 9.2,
    'Vật lý': 8.8,
    'Hóa học': 8.0,
    'Tin học': 9.6,
    'Tiếng Anh': 8.5,
    'Ngữ văn': 7.8,
    'Công nghệ công nghiệp': 9.0
  });

  // 3. Sở thích & Đam mê tự nhiên
  save('hobbies', {
    selected: [
      'Lập trình & Phát triển phần mềm',
      'Trí tuệ nhân tạo & Dữ liệu',
      'Phần cứng & Vi mạch máy tính',
      'Robot & Tự động hóa',
      'Thiết kế đồ họa & Mỹ thuật số'
    ],
    custom: 'Đam mê lập trình phát triển ứng dụng, thuật toán AI và chế tạo robot thông minh'
  });

  // 4. Trắc nghiệm tính cách MBTI & Phản hồi tự bộc lộ (Nhóm INTJ - Nhà Kiến Tạo)
  const demoAnswers = [0, 1, 0, 0, 0, 1, 0, 0, 0, 0];
  save('personalityAnswers', demoAnswers);
  save('personalityCustomAnswers', {});
  save('personalitySelfReflect', {
    strengths: 'Tư duy logic, giải quyết vấn đề kỹ thuật và phân tích thuật toán',
    idealEnv: 'Môi trường công nghệ hiện đại, tự do sáng tạo và làm việc nhóm hiệu quả',
    vision: 'Trở thành Kỹ sư Công nghệ thông tin / Chuyên gia Trí tuệ nhân tạo (AI)'
  });
  save('mbtiType', 'INTJ');
  save('mbtiData', {
    type: 'INTJ',
    title: 'Nhà Kiến Tạo Chiến Lược',
    vietnameseTrait: 'Tư duy logic, chiến lược & độc lập',
    desc: 'Bạn có tầm nhìn sắc bén, tư duy hệ thống và khả năng giải quyết các vấn đề kỹ thuật phức tạp.'
  });

  // 5. Mục tiêu cá nhân & Nguyện vọng
  save('goals', {
    dreamMajor: 'Công nghệ thông tin',
    dreamCareer: 'Kỹ sư phần mềm & Trí tuệ nhân tạo (AI)',
    dreamSchool: 'Đại học Bách Khoa Hà Nội',
    studyLocation: 'Miền Bắc',
    studyAbroad: 'Chưa có ý định',
    dreamGoal: 'Xây dựng các giải pháp phần mềm thông minh phục vụ cộng đồng',
    admissionMethods: ['thpt', 'dgnl', 'ielts'],
    selected: [
      'Công nghệ thông tin & Lập trình phần mềm',
      'Khoa học máy tính & Trí tuệ nhân tạo (AI)'
    ],
    other: ''
  });

  // Chuyển hướng thẳng sang trang kết quả phân tích
  window.location.href = 'ketqua.html';
}

// =================== HỆ THỐNG TÀI KHOẢN & LƯU HỒ SƠ ===================
function getAllAccounts() {
  try {
    const raw = localStorage.getItem('ns_accounts');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveAccountsMap(map) {
  try {
    localStorage.setItem('ns_accounts', JSON.stringify(map));
  } catch (e) {
    console.error('Error saving accounts map:', e);
  }
}

function getCurrentUser() {
  try {
    return localStorage.getItem('ns_current_user') || null;
  } catch (e) {
    return null;
  }
}

function getAccount(username) {
  if (!username) return null;
  const accounts = getAllAccounts();
  const searchName = username.trim().toLowerCase();
  for (const key of Object.keys(accounts)) {
    if (key.toLowerCase() === searchName) {
      return accounts[key];
    }
  }
  return null;
}

function syncCurrentProfileToAccount() {
  const current = getCurrentUser();
  if (!current) return;
  const accounts = getAllAccounts();
  const acc = getAccount(current);
  if (!acc) return;

  if (!acc.profile) acc.profile = {};
  PROFILE_KEYS.forEach(k => {
    const val = read(k);
    if (val !== null && val !== undefined) {
      acc.profile[k] = val;
    }
  });
  acc.updatedAt = new Date().toISOString();
  accounts[acc.username] = acc;
  saveAccountsMap(accounts);
}

// ĐĂNG KÝ: CHỈ CẦN TÊN ĐĂNG NHẬP VÀ MẬT KHẨU
function registerUser(username, password) {
  username = (username || '').trim();
  password = (password || '').trim();

  if (!username) {
    return { success: false, message: 'Vui lòng nhập tên đăng nhập.' };
  }
  if (username.length < 3) {
    return { success: false, message: 'Tên đăng nhập cần ít nhất 3 ký tự.' };
  }
  if (!password) {
    return { success: false, message: 'Vui lòng nhập mật khẩu.' };
  }
  if (password.length < 3) {
    return { success: false, message: 'Mật khẩu cần ít nhất 3 ký tự.' };
  }

  const accounts = getAllAccounts();
  if (getAccount(username)) {
    return { success: false, message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' };
  }

  // Tự động sao chép hồ sơ phân tích hiện tại (nếu có) vào tài khoản mới
  const currentProfile = {};
  PROFILE_KEYS.forEach(k => {
    const val = read(k);
    if (val !== null && val !== undefined) {
      currentProfile[k] = val;
    }
  });

  accounts[username] = {
    username: username,
    password: password,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profile: currentProfile
  };

  saveAccountsMap(accounts);
  localStorage.setItem('ns_current_user', username);

  return {
    success: true,
    message: 'Đăng ký thành công! Toàn bộ kết quả phân tích hiện tại đã được tự động lưu vào tài khoản.',
    username: username
  };
}

// ĐĂNG NHẬP
function loginUser(username, password) {
  username = (username || '').trim();
  password = (password || '').trim();

  if (!username || !password) {
    return { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' };
  }

  const acc = getAccount(username);
  if (!acc || acc.password !== password) {
    return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
  }

  // Lưu trạng thái đăng nhập
  localStorage.setItem('ns_current_user', acc.username);

  // Nạp lại hồ sơ đã lưu từ tài khoản vào phiên làm việc hiện tại
  if (acc.profile) {
    PROFILE_KEYS.forEach(k => {
      if (acc.profile[k] !== undefined) {
        save(k, acc.profile[k], false);
      } else {
        localStorage.removeItem(NS_PREFIX + k);
      }
    });
  }

  return {
    success: true,
    message: 'Đăng nhập thành công! Đã nạp lại hồ sơ phân tích của bạn.',
    username: acc.username
  };
}

// ĐĂNG XUẤT
function logoutUser() {
  const current = getCurrentUser();
  if (confirm(current ? `Bạn có chắc chắn muốn đăng xuất khỏi tài khoản "${current}"?` : 'Bạn có muốn đăng xuất?')) {
    localStorage.removeItem('ns_current_user');
    // Xóa session phân tích đang mở để đảm bảo tính riêng tư
    PROFILE_KEYS.forEach(k => localStorage.removeItem(NS_PREFIX + k));
    location.reload();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Hiển thị trạng thái tài khoản trên Topbar
function renderAuthTopbar() {
  const nav = document.querySelector('.topbar nav');
  if (!nav) return;

  const oldItem = nav.querySelector('.auth-nav-item');
  if (oldItem) oldItem.remove();
  const staticLink = nav.querySelector('.nav-auth-static');
  if (staticLink) staticLink.remove();

  const current = getCurrentUser();
  const authContainer = document.createElement('div');
  authContainer.className = 'auth-nav-item';

  const pathname = window.location.pathname.toLowerCase();
  const isDangNhap = pathname.endsWith('dangnhap.html') || pathname.endsWith('dang-nhap.html');

  if (current) {
    authContainer.innerHTML = `
      <a href="dangnhap.html" class="user-badge ${isDangNhap ? 'active' : ''}" title="Tài khoản đang đăng nhập">
        <span class="user-avatar-icon">👤</span>
        <span class="user-name-text">${escapeHtml(current)}</span>
      </a>
      <button type="button" class="auth-logout-btn" onclick="logoutUser()" title="Đăng xuất khỏi tài khoản">Đăng xuất</button>
    `;
  } else {
    authContainer.innerHTML = `
      <a href="dangnhap.html" class="auth-login-link ${isDangNhap ? 'active' : ''}" title="Đăng nhập để lưu kết quả">
        <span>🔑</span> Đăng nhập
      </a>
    `;
  }

  const resetBtn = nav.querySelector('.session-reset');
  if (resetBtn) {
    nav.insertBefore(authContainer, resetBtn);
  } else {
    nav.appendChild(authContainer);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderAuthTopbar);
} else {
  renderAuthTopbar();
}

// Tự động dọn dẹp dữ liệu trắc nghiệm tính cách không hợp lệ (ví dụ: mảng chữ cái demo cũ)
(function sanitizePersonalityData() {
  try {
    const rawAnswers = read('personalityAnswers');
    if (rawAnswers) {
      // Nếu dữ liệu không phải mảng, không đủ 10 câu hoặc có chứa phần tử không phải số 0-4 (như 'A', 'B' từ dữ liệu demo cũ)
      if (!Array.isArray(rawAnswers) || rawAnswers.length < 10 || rawAnswers.some(a => typeof a !== 'number' || a < 0 || a > 4)) {
        localStorage.removeItem(NS_PREFIX + 'personalityAnswers');
        localStorage.removeItem(NS_PREFIX + 'mbtiType');
        localStorage.removeItem(NS_PREFIX + 'mbtiData');
        localStorage.removeItem(NS_PREFIX + 'personalityCustomAnswers');
        
        // Dọn dẹp trong object tổng hợp nếu có
        const rawUnified = localStorage.getItem(UNIFIED_PROFILE_KEY);
        if (rawUnified) {
          try {
            const u = JSON.parse(rawUnified);
            if (u && u.personality) {
              u.personality.answers = [];
              u.personality.customAnswers = {};
              u.personality.mbtiType = null;
              u.personality.mbtiData = null;
              const updated = JSON.stringify(u);
              localStorage.setItem(UNIFIED_PROFILE_KEY, updated);
              localStorage.setItem(ALT_PROFILE_KEY, updated);
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
})();

// Kiểm tra dữ liệu thực tế đã hoàn thành cho từng bước
function isStepCompleted(stepNum) {
  try {
    switch (stepNum) {
      case 1: { // Bước 1: Thông tin
        const info = read('info');
        // Phải chọn tỉnh/thành phố hợp lệ
        return !!(info && info.province && String(info.province).trim() !== '');
      }
      case 2: { // Bước 2: Điểm số
        const scores = read('scores');
        if (!scores || typeof scores !== 'object') return false;
        // Điểm số hoàn thành khi người dùng đã nhập ít nhất 3 môn học hợp lệ > 0
        const validScores = Object.values(scores).filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
        return validScores.length >= 3;
      }
      case 3: { // Bước 3: Sở thích
        const hobbies = read('hobbies');
        if (!hobbies || typeof hobbies !== 'object') return false;
        const hasSelected = Array.isArray(hobbies.selected) && hobbies.selected.length >= 1;
        const hasCustom = typeof hobbies.custom === 'string' && hobbies.custom.trim().length > 0;
        return hasSelected || hasCustom;
      }
      case 4: { // Bước 4: Tính cách
        const answers = read('personalityAnswers');
        // Phải trả lời đầy đủ 12 câu trắc nghiệm tình huống & kỷ nguyên số (chỉ mục 0 đến 4)
        if (!Array.isArray(answers) || answers.length < 12) return false;
        const validAnswers = answers.filter(a => typeof a === 'number' && a >= 0 && a <= 4);
        if (validAnswers.length < 12) return false;

        // Nếu có câu nào chọn đáp án 4 (E - Khác), bắt buộc phải có nội dung nhập tự luận
        const customAnswers = read('personalityCustomAnswers') || {};
        for (let i = 0; i < answers.length; i++) {
          if (answers[i] === 4) {
            const txt = customAnswers[i] || '';
            if (!txt || !String(txt).trim()) return false;
          }
        }

        // Bắt buộc phải có kết quả phân loại MBTI hợp lệ (4 ký tự chữ cái)
        const mbti = read('mbtiType');
        return typeof mbti === 'string' && mbti.trim().length === 4;
      }
      case 5: { // Bước 5: Mục tiêu
        const goals = read('goals');
        if (!goals || typeof goals !== 'object') return false;
        const hasSelected = Array.isArray(goals.selected) && goals.selected.length >= 1;
        const hasMajor = typeof goals.dreamMajor === 'string' && goals.dreamMajor.trim().length > 0;
        const hasCareer = typeof goals.dreamCareer === 'string' && goals.dreamCareer.trim().length > 0;
        const hasSchool = typeof goals.dreamSchool === 'string' && goals.dreamSchool.trim().length > 0;
        const hasLoc = typeof goals.studyLocation === 'string' && goals.studyLocation.trim().length > 0;
        const hasDream = typeof goals.dreamGoal === 'string' && goals.dreamGoal.trim().length > 0;
        return hasSelected || hasMajor || hasCareer || hasSchool || hasLoc || hasDream;
      }
      case 6: { // Bước 6: Kết quả
        // Trang kết quả chỉ xem là hoàn thành khi các bước nền tảng cốt lõi đã hoàn tất
        return isStepCompleted(1) && isStepCompleted(2) && isStepCompleted(3);
      }
      default:
        return false;
    }
  } catch (e) {
    return false;
  }
}

// Hiển thị thanh tiến trình 6 bước định hướng (Stepper trực quan & hài hòa)
function renderOrientationStepper() {
  const pathname = window.location.pathname.toLowerCase();
  const stepMap = [
    { page: 'thongtin.html', alt: 'thong-tin.html', step: 1, label: 'Thông tin' },
    { page: 'diemso.html', alt: 'diem-so.html', step: 2, label: 'Điểm số' },
    { page: 'sothich.html', alt: 'so-thich.html', step: 3, label: 'Sở thích' },
    { page: 'tinhcach.html', alt: 'tinh-cach.html', step: 4, label: 'Tính cách' },
    { page: 'muc-tieu.html', alt: 'muctieu.html', step: 5, label: 'Mục tiêu' },
    { page: 'ketqua.html', alt: 'ket-qua.html', step: 6, label: 'Kết quả' }
  ];

  const matched = stepMap.find(s => pathname.endsWith(s.page) || pathname.endsWith(s.alt));
  if (!matched) return;

  const currentStep = matched.step;
  const mainEl = document.querySelector('main.page');
  if (!mainEl) return;

  if (mainEl.querySelector('.orientation-stepper')) return;

  const stepperNav = document.createElement('nav');
  stepperNav.className = 'orientation-stepper';
  stepperNav.setAttribute('aria-label', 'Tiến trình các bước định hướng');

  let html = '<div class="stepper-container">';
  stepMap.forEach((item, idx) => {
    const isDone = isStepCompleted(item.step);
    const isActive = item.step === currentStep;

    let itemClass = 'step-item';
    if (isActive) {
      itemClass += ' active';
    } else if (isDone) {
      itemClass += ' completed';
    }

    // Chỉ hiển thị dấu tích ✓ khi ĐÃ THỰC SỰ HOÀN THÀNH dữ liệu và không phải trang hiện tại.
    // Nếu chưa hoàn thành: hiển thị số thứ tự bước (1, 2, 3...)
    const numDisplay = (!isActive && isDone) ? '✓' : item.step;

    html += `
      <a href="${item.page}" class="${itemClass}" title="Bước ${item.step}: ${item.label} (${isDone ? 'Đã hoàn thành' : 'Chưa nhập dữ liệu'})">
        <span class="step-num">${numDisplay}</span>
        <span class="step-label">${item.label}</span>
      </a>
    `;

    if (idx < stepMap.length - 1) {
      // Đường nối chỉ đổi màu sáng xanh khi bước đó đã thực sự hoàn thành
      const lineClass = isDone ? 'step-line filled' : 'step-line';
      html += `<div class="${lineClass}"></div>`;
    }
  });
  html += '</div>';

  stepperNav.innerHTML = html;
  mainEl.insertBefore(stepperNav, mainEl.firstChild);
}

// Thông báo Toast nhỏ nhắn, tinh tế thay cho alert thô cứng
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Quản lý thu gọn / mở rộng thanh Topbar điều hướng
function isTopbarCollapsed() {
  try {
    const saved = localStorage.getItem('ns_topbar_collapsed');
    // Mặc định ban đầu luôn là thu gọn sẵn
    if (saved === null) return true;
    return saved === 'true';
  } catch (e) {
    return true;
  }
}

function setTopbarCollapsed(collapsed) {
  try {
    localStorage.setItem('ns_topbar_collapsed', collapsed ? 'true' : 'false');
  } catch (e) {}
}

function updateTopbarUI(collapsed) {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  const nav = topbar.querySelector('nav');
  const btn = document.getElementById('btnToggleTopbar');
  const badge = topbar.querySelector('.topbar-current-badge');

  if (collapsed) {
    topbar.classList.add('topbar-collapsed');
    if (nav) nav.classList.add('nav-collapsed');
    if (btn) {
      btn.classList.add('btn-collapsed');
      btn.title = 'Mở rộng thanh điều hướng';
      btn.setAttribute('aria-expanded', 'false');
      const icon = btn.querySelector('.btn-toggle-icon');
      const text = btn.querySelector('.btn-toggle-text');
      if (icon && text) {
        icon.textContent = '☰';
        text.textContent = 'Menu';
      } else {
        btn.innerHTML = '<span class="btn-toggle-icon">☰</span> <span class="btn-toggle-text">Menu</span>';
      }
    }
    if (badge) badge.style.display = 'inline-flex';
  } else {
    topbar.classList.remove('topbar-collapsed');
    if (nav) nav.classList.remove('nav-collapsed');
    if (btn) {
      btn.classList.remove('btn-collapsed');
      btn.title = 'Thu gọn thanh điều hướng';
      btn.setAttribute('aria-expanded', 'true');
      const icon = btn.querySelector('.btn-toggle-icon');
      const text = btn.querySelector('.btn-toggle-text');
      if (icon && text) {
        icon.textContent = '▴';
        text.textContent = 'Thu gọn';
      } else {
        btn.innerHTML = '<span class="btn-toggle-icon">▴</span> <span class="btn-toggle-text">Thu gọn</span>';
      }
    }
    if (badge) badge.style.display = 'none';
  }
}

function toggleTopbarNav(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
  }
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  const isCurrentlyCollapsed = topbar.classList.contains('topbar-collapsed');
  const next = !isCurrentlyCollapsed;
  setTopbarCollapsed(next);
  updateTopbarUI(next);
}

function initCollapsibleTopbar() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  const nav = topbar.querySelector('nav');
  if (!nav) return;

  // Nếu nút đã tồn tại, không tạo lại để tránh ghi đè thao tác của người dùng
  if (document.getElementById('btnToggleTopbar')) {
    return;
  }

  // Xác định nhãn trang hiện tại
  let pageTitle = 'Trang chủ';
  const activeLink = nav.querySelector('a.active');
  if (activeLink) {
    pageTitle = activeLink.textContent.trim();
  } else {
    const p = window.location.pathname.toLowerCase();
    if (p.includes('thongtin') || p.includes('thong-tin')) pageTitle = 'Thông tin';
    else if (p.includes('diemso') || p.includes('diem-so')) pageTitle = 'Điểm số';
    else if (p.includes('sothich') || p.includes('so-thich')) pageTitle = 'Sở thích';
    else if (p.includes('tinhcach') || p.includes('tinh-cach')) pageTitle = 'Tính cách';
    else if (p.includes('muc-tieu') || p.includes('muctieu')) pageTitle = 'Mục tiêu';
    else if (p.includes('truong-hoc') || p.includes('truonghoc')) pageTitle = 'Trường học';
    else if (p.includes('ketqua') || p.includes('ket-qua')) pageTitle = 'Kết quả';
    else if (p.includes('chatbot')) pageTitle = 'Chatbot';
    else if (p.includes('dangnhap') || p.includes('dang-nhap')) pageTitle = 'Đăng nhập';
  }

  const toggleWrap = document.createElement('div');
  toggleWrap.className = 'topbar-toggle-wrap';
  toggleWrap.innerHTML = `
    <span class="topbar-current-badge" style="display: none;">📍 ${escapeHtml(pageTitle)}</span>
    <button type="button" id="btnToggleTopbar" class="btn-toggle-topbar" onclick="toggleTopbarNav(event)" title="Thu gọn thanh điều hướng" aria-label="Thu gọn hoặc mở rộng thanh điều hướng" aria-expanded="false">
      <span class="btn-toggle-icon">▴</span>
      <span class="btn-toggle-text">Thu gọn</span>
    </button>
  `;

  topbar.appendChild(toggleWrap);

  const btn = document.getElementById('btnToggleTopbar');
  if (btn) {
    btn.addEventListener('click', toggleTopbarNav);
  }

  // Khi click vào bất kỳ liên kết nào trong menu -> tự động chuyển về thu gọn sẵn cho trang tiếp theo
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      setTopbarCollapsed(true);
    });
  });

  // Áp dụng trạng thái thu gọn mặc định
  updateTopbarUI(isTopbarCollapsed());
}

// Khi xoay dọc hoặc resize màn hình về dạng dọc: tự động thu gọn nếu đang mở
let lastViewportWidth = window.innerWidth;
function handleTopbarResize() {
  if (Math.abs(window.innerWidth - lastViewportWidth) > 50) {
    lastViewportWidth = window.innerWidth;
    if (window.innerWidth <= 992) {
      updateTopbarUI(true);
    }
  }
}
window.addEventListener('resize', handleTopbarResize);
window.addEventListener('orientationchange', () => {
  if (window.innerWidth <= 992) {
    updateTopbarUI(true);
  }
});

// Khi click ra ngoài topbar: tự động thu gọn lại nếu đang mở
document.addEventListener('click', (e) => {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  if (!topbar.classList.contains('topbar-collapsed')) {
    const path = (e.composedPath && e.composedPath()) || [];
    const isInside = path.includes(topbar) || topbar.contains(e.target);
    if (!isInside) {
      setTopbarCollapsed(true);
      updateTopbarUI(true);
    }
  }
});

function initMainComponents() {
  renderAuthTopbar();
  initCollapsibleTopbar();
  renderOrientationStepper();
}

try {
  if (document.querySelector('.topbar')) {
    initCollapsibleTopbar();
  }
} catch (e) {}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMainComponents);
} else {
  initMainComponents();
}

function loadInfo() {
  const d = read('info');
  if (!d) return;

  ['studentName', 'name', 'province', 'grade'].forEach(k => {
    const el = document.getElementById(k === 'name' ? 'studentName' : k);
    if (el && d[k] != null) el.value = d[k];
  });
}

// =================== HỆ THỐNG TRẮC NGHIỆM TÍNH CÁCH MBTI ===================
const MBTI_INFO = {
  'INTJ': { title: 'Nhà chiến lược', desc: 'Tư duy chiến lược sắc bén, độc lập, tầm nhìn xa trông rộng và quyết đoán.' },
  'INTP': { title: 'Nhà tư duy logic', desc: 'Phân tích logic sắc sảo, đam mê tìm tòi lý thuyết và giải mã quy luật phức tạp.' },
  'ENTJ': { title: 'Nhà chỉ huy', desc: 'Quyết đoán, có tài lãnh đạo, tư duy cấu trúc và định hướng mục tiêu mạnh mẽ.' },
  'ENTP': { title: 'Người nhìn xa sáng tạo', desc: 'Thông minh, thích tranh luận, sáng tạo không giới hạn và giàu ý tưởng đột phá.' },
  'INFJ': { title: 'Người cố vấn thấu cảm', desc: 'Giàu lòng trắc ẩn, trực giác sâu sắc, luôn hướng đến các giá trị nhân văn cao đẹp.' },
  'INFP': { title: 'Người hòa giải lý tưởng', desc: 'Sáng tạo, giàu lòng đồng cảm, sống chân thành và trung thành với giá trị nội tâm.' },
  'ENFJ': { title: 'Người truyền cảm hứng', desc: 'Nhiệt huyết, thu hút, giỏi kết nối và dẫn dắt người khác phát triển.' },
  'ENFP': { title: 'Người khám phá tự do', desc: 'Năng động, giàu cảm xúc, sáng tạo linh hoạt và luôn tràn đầy năng lượng tích cực.' },
  'ISTJ': { title: 'Người trách nhiệm', desc: 'Thực tế, cẩn trọng, tôn trọng quy tắc và luôn hoàn thành cam kết mẫu mực.' },
  'ISFJ': { title: 'Người bảo vệ chu đáo', desc: 'Tận tụy, ấm áp, kiên nhẫn và luôn chăm sóc người khác một cách chu toàn.' },
  'ESTJ': { title: 'Nhà điều hành thực tế', desc: 'Tổ chức kỷ luật, thực tế, rõ ràng và giỏi quản lý điều hành quy trình.' },
  'ESFJ': { title: 'Người chăm sóc tận tâm', desc: 'Nhiệt tình, hòa đồng, chu đáo và luôn tạo ra bầu không khí gắn kết tập thể.' },
  'ISTP': { title: 'Nhà kỹ thuật điêu luyện', desc: 'Quan sát nhạy bén, thích làm việc thực tế với công cụ máy móc và xử lý sự cố.' },
  'ISFP': { title: 'Nghệ sĩ phóng khoáng', desc: 'Tinh tế, giàu thẩm mỹ, yêu tự do và có năng khiếu nghệ thuật biểu đạt.' },
  'ESTP': { title: 'Người khởi xướng thực tế', desc: 'Táo bạo, năng động, hành động thực tế và nhạy bén với cơ hội thị trường.' },
  'ESFP': { title: 'Người trình diễn hoạt náo', desc: 'Vui vẻ, hào phóng, yêu đời và luôn là tâm điểm kết nối mọi người.' }
};

const HOLLAND_DESCRIPTIONS = {
  R: { name: 'Kỹ thuật - Thực tế (Realistic)', short: 'Kỹ thuật', desc: 'Thích làm việc với công cụ, máy móc, kỹ thuật, công nghệ thực tế và hành động cụ thể.' },
  I: { name: 'Nghiên cứu - Logic (Investigative)', short: 'Nghiên cứu', desc: 'Thích phân tích, đào sâu bản chất, tư duy logic khoa học và giải quyết các bài toán phức tạp.' },
  A: { name: 'Nghệ thuật - Sáng tạo (Artistic)', short: 'Nghệ thuật', desc: 'Giàu trí tưởng tượng, yêu thích sự tự do, đổi mới, thẩm mỹ và biểu đạt cảm xúc độc đáo.' },
  S: { name: 'Xã hội - Giao tiếp (Social)', short: 'Xã hội', desc: 'Hướng đến con người, thấu cảm, thích chia sẻ, truyền cảm hứng, giảng dạy và giúp đỡ cộng đồng.' },
  E: { name: 'Quản lý - Kinh doanh (Enterprising)', short: 'Quản lý', desc: 'Năng động, có tố chất lãnh đạo, thích thuyết phục, đàm phán, nắm bắt cơ hội và dẫn dắt tập thể.' },
  C: { name: 'Nghiệp vụ - Chi tiết (Conventional)', short: 'Nghiệp vụ', desc: 'Ngăn nắp, cẩn trọng, tôn trọng quy trình chuẩn, có trách nhiệm cao và làm việc có kế hoạch.' }
};

function computeMBTI(answers) {
  const savedType = typeof read === 'function' ? read('mbtiType') : null;
  if (!Array.isArray(answers) || answers.length === 0) {
    if (savedType && MBTI_INFO[savedType]) {
      return { type: savedType, ...MBTI_INFO[savedType], traits: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }, counts: {}, dimensions: null, riasec: null, techTrend: null, choicePressure: null };
    }
    return null;
  }

  const mbtiScores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  const riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const counts = { logic: 0, people: 0, creative: 0, patient: 0 };
  const customMap = typeof read === 'function' ? (read('personalityCustomAnswers') || {}) : {};

  // Bảng phân loại tính cách chuẩn xác theo 12 câu hỏi SJT - RIASEC
  // Ánh xạ 4 lựa chọn: A = Kỹ thuật - Logic; B = Sáng tạo - Nghệ thuật; C = Xã hội - Giao tiếp; D = Quản lý - Kinh doanh
  const questionWeights = [
    // Q1: Hội trại 26/3 & Hoạt động ngoại khóa (A: Kỹ thuật / B: Sáng tạo / C: Xã hội / D: Quản lý)
    [
      { m: { S: 2, T: 2 }, t: { logic: 2 }, r: { R: 3, I: 1 } },
      { m: { N: 2, P: 2 }, t: { creative: 2 }, r: { A: 3 } },
      { m: { E: 2, F: 2 }, t: { people: 2 }, r: { S: 3 } },
      { m: { E: 2, J: 2 }, t: { patient: 2 }, r: { E: 3, C: 1 } }
    ],
    // Q2: Dự án học tập & Làm việc nhóm (A: Nghiên cứu - Code / B: Slide - Kịch bản / C: Thuyết trình - Hòa giải / D: Nhóm trưởng)
    [
      { m: { I: 2, T: 2 }, t: { logic: 2 }, r: { I: 3, R: 1 } },
      { m: { N: 2, P: 2 }, t: { creative: 2 }, r: { A: 3 } },
      { m: { E: 2, F: 2 }, t: { people: 2 }, r: { S: 3 } },
      { m: { E: 2, J: 2 }, t: { patient: 2 }, r: { E: 3 } }
    ],
    // Q3: Cách giải quyết vấn đề khó (A: Tự mày mò quy luật / B: Mindmap sáng tạo / C: Trao đổi thầy cô bạn bè / D: Đánh giá nhanh hành động)
    [
      { m: { I: 3, T: 2 }, t: { logic: 2 }, r: { I: 3 } },
      { m: { N: 3, P: 2 }, t: { creative: 2 }, r: { A: 3 } },
      { m: { E: 2, F: 2 }, t: { people: 2 }, r: { S: 3 } },
      { m: { S: 2, J: 2 }, t: { patient: 2 }, r: { C: 2, E: 1 } }
    ],
    // Q4: Môn học & Hoạt động trí tuệ yêu thích (A: Toán lý code / B: Viết lách nghệ thuật / C: Tâm lý văn hóa giảng bài / D: Thị trường tài chính Notion)
    [
      { m: { I: 2, T: 2 }, t: { logic: 2 }, r: { I: 2, R: 2 } },
      { m: { N: 2, P: 2 }, t: { creative: 2 }, r: { A: 3 } },
      { m: { F: 2, I: 1 }, t: { people: 2 }, r: { S: 3 } },
      { m: { J: 2, T: 1, E: 1 }, t: { patient: 2 }, r: { E: 2, C: 2 } }
    ],
    // Q5: Ứng dụng Công nghệ & AI (A: Thuật toán debug / B: Ảnh minh họa kịch bản / C: Tâm sự ngoại ngữ thấu cảm / D: Tóm tắt kế hoạch phân tích)
    [
      { m: { I: 2, T: 2, N: 1 }, t: { logic: 2 }, r: { I: 2, R: 2 } },
      { m: { N: 3, P: 2 }, t: { creative: 2 }, r: { A: 3 } },
      { m: { F: 2, E: 1 }, t: { people: 2 }, r: { S: 3 } },
      { m: { S: 2, J: 2 }, t: { patient: 2 }, r: { C: 3, E: 1 } }
    ],
    // Q6: Môi trường làm việc mơ ước (A: Lab công nghệ / B: Studio sáng tạo / C: Trường học bệnh viện xã hội / D: Văn phòng sàn tài chính doanh nghiệp)
    [
      { m: { I: 2, T: 2 }, t: { logic: 2 }, r: { R: 2, I: 2 } },
      { m: { N: 2, P: 2 }, t: { creative: 2 }, r: { A: 3 } },
      { m: { F: 2, E: 2 }, t: { people: 2 }, r: { S: 3 } },
      { m: { E: 2, J: 2, T: 1 }, t: { patient: 2 }, r: { E: 3, C: 1 } }
    ],
    // Q7: Thói quen sử dụng Mạng xã hội (A: Video khoa học công nghệ / B: Trend biến hình đồ họa nhạc / C: Podcast chữa lành thiện nguyện / D: Khởi nghiệp tài chính marketing)
    [
      { m: { I: 2, T: 2 }, t: { logic: 2 }, r: { I: 2, R: 1 } },
      { m: { N: 2, P: 2 }, t: { creative: 2 }, r: { A: 3 } },
      { m: { F: 2, E: 1 }, t: { people: 2 }, r: { S: 3 } },
      { m: { E: 2, J: 1, T: 1 }, t: { patient: 2 }, r: { E: 3 } }
    ],
    // Q8: Góc nhìn trước sản phẩm mới / App trường (A: Ngôn ngữ lập trình bảo mật / B: UI thẩm mỹ logo / C: Hỗ trợ học tập kết nối tâm lý / D: Quảng bá 100% duy trì lâu dài)
    [
      { m: { T: 2, I: 1 }, t: { logic: 2 }, r: { R: 2, I: 2 } },
      { m: { N: 2, P: 2 }, t: { creative: 2 }, r: { A: 3 } },
      { m: { F: 2, E: 1 }, t: { people: 2 }, r: { S: 3 } },
      { m: { E: 3, J: 1 }, t: { patient: 2 }, r: { E: 3 } }
    ],
    // Q9: Xử lý áp lực ôn thi (A: Cày bài vận dụng cao bản chất / B: Bút nhớ nhiều màu sơ đồ thị giác / C: Study group động viên nhau / D: Thời gian biểu chi tiết mục tiêu)
    [
      { m: { I: 3, T: 2 }, t: { logic: 2 }, r: { I: 3 } },
      { m: { N: 2, P: 2 }, t: { creative: 2 }, r: { A: 3 } },
      { m: { E: 2, F: 2 }, t: { people: 2 }, r: { S: 3 } },
      { m: { S: 2, J: 3 }, t: { patient: 2 }, r: { C: 3 } }
    ],
    // Q10: Giá trị cốt lõi hướng tới (A: Chế tạo sản phẩm công nghệ mới / B: Tác phẩm sáng tạo cá nhân / C: Giúp đỡ con người phụng sự / D: Doanh nghiệp vững mạnh tự do tài chính)
    [
      { m: { I: 2, T: 2 }, t: { logic: 2 }, r: { I: 2, R: 2 } },
      { m: { N: 2, P: 2 }, t: { creative: 2 }, r: { A: 3 } },
      { m: { F: 3, E: 1 }, t: { people: 2 }, r: { S: 3 } },
      { m: { E: 3, J: 2 }, t: { patient: 2 }, r: { E: 3 } }
    ],
    // Q11: Bối cảnh Kỷ nguyên số (A: Core Tech AI / B: Creative Media AI / C: Human-Centric / D: Digital Biz Fintech)
    [
      { m: { T: 2, N: 1 }, t: { logic: 2 }, r: { R: 3, I: 2 } },
      { m: { N: 2, P: 2 }, t: { creative: 2 }, r: { A: 3 } },
      { m: { F: 2, S: 1 }, t: { people: 2 }, r: { S: 3 } },
      { m: { E: 2, T: 1 }, t: { patient: 2 }, r: { E: 3, C: 2 } }
    ],
    // Q12: Bối cảnh Tâm lý học đường (A: Logic rõ ràng / B: Khao khát tự do / C: Áp lực bối rối / D: Thực tế việc làm)
    [
      { m: { I: 2, T: 1 }, t: { logic: 2 }, r: { I: 2, R: 1 } },
      { m: { P: 2, N: 1 }, t: { creative: 2 }, r: { A: 2 } },
      { m: { F: 2, J: 1 }, t: { people: 1, patient: 1 }, r: { S: 2 } },
      { m: { J: 2, T: 1 }, t: { patient: 2 }, r: { E: 2, C: 2 } }
    ]
  ];

  answers.forEach((optIdx, qIdx) => {
    if (optIdx >= 0 && optIdx <= 3) {
      const qRules = questionWeights[qIdx] ? questionWeights[qIdx][optIdx] : null;
      if (qRules) {
        if (qRules.m) Object.keys(qRules.m).forEach(k => { mbtiScores[k] += qRules.m[k]; });
        if (qRules.t) Object.keys(qRules.t).forEach(k => { counts[k] += qRules.t[k]; });
        if (qRules.r) Object.keys(qRules.r).forEach(k => { riasecScores[k] += qRules.r[k]; });
      } else {
        if (optIdx === 0) { mbtiScores.E += 1; mbtiScores.T += 1; counts.logic += 1; riasecScores.I += 2; }
        else if (optIdx === 1) { mbtiScores.I += 1; mbtiScores.F += 1; counts.people += 1; riasecScores.S += 2; }
        else if (optIdx === 2) { mbtiScores.N += 1; mbtiScores.P += 1; counts.creative += 1; riasecScores.A += 2; }
        else if (optIdx === 3) { mbtiScores.S += 1; mbtiScores.J += 1; counts.patient += 1; riasecScores.C += 2; }
      }
    } else if (optIdx === 4) {
      // Đáp án E (Khác / tự luận)
      const txt = (customMap[qIdx] || '').toLowerCase();
      if (/hướng ngoại|giao tiếp|bạn bè|đông người|thuyết trình/.test(txt)) { mbtiScores.E += 2; counts.people += 2; riasecScores.S += 2; }
      else if (/hướng nội|một mình|yên tĩnh|độc lập|riêng tư/.test(txt)) { mbtiScores.I += 2; counts.logic += 1; riasecScores.I += 1; }

      if (/thực tế|số liệu|chi tiết|quy trình|kinh nghiệm/.test(txt)) { mbtiScores.S += 2; counts.patient += 2; riasecScores.C += 2; }
      else if (/ý tưởng|sáng tạo|tương lai|tổng quan|trực giác/.test(txt)) { mbtiScores.N += 2; counts.creative += 2; riasecScores.A += 2; }

      if (/logic|lý trí|phân tích|nguyên lý|đúng sai|khoa học/.test(txt)) { mbtiScores.T += 2; counts.logic += 2; riasecScores.I += 2; }
      else if (/cảm xúc|thấu cảm|con người|tình cảm|chia sẻ|hòa hợp/.test(txt)) { mbtiScores.F += 2; counts.people += 2; riasecScores.S += 2; }

      if (/kế hoạch|kỷ luật|nguyên tắc|đúng hạn|ngăn nắp/.test(txt)) { mbtiScores.J += 2; counts.patient += 2; riasecScores.C += 2; }
      else if (/tự do|linh hoạt|ngẫu hứng|tùy hứng|thích nghi/.test(txt)) { mbtiScores.P += 2; counts.creative += 2; riasecScores.A += 2; }

      if (/kỹ thuật|máy móc|cơ khí|thực tế|chế tạo|lắp ráp|phần cứng/.test(txt)) { riasecScores.R += 2; }
      if (/kinh doanh|quản lý|lãnh đạo|tiền|thương mại|khởi nghiệp|đàm phán/.test(txt)) { riasecScores.E += 2; }

      if (counts.logic === 0 && counts.people === 0 && counts.creative === 0 && counts.patient === 0) {
        mbtiScores.I += 1; mbtiScores.N += 1; mbtiScores.T += 1; mbtiScores.P += 1;
        counts.logic += 1; counts.creative += 1; riasecScores.I += 2; riasecScores.A += 1;
      }
    }
  });

  // Xác định 4 chữ cái MBTI đích thực từ điểm số phân loại
  const dimE = mbtiScores.E >= mbtiScores.I ? 'E' : 'I';
  const dimS = mbtiScores.N >= mbtiScores.S ? 'N' : 'S';
  const dimT = mbtiScores.T >= mbtiScores.F ? 'T' : 'F';
  const dimJ = mbtiScores.J >= mbtiScores.P ? 'J' : 'P';

  const type = `${dimE}${dimS}${dimT}${dimJ}`;

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top1 = sorted[0][0];

  const info = MBTI_INFO[type] || { title: 'Nhóm tính cách đa diện', desc: 'Kết hợp hài hòa giữa các yếu tố tính cách.' };

  const vietnameseTrait = {
    logic: 'thiên về tư duy logic và phân tích sắc bén',
    people: 'thiên về giao tiếp, thấu cảm và kết nối con người',
    creative: 'thiên về sáng tạo, trực giác và đổi mới',
    patient: 'thiên về kỷ luật, thực tế và kiên trì'
  }[top1] || 'đa diện';

  // Tính tỷ lệ % cho 4 chiều kích phân loại
  const totalEI = (mbtiScores.E + mbtiScores.I) || 1;
  const totalSN = (mbtiScores.S + mbtiScores.N) || 1;
  const totalTF = (mbtiScores.T + mbtiScores.F) || 1;
  const totalJP = (mbtiScores.J + mbtiScores.P) || 1;

  const dimensions = {
    EI: {
      winner: dimE,
      label: dimE === 'E' ? 'Hướng ngoại (E)' : 'Hướng nội (I)',
      score: dimE === 'E' ? Math.round((mbtiScores.E / totalEI) * 100) : Math.round((mbtiScores.I / totalEI) * 100),
      aspect: 'Nguồn năng lượng'
    },
    SN: {
      winner: dimS,
      label: dimS === 'N' ? 'Trực giác (N)' : 'Thực tế (S)',
      score: dimS === 'N' ? Math.round((mbtiScores.N / totalSN) * 100) : Math.round((mbtiScores.S / totalSN) * 100),
      aspect: 'Thu nhận thông tin'
    },
    TF: {
      winner: dimT,
      label: dimT === 'T' ? 'Lý trí (T)' : 'Cảm xúc (F)',
      score: dimT === 'T' ? Math.round((mbtiScores.T / totalTF) * 100) : Math.round((mbtiScores.F / totalTF) * 100),
      aspect: 'Ra quyết định'
    },
    JP: {
      winner: dimJ,
      label: dimJ === 'J' ? 'Nguyên tắc (J)' : 'Linh hoạt (P)',
      score: dimJ === 'J' ? Math.round((mbtiScores.J / totalJP) * 100) : Math.round((mbtiScores.P / totalJP) * 100),
      aspect: 'Lối sống & Tổ chức'
    }
  };

  // Tính toán Mô hình Holland RIASEC
  const sortedRiasec = Object.entries(riasecScores).sort((a, b) => b[1] - a[1]);
  const topRiasecLetters = sortedRiasec.slice(0, 3).map(x => x[0]);
  const topHollandCode = topRiasecLetters.join('');
  const riasecNames = topRiasecLetters.map(l => (HOLLAND_DESCRIPTIONS[l] ? HOLLAND_DESCRIPTIONS[l].short : l)).join(' · ');
  const riasecFullName = `Nhóm ${riasecNames} (${topHollandCode})`;
  const riasecDesc = `Thế mạnh nổi trội của bạn thuộc nhóm ${riasecNames}: ${topRiasecLetters.map(l => HOLLAND_DESCRIPTIONS[l] ? HOLLAND_DESCRIPTIONS[l].desc : '').filter(Boolean).join(' ')}`;

  // Phân tích câu hỏi 11: Xu hướng Chuyển đổi số trong nghề nghiệp
  let techTrend = { key: 'moderate', label: 'Ứng dụng công nghệ linh hoạt', score: 75 };
  if (answers.length > 10 && answers[10] != null) {
    const q11Val = answers[10];
    if (q11Val === 0) techTrend = { key: 'core_tech', label: 'Tiên phong Công nghệ & Kỹ thuật số (AI, Big Data, Tự động hóa)', score: 95 };
    else if (q11Val === 1) techTrend = { key: 'creative_tech', label: 'Sáng tạo Nghệ thuật & Truyền thông số (Thiết kế, Nội dung số, AI Creative)', score: 88 };
    else if (q11Val === 2) techTrend = { key: 'human_first', label: 'Ưu tiên Giá trị Con người & Nhân văn (Tâm lý, Giáo dục, Y tế, Thấu cảm)', score: 65 };
    else if (q11Val === 3) techTrend = { key: 'applied_biz', label: 'Quản trị thông minh & Kinh doanh số (Fintech, E-Commerce, Quản lý số)', score: 85 };
    else if (q11Val === 4) techTrend = { key: 'custom', label: customMap[10] || 'Xu hướng công nghệ riêng biệt', score: 75 };
  }

  // Phân tích câu hỏi 12: Động lực & Kỳ vọng chọn ngành (Tâm lý học đường)
  let choicePressure = { key: 'autonomous', label: 'Tự chủ & Rõ ràng Đam mê', level: 'Thấp', text: 'Tự tin cao, ít áp lực kỳ vọng' };
  if (answers.length > 11 && answers[11] != null) {
    const q12Val = answers[11];
    if (q12Val === 0) choicePressure = { key: 'autonomous', label: 'Tự chủ & Rõ ràng Thế mạnh Chuyên môn', level: 'Thấp', text: 'Học sinh hoàn toàn tự chủ, đã xác định rõ thế mạnh logic và chuyên môn kỹ thuật; chủ động tìm hiểu sâu về ngành học.' };
    else if (q12Val === 1) choicePressure = { key: 'passion_freedom', label: 'Khao khát Đam mê & Tự do Cá tính', level: 'Trung bình', text: 'Rất khao khát theo đuổi đam mê và cá tính riêng; cần môi trường cởi mở, sáng tạo, sợ sự gò bó và khô khan.' };
    else if (q12Val === 2) choicePressure = { key: 'family_pressure', label: 'Áp lực Kỳ vọng Gia đình & Tâm lý Đám đông', level: 'Cao', text: 'Đang cảm thấy bối rối trước nhiều thông tin hoặc chịu áp lực kỳ vọng từ gia đình; cần được lắng nghe và tư vấn giải tỏa tâm lý.' };
    else if (q12Val === 3) choicePressure = { key: 'pragmatic_goal', label: 'Mục tiêu Thực tế & Cơ hội Việc làm', level: 'Thấp', text: 'Ưu tiên tính thực tế và cơ hội việc làm rõ ràng sau khi ra trường; chủ động lập kế hoạch hành động cụ thể để chinh phục ngành học.' };
    else if (q12Val === 4) choicePressure = { key: 'custom', label: 'Cảm xúc cá nhân riêng biệt', level: 'Tùy biến', text: customMap[11] || 'Tâm lý tự chia sẻ' };
  }

  return {
    type,
    title: info.title,
    desc: info.desc,
    topTrait: top1,
    vietnameseTrait,
    counts,
    mbtiScores,
    dimensions,
    riasec: {
      scores: riasecScores,
      sorted: sortedRiasec,
      topCode: topHollandCode,
      name: riasecFullName,
      desc: riasecDesc
    },
    techTrend,
    choicePressure
  };
}

function getProfile() {
  const info = read('info') || {};
  const scores = read('scores') || {};
  const hobbies = read('hobbies') || {selected: [], custom: ''};
  const answers = read('personalityAnswers') || [];
  const selfReflect = read('personalitySelfReflect') || { strengths: '', idealEnv: '', vision: '' };
  const goals = read('goals') || {selected: [], other: ''};

  const values = Object.values(scores);
  const avg = values.length
    ? values.reduce((a,b) => a + Number(b), 0) / values.length
    : null;

  const mbti = computeMBTI(answers);
  let personality = 'đang được xác định';

  if (mbti) {
    personality = `[MBTI: ${mbti.type}] ${mbti.vietnameseTrait}`;
  } else {
    const counts = {logic: 0, people: 0, creative: 0, patient: 0};
    answers.forEach(a => {
      if (a === 0) counts.logic++;
      if (a === 1) counts.people++;
      if (a === 2) counts.creative++;
      if (a === 3) counts.patient++;
    });

    const top = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
    if (top && top[1] > 0) {
      personality = {
        logic: 'thiên về tư duy và phân tích',
        people: 'thiên về giao tiếp và hợp tác',
        creative: 'thiên về sáng tạo và thử nghiệm',
        patient: 'thiên về kiên trì và ổn định'
      }[top[0]];
    }
  }

  return {
    info,
    scores,
    hobbies,
    answers,
    selfReflect,
    goals,
    avg,
    personality,
    mbti,
    riasec: mbti ? mbti.riasec : null,
    techTrend: mbti ? mbti.techTrend : null,
    choicePressure: mbti ? mbti.choicePressure : null,
    scoreCount: values.length
  };
}

function profileText() {
  const p = getProfile();
  const name = 'bạn';
  const province = p.info.province || 'chưa chọn tỉnh/thành';
  const grade = p.info.grade ? `lớp ${p.info.grade}` : 'chưa chọn lớp';
  const dream = p.goals.dreamMajor || p.goals.dreamCareer || (p.goals.selected || []).join(', ') || 'chưa đặt mục tiêu';
  const hobbies = (p.hobbies.selected || []).join(', ') || 'chưa chọn sở thích';
  const custom = p.hobbies.custom ? `; sở thích thêm: ${p.hobbies.custom}` : '';
  const avg = p.avg == null ? 'chưa có' : p.avg.toFixed(1);

  return `${name} đang ở ${province}, ${grade}; định hướng: ${dream}; đã nhập ${p.scoreCount} môn, điểm trung bình ${avg}; sở thích: ${hobbies}${custom}; xu hướng tính cách: ${p.personality}.`;
}


/**
 * NS AI - Thuật toán phân tích định hướng nghề nghiệp công bằng & khoa học
 * Đánh giá đa chiều dựa trên 5 trụ cột:
 * 1. Điểm số môn học (Tương thích theo tổ hợp môn xét tuyển thực tế tại các trường ĐH)
 * 2. Sở thích & Đam mê tự nhiên (Phân tách rõ sở thích giải trí và đam mê chuyên môn)
 * 3. Xu hướng tính cách MBTI & Phong cách tư duy
 * 4. Tiếng nói tự thân (Câu hỏi tự bộc lộ & Đáp án tự do E)
 * 5. Mục tiêu & Nguyện vọng cụ thể của học sinh (Ưu tiên cao nhất khi học sinh đã có định hướng rõ)
 *
 * Đảm bảo: KHÔNG thiên vị bất kỳ ngành nghề nào. Mọi ngành đều có xuất phát điểm công bằng.
 */

function analyzeCareer(overrideScores = null) {
  const info = typeof read === 'function' ? (read('info') || {}) : {};
  const scores = (overrideScores && typeof overrideScores === 'object') ? overrideScores : (typeof read === 'function' ? (read('scores') || {}) : {});
  const hobbies = typeof read === 'function' ? (read('hobbies') || { selected: [], custom: '' }) : { selected: [], custom: '' };
  const answers = typeof read === 'function' ? (read('personalityAnswers') || []) : [];
  const customAnswers = typeof read === 'function' ? (read('personalityCustomAnswers') || {}) : {};
  const selfReflect = typeof read === 'function' ? (read('personalitySelfReflect') || { strengths: '', idealEnv: '', vision: '' }) : { strengths: '', idealEnv: '', vision: '' };
  const goals = typeof read === 'function' ? (read('goals') || { selected: [], other: '' }) : { selected: [], other: '' };

  const vals = Object.values(scores).filter(v => v !== '' && v != null && !isNaN(v)).map(Number);
  const generalAvg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

  const allHobbyText = ((hobbies.selected || []).join(' ') + ' ' + (hobbies.custom || '')).toLowerCase();
  const customValues = Object.values(customAnswers).filter(Boolean);
  const openText = (
    (selfReflect.strengths || '') + ' ' +
    (selfReflect.idealEnv || '') + ' ' +
    (selfReflect.vision || '') + ' ' +
    customValues.join(' ')
  ).toLowerCase();

  const wantedGoalText = [
    ...(goals.selected || []),
    goals.other || '',
    goals.dreamMajor || '',
    goals.dreamCareer || '',
    goals.dreamGoal || ''
  ].join(' ').toLowerCase();

  // Kiểm tra xem người dùng đã thực sự cung cấp dữ liệu định hướng chưa
  const hasUserScores = vals.length > 0;
  const hasUserHobbies = (hobbies.selected && hobbies.selected.length > 0) || !!(hobbies.custom && hobbies.custom.trim());
  const hasUserGoals = (goals.selected && goals.selected.length > 0) || !!(goals.dreamMajor && goals.dreamMajor.trim()) || !!(goals.dreamCareer && goals.dreamCareer.trim()) || !!(goals.dreamGoal && goals.dreamGoal.trim());
  const mbti = typeof computeMBTI === 'function' ? computeMBTI(answers) : null;
  const hasUserMbti = !!mbti && Array.isArray(answers) && answers.length >= 4;
  const isDefaultOverview = !hasUserScores && !hasUserHobbies && !hasUserGoals && !hasUserMbti;

  // 1. Tính điểm học lực theo môn xét tuyển thực tế (Tối đa 22 điểm)
  function calcAcademicFit(subjectGroupList) {
    if (!vals.length) return 12; // Mức sàn trung tính khi chưa nhập điểm

    const matchedScores = [];
    subjectGroupList.forEach(group => {
      for (const subj of group) {
        if (scores[subj] != null && scores[subj] !== '' && !isNaN(scores[subj])) {
          matchedScores.push(Number(scores[subj]));
          break;
        }
      }
    });

    if (matchedScores.length > 0) {
      const avg = matchedScores.reduce((a, b) => a + b, 0) / matchedScores.length;
      // Trọng số hoàn chỉnh tổ hợp: 3 môn khớp được 100% điểm; nếu chỉ khớp 1 môn thì có độ hoàn chỉnh tương ứng
      const completeness = Math.min(1, matchedScores.length / 3);
      return (avg / 10) * 22 * (0.75 + 0.25 * completeness);
    }

    return generalAvg != null ? (generalAvg / 10) * 13 : 12;
  }

  // 2. Tính độ tương thích sở thích (Tối đa 20 điểm)
  function calcHobbyFit(keywords, entertainmentKeywords = []) {
    if (!allHobbyText) return 0;

    let directMatches = 0;
    keywords.forEach(k => {
      if (allHobbyText.includes(k.toLowerCase())) directMatches++;
    });

    let entMatches = 0;
    entertainmentKeywords.forEach(k => {
      if (allHobbyText.includes(k.toLowerCase())) entMatches++;
    });

    if (directMatches === 0 && entMatches === 0) return 0;

    let score = 0;
    if (directMatches > 0) {
      score = 8.5 + (directMatches - 1) * 3.5;
    }
    if (entMatches > 0) {
      score += Math.min(4, entMatches * 2);
    }
    return Math.min(20, score);
  }

  // 3. Tính độ tương thích mục tiêu / ước mơ đã chọn (Tối đa 25 điểm - Tôn trọng tuyệt đối định hướng của học sinh)
  function calcGoalFit(keywords) {
    if (!wantedGoalText) return 0;
    const hasMatch = keywords.some(k => wantedGoalText.includes(k.toLowerCase()));
    return hasMatch ? 25 : 0;
  }

  // 4. Tính độ tương thích MBTI (Tối đa 12 điểm)
  function calcMBTI(preferredPairs) {
    if (!mbti) return 5;
    const t = mbti.type;
    let matchCount = 0;
    preferredPairs.forEach(pair => {
      if (pair.length === 4 && t === pair) {
        matchCount += 3; // Khớp chính xác cả 4 chữ cái (vd: 'INTJ' === 'INTJ')
      } else if (pair.length === 2 && t.includes(pair[0]) && t.includes(pair[1])) {
        matchCount += 2; // Khớp cặp 2 chiều kích (vd: 'NT' trong 'INTJ')
      } else if (pair.length === 1 && t.includes(pair)) {
        matchCount += 0.8; // Khớp 1 chiều kích
      }
    });
    return Math.min(12, 4 + matchCount * 2.2);
  }

  // 5. Tính độ tương thích câu trả lời tự bộc lộ (Tối đa 10 điểm)
  function calcReflectFit(keywords) {
    if (!openText) return 0;
    const matches = keywords.filter(k => openText.includes(k.toLowerCase())).length;
    return matches > 0 ? Math.min(10, 5 + (matches - 1) * 2.5) : 0;
  }

  // Danh mục 12 nhóm ngành đào tạo chuẩn mực tại các trường Đại học Việt Nam
  // TẤT CẢ các ngành đều bắt đầu từ base 40 đồng đều, tuyệt đối không thiên vị!
  const careersDefinition = [
    {
      name: 'Công nghệ thông tin & Lập trình phần mềm',
      base: 40,
      subjectGroups: [['Toán'], ['Tin học', 'Vật lý'], ['Tiếng Anh', 'Công nghệ công nghiệp']],
      hobbyKeys: ['lập trình', 'phát triển phần mềm', 'code', 'website', 'ứng dụng di động', 'app mobile', 'an toàn thông tin', 'an ninh mạng', 'vi mạch', 'phần cứng máy tính', 'lắp ráp pc'],
      entHobbyKeys: ['game', 'esports'],
      goalKeys: ['công nghệ thông tin', 'cntt', 'lập trình', 'it', 'phần mềm', 'developer', 'an ninh mạng', 'coder', 'web', 'app mobile'],
      mbtiPairs: ['INTJ', 'INTP', 'ENTP', 'ISTP', 'NT'],
      reflectKeys: ['công nghệ', 'lập trình', 'code', 'phần mềm', 'máy tính', 'bảo mật', 'thuật toán'],
      combinations: ['A00 (Toán, Lý, Hóa)', 'A01 (Toán, Lý, Anh)', 'D01 (Toán, Văn, Anh)', 'D07 (Toán, Hóa, Anh)'],
      bestCombo: 'A00 hoặc A01',
      advice: 'Nên ưu tiên khối A00 hoặc A01 nếu có thế mạnh tự nhiên; hoặc D01 nếu tự tin môn Tiếng Anh.'
    },
    {
      name: 'Kinh tế / Quản trị kinh doanh & Marketing',
      base: 40,
      subjectGroups: [['Toán'], ['Tiếng Anh'], ['Ngữ văn', 'Địa lý', 'GDKT&PL', 'Giáo dục công dân']],
      hobbyKeys: ['khởi nghiệp', 'quản trị kinh doanh', 'đầu tư', 'chứng khoán', 'tài chính', 'bán hàng', 'e-commerce', 'thương mại', 'marketing', 'quảng cáo', 'tiếp thị số', 'quản lý đội nhóm', 'kỹ năng lãnh đạo', 'logistics', 'chuỗi cung ứng', 'kế toán', 'kiểm toán', 'thuế tài chính', 'kinh doanh', 'cờ vua', 'thể thao trí tuệ', 'board game', 'chiến thuật nhóm'],
      entHobbyKeys: ['chiến thuật', 'board game', 'cà phê'],
      goalKeys: ['kinh tế', 'quản trị kinh doanh', 'qtkd', 'marketing', 'tài chính', 'ngân hàng', 'kinh doanh', 'logistics', 'doanh nhân', 'ceo', 'thương mại', 'kế toán', 'kiểm toán', 'xuất nhập khẩu', 'tài chính - ngân hàng'],
      mbtiPairs: ['ENTJ', 'ESTJ', 'ESTP', 'ENTP', 'ENFJ', 'ESFJ', 'ET', 'ES'],
      reflectKeys: ['kinh doanh', 'khởi nghiệp', 'tài chính', 'quản lý', 'marketing', 'doanh nghiệp', 'lãnh đạo', 'đầu tư', 'thương mại'],
      combinations: ['A01 (Toán, Lý, Anh)', 'D01 (Toán, Văn, Anh)', 'A00 (Toán, Lý, Hóa)', 'D07 (Toán, Hóa, Anh)'],
      bestCombo: 'D01 hoặc A01',
      advice: 'Khối D01 và A01 có chỉ tiêu lớn nhất tại các trường như Ngoại thương, Kinh tế Quốc dân, UEH.'
    },
    {
      name: 'Y khoa / Dược học & Khoa học sức khỏe',
      base: 40,
      subjectGroups: [['Sinh học', 'Công nghệ nông nghiệp'], ['Hóa học'], ['Toán', 'Tiếng Anh', 'Công nghệ nông nghiệp']],
      hobbyKeys: ['y học', 'y tế', 'khám chữa bệnh', 'dược học', 'thảo dược', 'hóa dược', 'nghiên cứu khoa học', 'chăm sóc động vật', 'thú cưng', 'môi trường', 'sinh thái', 'yoga', 'thiền định', 'sức khỏe tinh thần', 'tập gym', 'thể hình', 'fitness', 'thể thao', 'phục hồi chức năng'],
      entHobbyKeys: ['chăm sóc', 'thú cưng', 'sức khỏe'],
      goalKeys: ['bác sĩ', 'y khoa', 'y đa khoa', 'dược sĩ', 'dược', 'y tế', 'điều dưỡng', 'nha sĩ', 'răng hàm mặt', 'y - dược', 'bệnh viện', 'cứu người', 'thú y', 'y học cổ truyền'],
      mbtiPairs: ['ISFJ', 'INFJ', 'ISTJ', 'ISFP', 'ESFJ', 'ENFJ', 'IS', 'IF'],
      reflectKeys: ['bác sĩ', 'y tế', 'chữa bệnh', 'cứu người', 'dược', 'sức khỏe', 'bệnh viện', 'y khoa', 'chăm sóc'],
      combinations: ['B00 (Toán, Hóa, Sinh)', 'A00 (Toán, Lý, Hóa)', 'D07 (Toán, Hóa, Anh)'],
      bestCombo: 'B00',
      advice: 'Khối B00 là con đường cốt lõi cho Y đa khoa; ngành Dược mở rộng thêm xét tuyển khối A00 và D07.'
    },
    {
      name: 'Khoa học máy tính & Trí tuệ nhân tạo (AI)',
      base: 40,
      subjectGroups: [['Toán'], ['Tin học', 'Vật lý'], ['Tiếng Anh', 'Công nghệ công nghiệp']],
      hobbyKeys: ['trí tuệ nhân tạo', 'ai', 'dữ liệu', 'khoa học dữ liệu', 'toán học', 'tư duy logic', 'nghiên cứu khoa học', 'thiên văn học', 'khám phá vũ trụ', 'cờ vua', 'thể thao trí tuệ', 'machine learning', 'robot'],
      entHobbyKeys: ['đố vui logic', 'rubik'],
      goalKeys: ['trí tuệ nhân tạo', 'ai', 'khoa học máy tính', 'khoa học dữ liệu', 'data scientist', 'machine learning', 'kỹ sư ai', 'khoa học tự nhiên'],
      mbtiPairs: ['INTP', 'INTJ', 'ENTP', 'ISTP', 'NT', 'IN'],
      reflectKeys: ['ai', 'trí tuệ nhân tạo', 'dữ liệu', 'khoa học', 'toán', 'robot', 'thuật toán', 'machine learning'],
      combinations: ['A00 (Toán, Lý, Hóa)', 'A01 (Toán, Lý, Anh)', 'D01 (Toán, Văn, Anh)'],
      bestCombo: 'A00 hoặc A01',
      advice: 'Môn Toán tư duy logic và thuật toán là chìa khóa then chốt cho ngành AI & Khoa học dữ liệu.'
    },
    {
      name: 'Kỹ thuật / Cơ điện tử & Tự động hóa',
      base: 40,
      subjectGroups: [['Toán'], ['Vật lý'], ['Công nghệ công nghiệp', 'Tin học', 'Hóa học', 'Tiếng Anh']],
      hobbyKeys: ['cơ khí', 'ô tô', 'chế tạo máy móc', 'điện tử', 'vi mạch', 'phần cứng máy tính', 'kiến trúc', 'kỹ thuật xây dựng', 'thiên văn học', 'vũ trụ', 'thiết kế nội thất', 'môi trường', 'năng lượng'],
      entHobbyKeys: ['lắp ráp', 'mô hình', 'diy'],
      goalKeys: ['kỹ thuật', 'cơ khí', 'chế tạo', 'ô tô', 'điện', 'tự động hóa', 'cơ điện tử', 'kỹ sư', 'hàng không', 'kiến trúc', 'xây dựng'],
      mbtiPairs: ['ISTP', 'ISTJ', 'ESTP', 'INTJ', 'ENTJ', 'ST'],
      reflectKeys: ['kỹ thuật', 'cơ khí', 'chế tạo', 'máy móc', 'ô tô', 'robot', 'lắp ráp', 'điện tử', 'công trình'],
      combinations: ['A00 (Toán, Lý, Hóa)', 'A01 (Toán, Lý, Anh)', 'C01 (Toán, Văn, Lý)'],
      bestCombo: 'A00 hoặc A01',
      advice: 'Nên tập trung tối đa vào cặp môn Toán - Lý để xét tuyển vào các trường kỹ thuật hàng đầu.'
    },
    {
      name: 'Luật / Ngoại giao & Khoa học xã hội',
      base: 40,
      subjectGroups: [['Ngữ văn'], ['Lịch sử', 'GDKT&PL', 'Giáo dục công dân'], ['Tiếng Anh', 'Toán']],
      hobbyKeys: ['pháp luật', 'tranh biện', 'công lý xã hội', 'lịch sử', 'triết học', 'nghiên cứu xã hội', 'thuyết trình', 'diễn thuyết', 'giao lưu văn hóa quốc tế', 'võ thuật', 'kỹ năng tự vệ'],
      entHobbyKeys: ['đọc sách', 'tranh biện'],
      goalKeys: ['luật', 'luật sư', 'pháp lý', 'thẩm phán', 'kiểm sát', 'tòa án', 'ngoại giao', 'nhân quyền', 'chính trị', 'khoa học xã hội'],
      mbtiPairs: ['ENTJ', 'INTJ', 'ESTJ', 'ENFJ', 'INFJ', 'TJ'],
      reflectKeys: ['luật', 'công lý', 'pháp luật', 'tranh biện', 'thuyết trình', 'ngoại giao', 'chính sách', 'xã hội'],
      combinations: ['D01 (Toán, Văn, Anh)', 'C00 (Văn, Sử, Địa)', 'A01 (Toán, Lý, Anh)', 'D14 (Văn, Sử, Anh)'],
      bestCombo: 'D01 hoặc C00',
      advice: 'Khối D01 mang lại cơ hội xét tuyển rộng nhất; khối C00 có lợi thế lớn với ngành Luật và Tòa án.'
    },
    {
      name: 'Truyền thông / Báo chí & Quan hệ công chúng (PR)',
      base: 40,
      subjectGroups: [['Ngữ văn'], ['Tiếng Anh'], ['Lịch sử', 'Toán']],
      hobbyKeys: ['viết lách', 'báo chí', 'sáng tạo nội dung số', 'nhiếp ảnh', 'quay phim', 'dựng video', 'thuyết trình', 'diễn thuyết', 'mc dẫn chương trình', 'ca hát', 'thanh nhạc', 'biểu diễn', 'chơi nhạc cụ', 'sáng tác âm nhạc', 'nhảy hiện đại', 'vũ đạo', 'marketing', 'quảng cáo', 'trò chơi điện tử', 'gaming'],
      entHobbyKeys: ['mạng xã hội', 'podcast', 'tiktok', 'youtube', 'xem phim', 'game'],
      goalKeys: ['báo chí', 'truyền thông', 'nhà báo', 'biên tập viên', 'pr', 'quan hệ công chúng', 'copywriter', 'content creator', 'mc', 'truyền thông'],
      mbtiPairs: ['ENFP', 'ENTP', 'ENFJ', 'ESFP', 'INFP', 'EN'],
      reflectKeys: ['báo chí', 'truyền thông', 'viết lách', 'sáng tạo nội dung', 'podcast', 'mc', 'quảng bá', 'kể chuyện'],
      combinations: ['D01 (Toán, Văn, Anh)', 'C00 (Văn, Sử, Địa)', 'D14 (Văn, Sử, Anh)'],
      bestCombo: 'D01 hoặc C00',
      advice: 'Ngành truyền thông đòi hỏi khả năng sáng tạo ngôn từ sắc bén kết hợp cùng kỹ năng số hóa.'
    },
    {
      name: 'Sư phạm & Quản lý giáo dục',
      base: 40,
      subjectGroups: [['Ngữ văn', 'Toán'], ['Tiếng Anh', 'Lịch sử', 'GDKT&PL', 'Giáo dục công dân'], ['Vật lý', 'Hóa học', 'Sinh học', 'Công nghệ công nghiệp', 'Công nghệ nông nghiệp']],
      hobbyKeys: ['giảng dạy', 'đào tạo', 'truyền cảm hứng', 'hoạt động tình nguyện', 'phát triển cộng đồng', 'thể thao đồng đội', 'thể thao cá nhân', 'bóng đá', 'bơi lội', 'võ thuật', 'ca hát', 'thanh nhạc', 'toán học', 'lịch sử', 'triết học'],
      entHobbyKeys: ['đọc sách', 'kèm cặp'],
      goalKeys: ['giáo viên', 'sư phạm', 'giảng viên', 'dạy học', 'thầy giáo', 'cô giáo', 'giáo dục', 'huấn luyện viên'],
      mbtiPairs: ['ESFJ', 'ENFJ', 'ISFJ', 'INFJ', 'ESTJ', 'FJ'],
      reflectKeys: ['dạy học', 'giảng dạy', 'giáo dục', 'truyền cảm hứng', 'học sinh', 'sư phạm', 'đào tạo'],
      combinations: ['C00 (Văn, Sử, Địa)', 'D01 (Toán, Văn, Anh)', 'A00 (Toán, Lý, Hóa)', 'B00 (Toán, Hóa, Sinh)'],
      bestCombo: 'Tùy bộ môn chuyên ngành',
      advice: 'Chọn tổ hợp có môn bạn muốn giảng dạy (Dạy Toán - A00/A01; Dạy Văn/Sử - C00/D01; Dạy Ngoại ngữ - D01).'
    },
    {
      name: 'Thiết kế đồ họa / Mỹ thuật số & Đa phương tiện',
      base: 40,
      subjectGroups: [['Toán'], ['Tin học', 'Công nghệ công nghiệp', 'Vật lý'], ['Tiếng Anh', 'Ngữ văn']],
      hobbyKeys: ['hội họa', 'vẽ tranh', 'mỹ thuật số', 'thiết kế đồ họa', 'đa phương tiện', 'nhiếp ảnh', 'quay phim', 'dựng video', 'thiết kế thời trang', 'làm đẹp', 'thiết kế nội thất', 'không gian sống', 'kiến trúc', 'thiết kế website', 'trò chơi điện tử', 'gaming', 'esports'],
      entHobbyKeys: ['xem phim', 'game', 'anime', 'manga'],
      goalKeys: ['thiết kế đồ họa', 'designer', 'graphic design', 'họa sĩ', 'thiết kế', 'digital art', 'ui/ux', 'dựng phim', 'hoạt hình', 'kiến trúc', 'thời trang', 'nội thất'],
      mbtiPairs: ['ISFP', 'INFP', 'ENFP', 'INTP', 'ISTP', 'FP'],
      reflectKeys: ['thiết kế', 'nghệ thuật', 'đồ họa', 'sáng tạo', 'hình ảnh', 'mỹ thuật', 'thẩm mỹ', 'không gian'],
      combinations: ['D01 (Toán, Văn, Anh)', 'V00 (Toán, Lý, Vẽ)', 'H00 (Văn, Vẽ, Vẽ)', 'A01 (Toán, Lý, Anh)'],
      bestCombo: 'D01 hoặc V00',
      advice: 'Rất phù hợp với bạn trẻ có gu thẩm mỹ cao, đam mê nghệ thuật thị giác và truyền thông số.'
    },
    {
      name: 'Tâm lý học & Dịch vụ tham vấn / Xã hội',
      base: 40,
      subjectGroups: [['Ngữ văn'], ['Sinh học', 'Công nghệ nông nghiệp', 'Tiếng Anh'], ['Toán', 'GDKT&PL', 'Giáo dục công dân']],
      hobbyKeys: ['tâm lý học', 'thấu hiểu cảm xúc con người', 'hoạt động tình nguyện', 'phát triển cộng đồng', 'yoga', 'thiền định', 'sức khỏe tinh thần', 'chăm sóc động vật', 'thú cưng', 'lắng nghe', 'tâm sự'],
      entHobbyKeys: ['thiền định', 'yoga', 'viết nhật ký'],
      goalKeys: ['tâm lý', 'tâm lý học', 'chuyên viên tâm lý', 'tư vấn tâm lý', 'trị liệu', 'tham vấn', 'công tác xã hội'],
      mbtiPairs: ['INFJ', 'INFP', 'ENFJ', 'ISFJ', 'ENFP', 'NF'],
      reflectKeys: ['tâm lý', 'thấu hiểu', 'lắng nghe', 'chia sẻ', 'chữa lành', 'con người', 'cảm xúc'],
      combinations: ['D01 (Toán, Văn, Anh)', 'B00 (Toán, Hóa, Sinh)', 'C00 (Văn, Sử, Địa)'],
      bestCombo: 'D01 hoặc B00',
      advice: 'Nhu cầu chuyên viên tư vấn tâm lý học đường và trị liệu cảm xúc đang tăng trưởng nhanh chóng.'
    },
    {
      name: 'Du lịch / Quản trị khách sạn & Dịch vụ F&B',
      base: 40,
      subjectGroups: [['Tiếng Anh'], ['Địa lý', 'Ngữ văn'], ['Lịch sử', 'Toán']],
      hobbyKeys: ['du lịch', 'đi phượt', 'trải nghiệm khám phá', 'nấu ăn', 'nghệ thuật ẩm thực', 'pha chế đồ uống', 'thưởng thức cà phê', 'quản trị dịch vụ khách sạn', 'nhà hàng', 'cắm trại', 'dã ngoại ngoài trời', 'học ngoại ngữ', 'giao lưu văn hóa quốc tế', 'thể thao', 'fitness'],
      entHobbyKeys: ['phượt', 'camping', 'thưởng thức cà phê', 'ẩm thực'],
      goalKeys: ['du lịch', 'quản trị khách sạn', 'khách sạn', 'hướng dẫn viên', 'resort', 'nhà hàng', 'f&b', 'đầu bếp', 'lữ hành', 'dịch vụ'],
      mbtiPairs: ['ESFP', 'ESTP', 'ESFJ', 'ENFP', 'ISFP', 'ES'],
      reflectKeys: ['du lịch', 'khách sạn', 'ẩm thực', 'trải nghiệm', 'giao tiếp', 'dịch vụ', 'khám phá'],
      combinations: ['D01 (Toán, Văn, Anh)', 'D14 (Văn, Sử, Anh)', 'D15 (Văn, Địa, Anh)', 'C00 (Văn, Sử, Địa)'],
      bestCombo: 'D01 hoặc D14',
      advice: 'Khả năng ngoại ngữ tốt và sự năng động, mến khách là lợi thế cạnh tranh hàng đầu.'
    },
    {
      name: 'Ngôn ngữ học & Biên phiên dịch quốc tế',
      base: 40,
      subjectGroups: [['Tiếng Anh'], ['Ngữ văn'], ['Lịch sử', 'Địa lý', 'Toán']],
      hobbyKeys: ['học ngoại ngữ', 'giao lưu văn hóa quốc tế', 'viết lách', 'báo chí', 'đọc sách ngoại văn', 'dịch thuật', 'thuyết trình', 'du lịch'],
      entHobbyKeys: ['xem phim nước ngoài', 'nghe nhạc ngoại', 'đọc sách'],
      goalKeys: ['ngôn ngữ', 'ngôn ngữ anh', 'biên dịch', 'phiên dịch', 'dịch thuật', 'tiếng trung', 'tiếng hàn', 'tiếng nhật', 'ngoại ngữ', 'ngôn ngữ học'],
      mbtiPairs: ['INFJ', 'INFP', 'ENFP', 'ISFP', 'INTJ', 'IN'],
      reflectKeys: ['ngoại ngữ', 'ngôn ngữ', 'tiếng anh', 'dịch thuật', 'văn hóa quốc tế', 'song ngữ'],
      combinations: ['D01 (Toán, Văn, Anh)', 'D14 (Văn, Sử, Anh)', 'D15 (Văn, Địa, Anh)'],
      bestCombo: 'D01 (Ngoại ngữ nhân hệ số 2)',
      advice: 'Thế mạnh vượt trội về ngoại ngữ mở ra cơ hội làm việc trong các tập đoàn đa quốc gia và tổ chức ngoại giao.'
    }
  ];

  // Tính điểm tổng hợp cho từng ngành nghề
  const result = careersDefinition.map(c => {
    const academicFit = calcAcademicFit(c.subjectGroups);
    const hobbyFit = calcHobbyFit(c.hobbyKeys, c.entHobbyKeys);
    const goalFit = calcGoalFit(c.goalKeys);
    const mbtiFit = calcMBTI(c.mbtiPairs);
    const reflectFit = calcReflectFit(c.reflectKeys);

    const totalRaw = c.base + academicFit + hobbyFit + goalFit + mbtiFit + reflectFit;
    const finalScore = Math.max(35, Math.min(98, Math.round(totalRaw)));

    return {
      name: c.name,
      base: c.base,
      score: finalScore,
      academicFit,
      hobbyFit,
      goalFit,
      mbtiFit,
      reflectFit,
      combinations: c.combinations,
      bestCombo: c.bestCombo,
      advice: c.advice,
      subjectGroups: c.subjectGroups
    };
  });

  // Sắp xếp giảm dần theo điểm số phù hợp với cơ chế giải quyết đồng điểm khoa học & khách quan
  result.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // 1. Ưu tiên mục tiêu rõ ràng của học sinh
    if (b.goalFit !== a.goalFit) return b.goalFit - a.goalFit;
    // 2. Ưu tiên đam mê sở thích thực tế
    if (b.hobbyFit !== a.hobbyFit) return b.hobbyFit - a.hobbyFit;
    // 3. Ưu tiên năng lực học tập theo môn thế mạnh
    if (b.academicFit !== a.academicFit) return b.academicFit - a.academicFit;
    // 4. Ưu tiên độ tương thích MBTI
    if (b.mbtiFit !== a.mbtiFit) return b.mbtiFit - a.mbtiFit;
    return 0;
  });

  // Gán nhãn độ phù hợp
  result.forEach((x, idx) => {
    if (isDefaultOverview) {
      x.fitLevel = 'Khám phá tổng quan';
    } else {
      if (idx === 0) x.fitLevel = '🌟 Phù hợp nhất';
      else if (idx === 1) x.fitLevel = '✨ Phù hợp rất cao';
      else if (idx === 2) x.fitLevel = '✨ Phù hợp cao';
      else x.fitLevel = '👍 Khá phù hợp';
    }
  });

  // Xây dựng lập luận chi tiết, minh bạch cho từng ngành
  result.forEach(x => {
    // 1. Phân tích Điểm số & Năng lực học tập
    const relevantSubjects = [];
    x.subjectGroups.forEach(group => {
      for (const subj of group) {
        if (scores[subj] != null && scores[subj] !== '' && !isNaN(scores[subj])) {
          relevantSubjects.push(`${subj} (${scores[subj]})`);
          break;
        }
      }
    });

    let academicDetail = '';
    if (relevantSubjects.length) {
      academicDetail = `Các môn thế mạnh tương thích: <strong>${relevantSubjects.join(', ')}</strong> (Điểm TB chung: ${vals.length ? generalAvg.toFixed(1) : 'Chưa có'}). Rất phù hợp tổ hợp xét tuyển <strong>${x.bestCombo}</strong>.`;
    } else if (vals.length) {
      academicDetail = `Điểm trung bình các môn đã nhập đạt <strong>${generalAvg.toFixed(1)}</strong>. Nhóm ngành này phù hợp xét tuyển các tổ hợp: ${x.combinations.join(', ')}.`;
    } else {
      academicDetail = `Bạn chưa nhập điểm môn học cụ thể. Ngành này xét tuyển các tổ hợp: ${x.combinations.join(', ')}.`;
    }

    // 2. Phân tích MBTI & phong cách tư duy
    let mbtiDetail = '';
    if (mbti) {
      mbtiDetail = `Nhóm tính cách <strong>[${mbti.type}] ${mbti.title}</strong> (${mbti.vietnameseTrait}). ${mbti.desc} Phong cách tư duy và hành động này là ưu thế lớn trong môi trường ${x.name}.`;
    } else {
      mbtiDetail = `Dựa trên kết quả khảo sát, phong cách tư duy của bạn có xu hướng phù hợp với văn hóa làm việc của ngành ${x.name}.`;
    }

    // 3. Phân tích Sở thích & Đam mê
    let hobbyDetail = '';
    const selectedList = hobbies.selected || [];
    if (selectedList.length || hobbies.custom) {
      const allList = [...selectedList];
      if (hobbies.custom) allList.push(`"${hobbies.custom}"`);
      hobbyDetail = `Sở thích bạn đã chọn: <strong>${allList.slice(0, 5).join(', ')}${allList.length > 5 ? '...' : ''}</strong>. Sự say mê tự nhiên này mang lại động lực học tập và nghiên cứu bền bỉ.`;
    } else {
      hobbyDetail = 'Bạn chưa chọn danh mục sở thích cụ thể (có thể bổ sung tại bước Sở thích để tăng độ chuẩn xác).';
    }

    // 4. Phân tích Tiếng nói tự thân (Câu hỏi tự bộc lộ & Đáp án E)
    let selfReflectDetail = '';
    const hasAnyReflect = selfReflect.strengths || selfReflect.idealEnv || selfReflect.vision || customValues.length;
    if (hasAnyReflect) {
      const items = [];
      if (selfReflect.strengths) items.push(`<li><strong>Điểm mạnh tự tin nhất:</strong> "${selfReflect.strengths}"</li>`);
      if (selfReflect.idealEnv) items.push(`<li><strong>Môi trường làm việc mong muốn:</strong> "${selfReflect.idealEnv}"</li>`);
      if (selfReflect.vision) items.push(`<li><strong>Mục tiêu & khát vọng đóng góp:</strong> "${selfReflect.vision}"</li>`);
      if (customValues.length) items.push(`<li><strong>Phương án riêng ở phần trắc nghiệm (Đáp án E):</strong> "${customValues.slice(0, 2).join('; ')}"</li>`);
      selfReflectDetail = `<ul style="margin:4px 0 0 16px;padding:0;">${items.join('')}</ul>`;
    } else {
      selfReflectDetail = 'Bạn chưa điền phần câu hỏi tự bộc lộ (có thể bổ sung tại bước Khám phá tính cách để AI phân tích sâu hơn).';
    }

    x.evidence = {
      academic: academicDetail,
      mbti: mbtiDetail,
      hobby: hobbyDetail,
      selfReflect: selfReflectDetail,
      hasSelfReflect: !!hasAnyReflect
    };

    x.reason = `Điểm phù hợp được tổng hợp công bằng từ: ${relevantSubjects.length ? relevantSubjects.join(', ') : (generalAvg ? `Điểm TB ${generalAvg.toFixed(1)}` : 'Năng lực học tập')}, nhóm tính cách [${mbti ? mbti.type : 'MBTI'}], sở thích tự nhiên và định hướng cá nhân.`;
  });

  const displayGoal = goals.dreamMajor
    ? goals.dreamMajor
    : (goals.selected && goals.selected.length ? goals.selected.join(', ') : (goals.dreamCareer || 'Khám phá ngành nghề'));

  return {
    province: info.province,
    grade: info.grade,
    goals: goals.selected || [],
    goalText: displayGoal,
    selfReflect: selfReflect,
    isDefaultOverview: isDefaultOverview,
    results: result.slice(0, 6)
  };
}




// Tìm tỉnh/thành trong trang Thông tin
(function setupProvinceSearch(){
  const search = document.getElementById('provinceSearch');
  const select = document.getElementById('province');
  if (!search || !select) return;

  const provinces = Array.from(select.options)
    .slice(1)
    .map(o => o.textContent.trim());

  const normalize = s => s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

  search.addEventListener('input', function(){
    const keyword = normalize(this.value.trim());
    const current = select.value;
    select.innerHTML = '<option value="">-- Chọn tỉnh/thành --</option>';

    provinces
      .filter(name => !keyword || normalize(name).includes(keyword))
      .forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
      });

    if (provinces.includes(current)) select.value = current;
  });
})();
