
const NS_PREFIX = 'ns_';
const PROFILE_KEYS = ['info', 'scores', 'hobbies', 'personalityAnswers', 'personalityCustomAnswers', 'personalitySelfReflect', 'mbtiType', 'goals'];

function save(key, value, syncToAccount = true) {
  try {
    localStorage.setItem(NS_PREFIX + key, JSON.stringify(value));
    if (syncToAccount && PROFILE_KEYS.includes(key)) {
      syncCurrentProfileToAccount();
    }
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(NS_PREFIX + key));
  } catch (e) {
    return null;
  }
}

function resetAllData(showMessage = true) {
  const preservedKeys = ['ns_accounts', 'ns_current_user', 'ns_chat_sessions', 'ns_current_chat_id'];
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

// Kiểm tra dữ liệu thực tế đã hoàn thành cho từng bước
function isStepCompleted(stepNum) {
  try {
    switch (stepNum) {
      case 1: { // Bước 1: Thông tin
        const info = read('info');
        return !!(info && (info.province || info.grade));
      }
      case 2: { // Bước 2: Điểm số
        const scores = read('scores');
        if (!scores || typeof scores !== 'object') return false;
        return Object.values(scores).some(v => typeof v === 'number' && !isNaN(v));
      }
      case 3: { // Bước 3: Sở thích
        const hobbies = read('hobbies');
        if (!hobbies) return false;
        const hasSelected = Array.isArray(hobbies.selected) && hobbies.selected.length > 0;
        const hasCustom = typeof hobbies.custom === 'string' && hobbies.custom.trim().length > 0;
        return hasSelected || hasCustom;
      }
      case 4: { // Bước 4: Tính cách
        const answers = read('personalityAnswers');
        const customTraits = read('personalityCustomTraits');
        const selfReflect = read('personalitySelfReflect');
        const hasAnswers = Array.isArray(answers) && answers.length >= 4;
        const hasCustom = Array.isArray(customTraits) && customTraits.length > 0;
        const hasReflect = !!(selfReflect && (selfReflect.strengths || selfReflect.idealEnv || selfReflect.vision));
        return hasAnswers || hasCustom || hasReflect;
      }
      case 5: { // Bước 5: Mục tiêu
        const goals = read('goals');
        if (!goals) return false;
        const hasSelected = Array.isArray(goals.selected) && goals.selected.length > 0;
        const hasMajor = !!(goals.dreamMajor && goals.dreamMajor.trim());
        const hasCareer = !!(goals.dreamCareer && goals.dreamCareer.trim());
        const hasSchool = !!(goals.dreamSchool && goals.dreamSchool.trim());
        const hasLoc = !!(goals.studyLocation && goals.studyLocation.trim());
        const hasDream = !!(goals.dreamGoal && goals.dreamGoal.trim());
        return hasSelected || hasMajor || hasCareer || hasSchool || hasLoc || hasDream;
      }
      case 6: { // Bước 6: Kết quả
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

function initMainComponents() {
  renderAuthTopbar();
  renderOrientationStepper();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMainComponents);
} else {
  initMainComponents();
}

function loadInfo() {
  const d = read('info');
  if (!d) return;

  ['province', 'grade'].forEach(k => {
    const el = document.getElementById(k);
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

function computeMBTI(answers) {
  const savedType = typeof read === 'function' ? read('mbtiType') : null;
  if (!Array.isArray(answers) || answers.length === 0) {
    if (savedType && MBTI_INFO[savedType]) {
      return { type: savedType, ...MBTI_INFO[savedType], traits: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }, counts: {} };
    }
    return null;
  }

  // Đếm các xu hướng từ câu hỏi lựa chọn (0: logic, 1: people, 2: creative, 3: patient, 4: custom/E)
  const counts = { logic: 0, people: 0, creative: 0, patient: 0 };
  const customMap = typeof read === 'function' ? (read('personalityCustomAnswers') || {}) : {};

  answers.forEach((a, i) => {
    if (a === 0) counts.logic++;
    else if (a === 1) counts.people++;
    else if (a === 2) counts.creative++;
    else if (a === 3) counts.patient++;
    else if (a === 4) {
      const txt = (customMap[i] || '').toLowerCase();
      if (/toán|logic|phân tích|nghiên cứu|khoa học|công nghệ|lập trình|thuật toán/.test(txt)) counts.logic++;
      else if (/con người|giao tiếp|chia sẻ|lắng nghe|giúp đỡ|tư vấn|bạn bè|thấu cảm/.test(txt)) counts.people++;
      else if (/sáng tạo|nghệ thuật|đổi mới|tự do|ý tưởng|thiết kế|trực giác/.test(txt)) counts.creative++;
      else if (/cẩn thận|kiên nhẫn|kỷ luật|thực tế|chăm chỉ|ổn định|bài bản/.test(txt)) counts.patient++;
      else {
        counts.creative += 0.5;
        counts.logic += 0.5;
      }
    }
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top1 = sorted[0][0];
  const top2 = sorted[1] ? sorted[1][0] : null;

  // Xác định nhóm tính cách MBTI tương ứng với thế mạnh vượt trội
  let type = 'INTP';
  if (top1 === 'logic' && top2 === 'creative') type = 'INTP';
  else if (top1 === 'logic' && top2 === 'patient') type = 'INTJ';
  else if (top1 === 'logic') type = 'INTP';
  else if (top1 === 'people' && top2 === 'creative') type = 'ENFP';
  else if (top1 === 'people' && top2 === 'patient') type = 'ESFJ';
  else if (top1 === 'people') type = 'ENFJ';
  else if (top1 === 'creative' && top2 === 'logic') type = 'ENTP';
  else if (top1 === 'creative' && top2 === 'people') type = 'INFP';
  else if (top1 === 'creative') type = 'ISFP';
  else if (top1 === 'patient' && top2 === 'logic') type = 'ISTJ';
  else if (top1 === 'patient' && top2 === 'people') type = 'ISFJ';
  else if (top1 === 'patient') type = 'ESTJ';

  const info = MBTI_INFO[type] || { title: 'Nhóm tính cách đa diện', desc: 'Kết hợp hài hòa giữa các yếu tố tính cách.' };

  const vietnameseTrait = {
    logic: 'thiên về tư duy logic và phân tích',
    people: 'thiên về giao tiếp, thấu cảm và kết nối con người',
    creative: 'thiên về sáng tạo, trực giác và đổi mới',
    patient: 'thiên về kỷ luật, thực tế và kiên trì'
  }[top1] || 'đa diện';

  return {
    type,
    title: info.title,
    desc: info.desc,
    topTrait: top1,
    vietnameseTrait,
    counts
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

function analyzeCareer() {
  const info = typeof read === 'function' ? (read('info') || {}) : {};
  const scores = typeof read === 'function' ? (read('scores') || {}) : {};
  const hobbies = typeof read === 'function' ? (read('hobbies') || { selected: [], custom: '' }) : { selected: [], custom: '' };
  const answers = typeof read === 'function' ? (read('personalityAnswers') || []) : [];
  const customAnswers = typeof read === 'function' ? (read('personalityCustomAnswers') || {}) : {};
  const selfReflect = typeof read === 'function' ? (read('personalitySelfReflect') || { strengths: '', idealEnv: '', vision: '' }) : { strengths: '', idealEnv: '', vision: '' };
  const goals = typeof read === 'function' ? (read('goals') || { selected: [], other: '' }) : { selected: [], other: '' };

  const vals = Object.values(scores).filter(v => v !== '' && v != null && !isNaN(v)).map(Number);
  const generalAvg = vals.length
    ? vals.reduce((a, b) => a + b, 0) / vals.length
    : null;

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

  // Hàm tính điểm học lực theo môn xét tuyển thực tế (Tối đa 22 điểm)
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
      return (avg / 10) * 22;
    }

    // Nếu có điểm nhưng không trúng môn của ngành này, dùng điểm TB chung (nhân hệ số 0.65)
    return generalAvg != null ? (generalAvg / 10) * 14 : 12;
  }

  // Hàm tính độ tương thích sở thích (Tối đa 18 điểm, game đơn thuần không bị ngộ nhận là CNTT)
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
      score = 8 + (directMatches - 1) * 3.5;
    }
    if (entMatches > 0) {
      score += Math.min(3, entMatches * 1.5);
    }
    return Math.min(18, score);
  }

  // Hàm tính độ tương thích mục tiêu / ước mơ đã chọn (Tối đa 24 điểm - Tôn trọng tuyệt đối nguyện vọng học sinh)
  function calcGoalFit(keywords) {
    if (!wantedGoalText) return 0;
    const hasMatch = keywords.some(k => wantedGoalText.includes(k.toLowerCase()));
    return hasMatch ? 24 : 0;
  }

  // Hàm tính độ tương thích MBTI (Tối đa 12 điểm)
  const mbti = typeof computeMBTI === 'function' ? computeMBTI(answers) : null;
  function calcMBTI(preferredPairs) {
    if (!mbti) return 5; // Mức trung tính
    const t = mbti.type;
    let matchCount = 0;
    preferredPairs.forEach(pair => {
      if (pair.length === 2 && t.includes(pair[0]) && t.includes(pair[1])) {
        matchCount += 2;
      } else if (pair.length === 1 && t.includes(pair)) {
        matchCount += 1;
      }
    });
    return Math.min(12, 4 + matchCount * 3);
  }

  // Hàm tính độ tương thích câu trả lời tự bộc lộ (Tối đa 10 điểm)
  function calcReflectFit(keywords) {
    if (!openText) return 0;
    const matches = keywords.filter(k => openText.includes(k.toLowerCase())).length;
    return matches > 0 ? Math.min(10, 5 + (matches - 1) * 2.5) : 0;
  }

  // Danh mục 12 ngành đào tạo chuẩn mực tại các trường Đại học Việt Nam
  // TẤT CẢ các ngành đều bắt đầu từ base 40 đồng đều, tuyệt đối không ưu tiên thiên vị!
  const careersDefinition = [
    {
      name: 'Công nghệ thông tin & Lập trình phần mềm',
      base: 40,
      subjectGroups: [['Toán'], ['Vật lý'], ['Tiếng Anh', 'Tin học']],
      hobbyKeys: ['lập trình', 'code', 'website', 'phần mềm', 'ứng dụng web', 'app mobile', 'an ninh mạng', 'bảo mật', 'phần cứng', 'lắp ráp pc'],
      entHobbyKeys: ['game', 'esports'],
      goalKeys: ['công nghệ thông tin', 'cntt', 'lập trình', 'it', 'phần mềm', 'developer', 'an ninh mạng', 'coder', 'web', 'app'],
      mbtiPairs: ['NT', 'T', 'IN', 'INTJ', 'INTP', 'ENTP', 'ISTP'],
      reflectKeys: ['công nghệ', 'lập trình', 'code', 'phần mềm', 'máy tính', 'ai', 'dữ liệu', 'app'],
      combinations: ['A00 (Toán, Lý, Hóa)', 'A01 (Toán, Lý, Anh)', 'D01 (Toán, Văn, Anh)', 'D07 (Toán, Hóa, Anh)'],
      bestCombo: 'A00 hoặc A01',
      advice: 'Nên ưu tiên khối A00 hoặc A01 nếu có thế mạnh tự nhiên; hoặc D01 nếu tự tin môn Tiếng Anh.'
    },
    {
      name: 'Kinh tế / Quản trị kinh doanh & Marketing',
      base: 40,
      subjectGroups: [['Toán'], ['Tiếng Anh'], ['Ngữ văn']],
      hobbyKeys: ['kinh doanh', 'khởi nghiệp', 'tài chính', 'chứng khoán', 'marketing', 'bán hàng', 'thương mại', 'logistics', 'đàm phán', 'quản lý', 'nghiên cứu hành vi', 'lãnh đạo'],
      entHobbyKeys: ['chiến thuật', 'board game'],
      goalKeys: ['kinh tế', 'quản trị kinh doanh', 'qtkd', 'marketing', 'tài chính', 'ngân hàng', 'kinh doanh', 'logistics', 'doanh nhân', 'ceo', 'thương mại', 'xuất nhập khẩu'],
      mbtiPairs: ['ET', 'E', 'ES', 'ENTJ', 'ESTJ', 'ENFJ', 'ESFJ'],
      reflectKeys: ['kinh doanh', 'khởi nghiệp', 'tài chính', 'quản lý', 'marketing', 'doanh nghiệp', 'lãnh đạo'],
      combinations: ['A01 (Toán, Lý, Anh)', 'D01 (Toán, Văn, Anh)', 'A00 (Toán, Lý, Hóa)', 'D07 (Toán, Hóa, Anh)'],
      bestCombo: 'D01 hoặc A01',
      advice: 'Khối D01 và A01 có chỉ tiêu lớn nhất tại các trường như Ngoại thương, Kinh tế Quốc dân, UEH.'
    },
    {
      name: 'Y khoa / Dược học & Khoa học sức khỏe',
      base: 40,
      subjectGroups: [['Sinh học'], ['Hóa học'], ['Toán']],
      hobbyKeys: ['y học', 'dược', 'sức khỏe', 'thảo dược', 'bệnh', 'sơ cấp cứu', 'dinh dưỡng', 'sinh học', 'hóa học', 'thực nghiệm'],
      entHobbyKeys: ['chăm sóc', 'thú cưng'],
      goalKeys: ['bác sĩ', 'y khoa', 'y đa khoa', 'dược sĩ', 'dược', 'y tế', 'điều dưỡng', 'nha sĩ', 'răng hàm mặt', 'bệnh viện', 'cứu người'],
      mbtiPairs: ['IF', 'IS', 'ISFJ', 'INFJ', 'ISTJ', 'ISFP', 'ESFJ'],
      reflectKeys: ['bác sĩ', 'y tế', 'chữa bệnh', 'cứu người', 'dược', 'sức khỏe', 'bệnh viện', 'y khoa'],
      combinations: ['B00 (Toán, Hóa, Sinh)', 'A00 (Toán, Lý, Hóa)', 'D07 (Toán, Hóa, Anh)'],
      bestCombo: 'B00',
      advice: 'Khối B00 là con đường cốt lõi cho Y đa khoa; ngành Dược mở rộng thêm xét tuyển khối A00 và D07.'
    },
    {
      name: 'Khoa học máy tính & Trí tuệ nhân tạo (AI)',
      base: 40,
      subjectGroups: [['Toán'], ['Tin học', 'Vật lý'], ['Tiếng Anh']],
      hobbyKeys: ['ai', 'trí tuệ nhân tạo', 'machine learning', 'dữ liệu', 'khoa học', 'thuật toán', 'data science', 'toán nâng cao', 'robot'],
      entHobbyKeys: ['rubik', 'đố vui logic'],
      goalKeys: ['trí tuệ nhân tạo', 'ai', 'khoa học máy tính', 'khoa học dữ liệu', 'data scientist', 'machine learning', 'kỹ sư ai'],
      mbtiPairs: ['NT', 'IN', 'INTP', 'INTJ', 'ENTP'],
      reflectKeys: ['ai', 'trí tuệ nhân tạo', 'dữ liệu', 'khoa học', 'toán', 'robot', 'thuật toán'],
      combinations: ['A00 (Toán, Lý, Hóa)', 'A01 (Toán, Lý, Anh)', 'D01 (Toán, Văn, Anh)'],
      bestCombo: 'A00 hoặc A01',
      advice: 'Môn Toán tư duy logic và thuật toán là chìa khóa then chốt cho ngành AI & Khoa học dữ liệu.'
    },
    {
      name: 'Kỹ thuật / Cơ điện tử & Tự động hóa',
      base: 40,
      subjectGroups: [['Toán'], ['Vật lý'], ['Hóa học', 'Tin học']],
      hobbyKeys: ['kỹ thuật', 'cơ khí', 'ô tô', 'máy bay', 'chế tạo', 'mạch điện', 'in 3d', 'lắp ráp', 'tự động', 'robot'],
      entHobbyKeys: ['đồ chơi số', 'diy'],
      goalKeys: ['kỹ thuật', 'cơ khí', 'chế tạo', 'ô tô', 'điện', 'tự động hóa', 'cơ điện tử', 'kỹ sư', 'hàng không'],
      mbtiPairs: ['ST', 'ISTJ', 'ISTP', 'ESTP', 'INTJ'],
      reflectKeys: ['kỹ thuật', 'cơ khí', 'chế tạo', 'máy móc', 'ô tô', 'robot', 'lắp ráp'],
      combinations: ['A00 (Toán, Lý, Hóa)', 'A01 (Toán, Lý, Anh)', 'C01 (Toán, Văn, Lý)'],
      bestCombo: 'A00 hoặc A01',
      advice: 'Nên tập trung tối đa vào cặp môn Toán - Lý để xét tuyển vào các trường kỹ thuật hàng đầu.'
    },
    {
      name: 'Luật / Ngoại giao & Khoa học xã hội',
      base: 40,
      subjectGroups: [['Ngữ văn'], ['Tiếng Anh'], ['Lịch sử', 'Giáo dục công dân']],
      hobbyKeys: ['luật', 'công lý', 'pháp luật', 'tranh biện', 'thuyết trình', 'ngoại giao', 'lịch sử', 'triết học', 'xã hội'],
      entHobbyKeys: ['đọc sách'],
      goalKeys: ['luật', 'luật sư', 'pháp lý', 'thẩm phán', 'kiểm sát', 'tòa án', 'ngoại giao', 'nhân quyền', 'chính trị'],
      mbtiPairs: ['TJ', 'ENTJ', 'INTJ', 'ENFJ', 'ESTJ'],
      reflectKeys: ['luật', 'công lý', 'pháp luật', 'tranh biện', 'thuyết trình', 'ngoại giao'],
      combinations: ['D01 (Toán, Văn, Anh)', 'C00 (Văn, Sử, Địa)', 'A01 (Toán, Lý, Anh)', 'D14 (Văn, Sử, Anh)'],
      bestCombo: 'D01 hoặc C00',
      advice: 'Khối D01 mang lại cơ hội xét tuyển rộng nhất; khối C00 có lợi thế lớn với ngành Luật và Tòa án.'
    },
    {
      name: 'Truyền thông / Báo chí & Quan hệ công chúng (PR)',
      base: 40,
      subjectGroups: [['Ngữ văn'], ['Tiếng Anh'], ['Lịch sử', 'Toán']],
      hobbyKeys: ['báo chí', 'truyền thông', 'podcast', 'nội dung', 'phóng sự', 'viết lách', 'mc', 'truyền hình', 'phát thanh', 'quảng cáo'],
      entHobbyKeys: ['mạng xã hội', 'nghe podcast'],
      goalKeys: ['báo chí', 'truyền thông', 'nhà báo', 'biên tập viên', 'pr', 'quan hệ công chúng', 'copywriter', 'content creator', 'mc'],
      mbtiPairs: ['EN', 'ENFP', 'ENTP', 'ENFJ', 'ESFP'],
      reflectKeys: ['báo chí', 'truyền thông', 'viết lách', 'sáng tạo nội dung', 'podcast'],
      combinations: ['D01 (Toán, Văn, Anh)', 'C00 (Văn, Sử, Địa)', 'D14 (Văn, Sử, Anh)'],
      bestCombo: 'D01 hoặc C00',
      advice: 'Ngành truyền thông đòi hỏi khả năng sáng tạo ngôn từ sắc bén kết hợp cùng kỹ năng số hóa.'
    },
    {
      name: 'Sư phạm & Quản lý giáo dục',
      base: 40,
      subjectGroups: [['Ngữ văn', 'Toán'], ['Tiếng Anh', 'Lịch sử', 'Vật lý']],
      hobbyKeys: ['giảng dạy', 'truyền cảm hứng', 'giáo dục', 'dạy học', 'học sinh', 'sư phạm', 'kèm cặp', 'chia sẻ'],
      entHobbyKeys: ['đọc sách'],
      goalKeys: ['giáo viên', 'sư phạm', 'giảng viên', 'dạy học', 'thầy giáo', 'cô giáo', 'giáo dục'],
      mbtiPairs: ['FJ', 'ESFJ', 'ENFJ', 'ISFJ', 'INFJ'],
      reflectKeys: ['dạy học', 'giảng dạy', 'giáo dục', 'truyền cảm hứng', 'học sinh', 'sư phạm'],
      combinations: ['C00 (Văn, Sử, Địa)', 'D01 (Toán, Văn, Anh)', 'A00 (Toán, Lý, Hóa)', 'B00 (Toán, Hóa, Sinh)'],
      bestCombo: 'Tùy bộ môn chuyên ngành',
      advice: 'Chọn tổ hợp có môn bạn muốn giảng dạy (Dạy Toán - A00/A01; Dạy Văn/Sử - C00/D01; Dạy Ngoại ngữ - D01).'
    },
    {
      name: 'Thiết kế đồ họa / Mỹ thuật số & Đa phương tiện',
      base: 40,
      subjectGroups: [['Tiếng Anh'], ['Ngữ văn'], ['Toán', 'Tin học']],
      hobbyKeys: ['vẽ', 'vẽ tranh', 'digital art', 'đồ họa', 'thiết kế', 'graphic design', 'chụp ảnh', 'nhiếp ảnh', 'kịch bản', 'manga', 'thời trang', 'nội thất', 'làm phim', 'video'],
      entHobbyKeys: ['xem phim', 'game'],
      goalKeys: ['thiết kế đồ họa', 'designer', 'graphic design', 'họa sĩ', 'thiết kế', 'digital art', 'ui/ux', 'dựng phim', 'hoạt hình', 'kiến trúc'],
      mbtiPairs: ['FP', 'ISFP', 'INFP', 'ENFP', 'INTP'],
      reflectKeys: ['thiết kế', 'nghệ thuật', 'đồ họa', 'sáng tạo', 'hình ảnh', 'mỹ thuật'],
      combinations: ['D01 (Toán, Văn, Anh)', 'V00 (Toán, Lý, Vẽ)', 'H00 (Văn, Vẽ, Vẽ)', 'A01 (Toán, Lý, Anh)'],
      bestCombo: 'D01 hoặc V00',
      advice: 'Rất phù hợp với bạn trẻ có gu thẩm mỹ cao, đam mê nghệ thuật thị giác và truyền thông số.'
    },
    {
      name: 'Tâm lý học & Dịch vụ tham vấn / Xã hội',
      base: 40,
      subjectGroups: [['Ngữ văn'], ['Sinh học'], ['Tiếng Anh', 'Toán']],
      hobbyKeys: ['tâm lý', 'tâm lý học', 'thấu hiểu cảm xúc', 'lắng nghe', 'tâm sự', 'tư vấn', 'thiện nguyện', 'hoạt động tình nguyện'],
      entHobbyKeys: ['yoga', 'thiền định'],
      goalKeys: ['tâm lý', 'tâm lý học', 'chuyên viên tâm lý', 'tư vấn tâm lý', 'trị liệu', 'tham vấn'],
      mbtiPairs: ['NF', 'INFJ', 'INFP', 'ENFJ', 'ISFJ'],
      reflectKeys: ['tâm lý', 'thấu hiểu', 'lắng nghe', 'chia sẻ', 'chữa lành', 'con người'],
      combinations: ['D01 (Toán, Văn, Anh)', 'B00 (Toán, Hóa, Sinh)', 'C00 (Văn, Sử, Địa)'],
      bestCombo: 'D01 hoặc B00',
      advice: 'Nhu cầu chuyên viên tư vấn tâm lý học đường và trị liệu cảm xúc đang tăng trưởng nhanh chóng.'
    },
    {
      name: 'Du lịch / Quản trị khách sạn & Dịch vụ F&B',
      base: 40,
      subjectGroups: [['Tiếng Anh'], ['Địa lý', 'Ngữ văn'], ['Lịch sử', 'Toán']],
      hobbyKeys: ['du lịch', 'đi phượt', 'khám phá', 'khách sạn', 'nấu ăn', 'ẩm thực', 'làm bánh', 'cà phê', 'barista', 'cắm trại'],
      entHobbyKeys: ['phượt', 'camping'],
      goalKeys: ['du lịch', 'quản trị khách sạn', 'khách sạn', 'hướng dẫn viên', 'resort', 'nhà hàng', 'f&b', 'đầu bếp', 'lữ hành'],
      mbtiPairs: ['ES', 'ESFP', 'ESTP', 'ESFJ', 'ENFP'],
      reflectKeys: ['du lịch', 'khách sạn', 'ẩm thực', 'trải nghiệm', 'giao tiếp'],
      combinations: ['D01 (Toán, Văn, Anh)', 'D14 (Văn, Sử, Anh)', 'D15 (Văn, Địa, Anh)', 'C00 (Văn, Sử, Địa)'],
      bestCombo: 'D01 hoặc D14',
      advice: 'Khả năng ngoại ngữ tốt và sự năng động, mến khách là lợi thế cạnh tranh hàng đầu.'
    },
    {
      name: 'Ngôn ngữ học & Biên phiên dịch quốc tế',
      base: 40,
      subjectGroups: [['Tiếng Anh'], ['Ngữ văn'], ['Lịch sử', 'Địa lý']],
      hobbyKeys: ['học ngoại ngữ', 'tiếng anh', 'tiếng trung', 'tiếng hàn', 'tiếng nhật', 'giao lưu văn hóa', 'đọc sách ngoại văn', 'dịch thuật'],
      entHobbyKeys: ['xem phim nước ngoài'],
      goalKeys: ['ngôn ngữ', 'ngôn ngữ anh', 'biên dịch', 'phiên dịch', 'dịch thuật', 'tiếng trung', 'tiếng hàn', 'tiếng nhật', 'ngoại ngữ'],
      mbtiPairs: ['IN', 'INFJ', 'INFP', 'ENFP', 'ISFP'],
      reflectKeys: ['ngoại ngữ', 'ngôn ngữ', 'tiếng anh', 'dịch thuật', 'văn hóa quốc tế'],
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

  // Sắp xếp giảm dần theo điểm số phù hợp
  result.sort((a, b) => b.score - a.score);

  // Gán nhãn độ phù hợp
  result.forEach((x, idx) => {
    if (idx === 0) x.fitLevel = '🌟 Phù hợp nhất';
    else if (idx === 1) x.fitLevel = '✨ Phù hợp rất cao';
    else if (idx === 2) x.fitLevel = '✨ Phù hợp cao';
    else x.fitLevel = '👍 Khá phù hợp';
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