/**
 * NS AI - Chatbot Assistant
 * Phiên bản AI Hội Thoại Tự Nhiên & Linh Hoạt:
 * - Tự động nhận diện từ viết tắt, teen-code và lỗi chính tả (tài liều -> tài liệu, k/ko -> không, dc -> được...)
 * - Trả lời đa dạng, tự nhiên như ChatGPT/Gemini
 * - Hỗ trợ đầy đủ: Tài liệu học tập, phương pháp ôn thi, mức lương, học phí, định hướng ngành & tổ hợp xét tuyển.
 */

// Quản lý trạng thái hội thoại để chống lặp lại
const chatState = {
  lastTopic: null,
  topicCounts: {},
  lastAnswer: '',
  isSending: false,
  fallbackIndex: 0,
  activeRoleplay: null
};

// Chuẩn hóa câu hỏi: xử lý từ viết tắt, teen code, lỗi chính tả gõ vội
function normalizeQuery(text) {
  if (!text) return '';
  let s = ' ' + text.toLowerCase().trim() + ' ';

  // Sửa lỗi gõ vội, telex và unaccented phổ biến (dùng replace global không phụ thuộc word boundary)
  s = s.replace(/tài li[eề]u/gi, 'tài liệu');
  s = s.replace(/tai lieu/gi, 'tài liệu');
  s = s.replace(/hoc tap/gi, 'học tập');
  s = s.replace(/nganh/gi, 'ngành');
  s = s.replace(/truong/gi, 'trường');
  s = s.replace(/diem/gi, 'điểm');

  // Chuẩn hóa động lực & cảm xúc học đường
  s = s.replace(/m[aấ]t đ[oộ]ng l[uự]c/gi, 'mất động lực');
  s = s.replace(/mat dong luc/gi, 'mất động lực');
  s = s.replace(/h[eế]t đ[oộ]ng l[uự]c/gi, 'hết động lực');
  s = s.replace(/het dong luc/gi, 'hết động lực');
  s = s.replace(/khong co dong luc/gi, 'không có động lực');
  s = s.replace(/thieu dong luc/gi, 'thiếu động lực');
  s = s.replace(/(t[uụ]t|down|tot)\s*mood/gi, 'tụt mood');
  s = s.replace(/ch[aá]n\s*h[oọ]c/gi, 'chán học');
  s = s.replace(/chan hoc/gi, 'chán học');
  s = s.replace(/l[uư][oờ]i\s*h[oọ]c/gi, 'lười học');
  s = s.replace(/luoi hoc/gi, 'lười học');
  s = s.replace(/l[uư][oờ]i\s*bi[eế]ng/gi, 'lười biếng');
  s = s.replace(/luoi bieng/gi, 'lười biếng');
  s = s.replace(/n[aả]n\s*l[oò]ng/gi, 'nản lòng');
  s = s.replace(/nan long|nan qua/gi, 'nản lòng');
  s = s.replace(/m[oô]ng\s*lung/gi, 'mông lung');
  s = s.replace(/mong lung/gi, 'mông lung');
  s = s.replace(/m[aấ]t\s*ph[uư][oơ]ng\s*h[uư][oớ]ng/gi, 'mất phương hướng');
  s = s.replace(/mat phuong huong/gi, 'mất phương hướng');
  s = s.replace(/bu[oô]ng\s*xu[oô]i/gi, 'buông xuôi');
  s = s.replace(/buong xuoi/gi, 'buông xuôi');
  s = s.replace(/ki[eệ]t\s*s[uứ]c/gi, 'kiệt sức');
  s = s.replace(/kiet suc/gi, 'kiệt sức');
  s = s.replace(/h[oọ]c\s*đ[eể]\s*l[aà]m\s*g[iì]/gi, 'học để làm gì');
  s = s.replace(/hoc de lam gi/gi, 'học để làm gì');

  // Chuẩn hóa từ ngữ tâm lý & cảm xúc
  s = s.replace(/(tam su|tamsu)/gi, 'tâm sự');
  s = s.replace(/(tam ly|tamly)/gi, 'tâm lý');
  s = s.replace(/(tu van|tuvan)/gi, 'tư vấn');
  s = s.replace(/(lang nghe|langnghe)/gi, 'lắng nghe');
  s = s.replace(/(ap luc|apluc)/gi, 'áp lực');
  s = s.replace(/(met moi|metmoi)/gi, 'mệt mỏi');
  s = s.replace(/(bo me|ba me|bame|chame|cha me)/gi, 'bố mẹ');
  s = s.replace(/(truot|rot)/gi, 'trượt');
  s = s.replace(/(giong noi|giongnoi)/gi, 'giọng nói');

  // Chuẩn hóa từ viết tắt & teen code an toàn với tiếng Việt
  s = s.replace(/(\s|^)(k|ko|kh|khum|hong|hổng|hông)(\s|$)/gi, '$1không$3');
  s = s.replace(/(\s|^)(dc|đc)(\s|$)/gi, '$1được$3');
  s = s.replace(/(\s|^)(ng|ngừoi|nguoi)(\s|$)/gi, '$1người$3');
  s = s.replace(/(\s|^)(sv)(\s|$)/gi, '$1sinh viên$3');
  s = s.replace(/(\s|^)(hs)(\s|$)/gi, '$1học sinh$3');
  s = s.replace(/(\s|^)(đh|dh)(\s|$)/gi, '$1đại học$3');
  s = s.replace(/(\s|^)(thpt|c3)(\s|$)/gi, '$1cấp 3$3');
  s = s.replace(/(\s|^)(ntn|the nao|thế lào)(\s|$)/gi, '$1như thế nào$3');
  s = s.replace(/(\s|^)(j|jh|cj|chi)(\s|$)/gi, '$1gì$3');
  s = s.replace(/(\s|^)(mik|mk)(\s|$)/gi, '$1mình$3');
  s = s.replace(/(\s|^)(lm)(\s|$)/gi, '$1làm$3');
  s = s.replace(/(\s|^)(vs)(\s|$)/gi, '$1với$3');
  s = s.replace(/(\s|^)(cx)(\s|$)/gi, '$1cũng$3');
  s = s.replace(/(\s|^)(bt|bthg)(\s|$)/gi, '$1bình thường$3');
  s = s.replace(/(\s|^)(kt)(\s|$)/gi, '$1kinh tế$3');
  s = s.replace(/(\s|^)(cntt|it)(\s|$)/gi, '$1công nghệ thông tin$3');
  s = s.replace(/(\s|^)(dgnl|đgnl)(\s|$)/gi, '$1đánh giá năng lực$3');
  s = s.replace(/(\s|^)(dgtd|đgtd)(\s|$)/gi, '$1đánh giá tư duy$3');
  s = s.replace(/(\s|^)(tl|tlh)(\s|$)/gi, '$1tài liệu$3');
  s = s.replace(/(\s|^)(vv)(\s|$)/gi, '$1vân vân$3');

  return s.trim();
}

function formatMsg(text) {
  if (!text) return '';
  // Đổi **in đậm** thành <strong>
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return html;
}

// =================== XỬ LÝ LẮNG NGHE GIỌNG NÓI & ĐỌC THÀNH TIẾNG ===================
let speechRecogInstance = null;
let isRecogListening = false;
let autoReadBotReply = false;

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recog = new SpeechRecognition();
  recog.lang = 'vi-VN';
  recog.continuous = false;
  recog.interimResults = true;

  recog.onstart = () => {
    isRecogListening = true;
    updateMicButtonUI(true);
    setVoiceStatus('🎙️ <strong>Đang lắng nghe bạn nói...</strong> Bạn hãy nói câu hỏi hoặc tâm sự của mình nhé!');
  };

  recog.onresult = (event) => {
    let interim = '';
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const trans = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += trans;
      } else {
        interim += trans;
      }
    }

    const inputEl = document.getElementById('input');
    if (inputEl) {
      inputEl.value = finalTranscript || interim;
    }

    if (finalTranscript) {
      setVoiceStatus(`✅ <em>Đã nghe được:</em> "${finalTranscript}"`);
      setTimeout(() => {
        clearVoiceStatus();
        send();
      }, 650);
    }
  };

  recog.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    isRecogListening = false;
    updateMicButtonUI(false);
    if (event.error === 'not-allowed') {
      setVoiceStatus('⚠️ Bạn chưa cấp quyền truy cập Micro cho trình duyệt. Hãy cho phép quyền Micro để nói chuyện nhé!');
    } else if (event.error === 'no-speech') {
      setVoiceStatus('Chưa bắt được giọng nói. Bạn hãy bấm lại nút 🎙️ và nói to rõ hơn một chút nhé!');
      setTimeout(clearVoiceStatus, 2500);
    } else {
      setVoiceStatus('Đã dừng nghe. Bấm 🎙️ để nói lại bất kỳ lúc nào.');
      setTimeout(clearVoiceStatus, 2000);
    }
  };

  recog.onend = () => {
    isRecogListening = false;
    updateMicButtonUI(false);
  };

  return recog;
}

function toggleSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Trình duyệt hiện tại chưa hỗ trợ Web Speech API. Bạn vui lòng sử dụng Google Chrome, Cốc Cốc, Microsoft Edge hoặc Safari để trải nghiệm tính năng nói chuyện qua Micro nhé! ✨');
    return;
  }

  if (!speechRecogInstance) {
    speechRecogInstance = initSpeechRecognition();
  }

  if (!speechRecogInstance) return;

  if (isRecogListening) {
    try { speechRecogInstance.stop(); } catch(e){}
    isRecogListening = false;
    updateMicButtonUI(false);
    clearVoiceStatus();
  } else {
    try {
      speechRecogInstance.start();
    } catch (e) {
      console.warn('Speech start caught, restarting...', e);
      speechRecogInstance = initSpeechRecognition();
      try { speechRecogInstance.start(); } catch(err){ console.error(err); }
    }
  }
}

function updateMicButtonUI(listening) {
  const btn = document.getElementById('btnMic');
  if (!btn) return;
  if (listening) {
    btn.classList.add('listening');
    btn.title = 'Đang nghe bạn nói... Bấm để dừng';
  } else {
    btn.classList.remove('listening');
    btn.title = 'Bấm để nói (Lắng nghe bằng giọng nói)';
  }
}

function setVoiceStatus(msg) {
  const el = document.getElementById('voiceStatus');
  if (!el) return;
  el.innerHTML = msg;
  el.style.display = 'flex';
}

function clearVoiceStatus() {
  const el = document.getElementById('voiceStatus');
  if (el) el.style.display = 'none';
}

// ĐỌC THÀNH TIẾNG (TEXT TO SPEECH)
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();

    // Làm sạch ký tự markdown, bullets, emojis để đọc mượt mà
    let clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/•/g, '')
      .replace(/[*#_`~>→]/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return;

    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'vi-VN';
    utter.rate = 1.02;
    utter.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VI'));
    if (viVoice) {
      utter.voice = viVoice;
    }

    window.speechSynthesis.speak(utter);
  } catch (err) {
    console.warn('TTS error:', err);
  }
}

function toggleAutoSpeak() {
  autoReadBotReply = !autoReadBotReply;
  const btn = document.getElementById('btnVoiceToggle');
  if (btn) {
    if (autoReadBotReply) {
      btn.innerHTML = '🔊';
      btn.classList.add('active');
      btn.title = 'Đang BẬT đọc tự động câu trả lời (Bấm để tắt)';
      speakText('Đã bật tính năng đọc câu trả lời bằng giọng nói.');
    } else {
      btn.innerHTML = '🔇';
      btn.classList.remove('active');
      btn.title = 'Đang TẮT đọc tự động câu trả lời (Bấm để bật)';
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  }
}

function speakMessage(btn) {
  const msgEl = btn.closest('.msg');
  if (!msgEl) return;
  const clone = msgEl.cloneNode(true);
  const tools = clone.querySelector('.msg-tools');
  if (tools) tools.remove();
  const text = clone.innerText.trim();
  speakText(text);
}

function addMsg(text, who = 'bot') {
  const box = document.getElementById('messages');
  if (!box) return;

  const d = document.createElement('div');
  d.className = 'msg ' + who;

  if (who === 'bot') {
    d.innerHTML = formatMsg(text) +
      `<div class="msg-tools">` +
      `<button type="button" class="btn-read-msg" title="Nghe đọc đoạn này" onclick="speakMessage(this)">🔊 Nghe đọc</button>` +
      `</div>`;

    if (autoReadBotReply) {
      speakText(text);
    }
  } else {
    // User message: thoát ký tự HTML để an toàn
    d.textContent = text;
  }

  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
}

function getChatContext() {
  const p = typeof getProfile === 'function' ? getProfile() : {};
  const result = typeof analyzeCareer === 'function' ? analyzeCareer() : { results: [] };
  const results = result.results || [];
  const top = results[0] || null;

  const province = (p.info && p.info.province) ? p.info.province : 'chưa chọn tỉnh/thành';
  const grade = (p.info && p.info.grade) ? `lớp ${p.info.grade}` : 'học sinh THPT';
  const goal = (p.goals && p.goals.dreamMajor)
    ? `ngành ${p.goals.dreamMajor}`
    : ((p.goals && p.goals.dreamCareer)
      ? `nghề ${p.goals.dreamCareer}`
      : (((p.goals && p.goals.selected) || []).length
        ? p.goals.selected.join(', ')
        : 'khám phá ngành nghề phù hợp'));
  const hobbies = ((p.hobbies && p.hobbies.selected) || []).join(', ') || 'chưa có';
  const custom = (p.hobbies && p.hobbies.custom) ? `; ${p.hobbies.custom}` : '';
  const goals = ((p.goals && p.goals.selected) || []).join(', ') || 'chưa có';
  const other = (p.goals && p.goals.other) ? `; ${p.goals.other}` : '';
  const avg = (p.avg != null) ? Number(p.avg).toFixed(1) : null;

  // Lấy các môn có điểm cao nhất và thấp nhất
  const scores = (p.scores) || {};
  const scoreEntries = Object.entries(scores)
    .filter(([_, v]) => typeof v === 'number' && !isNaN(v))
    .sort((a, b) => b[1] - a[1]);

  const bestSubjects = scoreEntries.slice(0, 3);
  const lowestSubjects = scoreEntries.slice(-2);

  // Lấy dữ liệu trường học nếu có
  const schools = (typeof window !== 'undefined' && Array.isArray(window.DEFAULT_SCHOOLS_DATA))
    ? window.DEFAULT_SCHOOLS_DATA
    : [];

  const customAnswers = (p.customPersonalityAnswers && Array.isArray(p.customPersonalityAnswers))
    ? p.customPersonalityAnswers
    : (typeof read === 'function' ? (read('customPersonalityAnswers') || []) : []);

  return {
    p,
    top,
    results,
    province,
    grade,
    goal,
    hobbies,
    custom,
    goals,
    other,
    avg,
    scores,
    bestSubjects,
    lowestSubjects,
    schools,
    customAnswers
  };
}

function recordTopic(topic) {
  chatState.topicCounts[topic] = (chatState.topicCounts[topic] || 0) + 1;
  chatState.lastTopic = topic;
  return chatState.topicCounts[topic];
}

// ==========================================
// TÍNH MỚI ĐỘT PHÁ KHKT: MÔ PHỎNG TRẢI NGHIỆM THỬ 1 NGÀY LÀM NGHỀ
// ==========================================
const ROLEPLAY_SCENARIOS = {
  it: {
    id: 'it',
    career: 'Công nghệ Thông tin & Kỹ thuật Phần mềm',
    context: '22:00 đêm trước đợt mở cổng đăng ký vé Tết, hệ thống ứng dụng đặt vé do nhóm kỹ sư của bạn phụ trách bất ngờ ghi nhận lượng người truy cập tăng vọt gấp 8 lần dự kiến. Cơ sở dữ liệu bị nghẽn (CPU máy chủ chạm 98%), một số người dùng bắt đầu bị kẹt giao dịch. Bạn đang là kỹ sư trực chính chịu trách nhiệm vận hành.',
    challenge: 'Để bảo vệ toàn bộ hệ thống và phục vụ hàng vạn khách hàng an toàn, bạn sẽ đưa ra quyết định kỹ thuật nào dưới đây?',
    choices: {
      A: {
        text: 'Kích hoạt ngay cơ chế Hàng đợi thông minh (Virtual Queue) và tự động nhân bản máy chủ (Auto-scaling) để giãn tải, ưu tiên giữ an toàn dữ liệu và luồng thanh toán cốt lõi.',
        role: 'Kiến trúc sư Hệ thống & Kỹ sư Vận hành (System Architect / DevOps)',
        analysis: 'Bạn sở hữu tư duy hệ thống xuất sắc và phản xạ bảo vệ tính sẵn sàng cao (High Availability). Trong ngành phần mềm hiện đại, việc sử dụng cơ chế đệm tự động thay vì can thiệp chắp vá là chuẩn mực cao nhất để hệ thống chịu tải quy mô lớn.',
        suitableRoles: 'Kỹ sư phần mềm, Điện toán đám mây, Quản trị hệ thống, Trí tuệ nhân tạo'
      },
      B: {
        text: 'Tạm thời ngắt các tính năng phụ tải nặng (như gợi ý chỗ ngồi, lịch sử đặt vé, hiệu ứng động) và giải phóng bộ nhớ đệm (Cache) để dồn 100% tài nguyên cho việc thanh toán.',
        role: 'Nhà Quản trị Sản phẩm & Kỹ sư Thực chiến (Pragmatic Engineer / Product Owner)',
        analysis: 'Bạn có tư duy "hy sinh tính năng phụ để bảo vệ huyết mạch chính" cực kỳ thực tế. Kỹ năng xác định mức độ ưu tiên (Prioritization) dưới áp lực khẩn cấp là tố chất lãnh đạo công nghệ quan trọng.',
        suitableRoles: 'Phát triển Web/App, Quản lý sản phẩm công nghệ (PM), Tối ưu hiệu năng'
      },
      C: {
        text: 'Chủ động thông báo bảo trì khẩn cấp 15 phút trên trang chủ và mạng xã hội để toàn đội ngũ kiểm tra mã nguồn, tìm điểm nghẽn bộ nhớ và khởi động lại dịch vụ an toàn.',
        role: 'Kỹ sư Kiểm chuẩn Chất lượng & An ninh Thông tin (QA / Cyber Security)',
        analysis: 'Bạn cẩn trọng, tôn trọng an toàn dữ liệu và tính minh bạch với người dùng. Dù bảo trì có thể gây gián đoạn ngắn hạn, nó triệt tiêu rủi ro sai lệch dữ liệu tài chính nghiêm trọng.',
        suitableRoles: 'An toàn thông tin, Kỹ thuật dữ liệu, Kiểm thử phần mềm'
      }
    },
    highschoolAdvice: 'Tập trung học tốt môn Toán và Tin học (tư duy logic & giải thuật), tham gia các câu lạc bộ Robotics/Lập trình và tìm hiểu các dự án mã nguồn mở.'
  },
  business: {
    id: 'business',
    career: 'Kinh tế, Quản trị Kinh doanh & Marketing',
    context: 'Bạn là Trưởng nhóm Dự án ra mắt dòng balo học sinh chống gù thông minh. Sau tuần đầu chi 50% ngân sách quảng cáo, lượng xem video trên mạng xã hội đạt 500.000 lượt nhưng tỷ lệ đặt hàng chỉ đạt 3% chỉ tiêu. Khách hàng bình luận: "Balo nhìn đẹp nhưng giá 450k hơi cao và chưa biết có chống gù thật không".',
    challenge: 'Ngân sách tuần 2 chỉ còn lại một nửa, bạn sẽ điều chỉnh chiến lược tiếp thị và kinh doanh như thế nào?',
    choices: {
      A: {
        text: 'Tạm dừng quảng cáo diện rộng; chuyển ngân sách sản xuất video thực nghiệm đo lực cột sống, đựng 10kg sách và mời các bác sĩ cơ xương khớp hoặc thầy cô uy tín trải nghiệm chứng thực.',
        role: 'Nhà Chiến lược Tiếp thị Dựa trên Dữ liệu & Tâm lý Người tiêu dùng (Data-driven Marketer)',
        analysis: 'Bạn phát hiện chính xác "nỗi đau của khách hàng" (Customer Pain Point) là thiếu niềm tin về công năng. Sử dụng bằng chứng thực nghiệm và chứng thực chuyên môn (Social Proof) là đòn bẩy thuyết phục bền vững nhất.',
        suitableRoles: 'Marketing Chiến lược, Nghiên cứu thị trường, Quản trị thương hiệu'
      },
      B: {
        text: 'Tung ngay chương trình khuyến mãi chớp nhoáng: Giảm giá 35% kèm tặng bình nước thời trang cho 100 khách hàng đầu tiên để kích cầu tăng số lượng đơn hàng ngay.',
        role: 'Chuyên gia Tăng trưởng Doanh số & Tối ưu Chuyển đổi (Sales & Growth Hacker)',
        analysis: 'Bạn quyết đoán trong việc tạo động lực hành động tức thì (FOMO). Phương án này giúp xả hàng nhanh và tạo doanh thu ban đầu, dù cần chú ý kiểm soát biên lợi nhuận.',
        suitableRoles: 'Quản trị bán hàng, Thương mại điện tử, Quản lý chuỗi bán lẻ'
      },
      C: {
        text: 'Mở rộng quảng cáo sang các thành phố khác và hợp tác với 3 nhà sáng tạo nội dung (KOL học sinh) nổi tiếng trên TikTok để tiếp tục đẩy mạnh độ phủ sóng thương hiệu.',
        role: 'Nhà Phát triển Thị trường & Quan hệ Công chúng (PR / Market Expansion)',
        analysis: 'Bạn tin tưởng vào hiệu ứng lan tỏa đám đông và độ nhận biết rộng rãi. Đây là tư duy phù hợp ở giai đoạn đầu thâm nhập thị trường, nhưng cần bổ sung thông điệp thuyết phục về chất lượng.',
        suitableRoles: 'Truyền thông & PR, Tổ chức sự kiện, Phát triển kinh doanh quốc tế'
      }
    },
    highschoolAdvice: 'Phát triển thế mạnh môn Toán, Tiếng Anh và Kinh tế - Pháp luật; rèn luyện kỹ năng thuyết trình, phân tích dữ liệu bảng tính và tham gia các dự án kinh doanh khởi nghiệp học sinh.'
  },
  medical: {
    id: 'medical',
    career: 'Y Đa khoa, Dược học & Khoa học Sức khỏe',
    context: 'Trong ca trực tối tại khoa Cấp cứu, bạn tiếp nhận đồng thời 2 trường hợp: Một cụ ông 70 tuổi than mệt, khó thở nhẹ kèm vã mồ hôi và tiền sử tăng huyết áp; cùng một thanh niên 19 tuổi vừa ngã xe máy bị rách sâu ở cẳng tay, máu chảy thấm đẫm áo và đang hoảng loạn la hét.',
    challenge: 'Là bác sĩ trực tiếp phân loại bệnh nhân (Triage), bạn sẽ phân bổ nhân lực và xử trí ban đầu theo thứ tự nào?',
    choices: {
      A: {
        text: 'Phân loại cụ ông vào diện Cấp cứu ưu tiên 1: đo điện tim ngay và cho thở oxy vì nghi ngờ hội chứng mạch vành cấp; đồng thời chỉ định điều dưỡng băng ép cầm máu tức thì cho thanh niên.',
        role: 'Bác sĩ Cấp cứu Lâm sàng Chuẩn mực (Clinical Triage Acuity)',
        analysis: 'Bạn xuất sắc thấu hiểu nguyên tắc "Sinh mạng là số 1". Cụ ông có triệu chứng âm ỉ nhưng tiềm ẩn nguy cơ nhồi máu cơ tim có thể ngừng tuần hoàn đột ngột trong vài phút. Khả năng bình tĩnh phân loại và ủy quyền công việc cho đồng đội là tố chất y khoa mẫu mực.',
        suitableRoles: 'Bác sĩ Đa khoa, Bác sĩ Hồi sức cấp cứu, Tim mạch'
      },
      B: {
        text: 'Tập trung khâu và xử lý vết thương cho thanh niên trước vì máu chảy nhiều gây tâm lý sợ hãi cho cả phòng bệnh, sau đó quay sang thăm khám toàn diện cho cụ già.',
        role: 'Nhân viên Y tế Giàu Trắc ẩn & Phản xạ Cứu trợ Nhanh (Empathetic First Responder)',
        analysis: 'Bạn có tấm lòng nhân ái, mong muốn xoa dịu ngay nỗi sợ hãi hữu hình của người bệnh. Tuy nhiên trong môi trường cấp cứu, bạn cần rèn luyện thêm khả năng "nhìn xuyên qua triệu chứng" để nhận diện những ca nguy kịch ngầm.',
        suitableRoles: 'Ngoại khoa, Phẫu thuật chấn thương, Chăm sóc điều dưỡng'
      },
      C: {
        text: 'Chỉ định cho cả 2 bệnh nhân làm xét nghiệm máu toàn phần và chụp chiếu cận lâm sàng cùng lúc để có đầy đủ kết quả chỉ số xét nghiệm trước khi đưa ra phác đồ can thiệp.',
        role: 'Nhà Nghiên cứu Y học Chứng cứ (Evidence-based Medicine)',
        analysis: 'Bạn rất thận trọng và coi trọng dữ liệu cận lâm sàng chính xác. Dù vậy trong tình huống tối cấp, bác sĩ cần song song xử trí triệu chứng đe dọa tính mạng trước khi chờ kết quả xét nghiệm hoàn tất.',
        suitableRoles: 'Bác sĩ Chẩn đoán hình ảnh, Xét nghiệm y học, Dược lâm sàng'
      }
    },
    highschoolAdvice: 'Học chắc môn Hóa học, Sinh học và Tiếng Anh; rèn luyện đức tính kiên nhẫn, khả năng giữ bình tĩnh trước áp lực và tinh thần nhân ái phụng sự cộng đồng.'
  },
  education: {
    id: 'education',
    career: 'Sư phạm, Giáo dục & Tâm lý học',
    context: 'Bạn là giáo viên chủ nhiệm lớp 10. Một học sinh trước đây rất sôi nổi bất ngờ 3 tuần liền thường xuyên đi học muộn, gục đầu xuống bàn trong giờ và bài kiểm tra gần nhất bị điểm kém. Khi bạn gặp riêng hỏi han, em ấy chỉ im lặng nhìn xuống đất và nói lí nhí "Em không sao, thầy/cô kệ em đi".',
    challenge: 'Để thực sự giúp đỡ học sinh này mà không làm tổn thương sự tự tôn của em, bạn sẽ xử lý tình huống sư phạm ra sao?',
    choices: {
      A: {
        text: 'Không gặng hỏi ép buộc; mời em một hộp sữa nhỏ, tạo không gian an toàn và bảo: "Thầy/cô thấy gần đây em có vẻ mệt, khi nào em sẵn sàng tâm sự thì phòng giáo viên luôn mở cửa nhé", sau đó quan sát thêm từ bạn bè thân thiết.',
        role: 'Nhà Giáo dục Nhân bản & Chuyên gia Tâm lý Học đường (Empathetic Educator)',
        analysis: 'Bạn hiểu sâu sắc rằng "an toàn tâm lý" là chìa khóa để một người mở lòng. Bạn không lấy quyền lực giáo viên để áp đặt mà dùng sự tôn trọng và chân thành. Đây là tố chất cao quý nhất của nghề Sư phạm và Tâm lý.',
        suitableRoles: 'Giáo viên THPT, Chuyên viên Tâm lý học đường, Cố vấn giáo dục'
      },
      B: {
        text: 'Liên hệ ngay với phụ huynh trong tối nay để thông báo tình trạng sa sút điểm số và đi học muộn, đề nghị gia đình kiểm tra việc sử dụng điện thoại ban đêm của em.',
        role: 'Người Quản lý Kỷ luật & Phối hợp Gia đình (School-Family Coordinator)',
        analysis: 'Bạn hành động dứt khoát và coi trọng liên lạc hai chiều với gia đình. Dù vậy nếu chưa tìm hiểu nguyên nhân (ví dụ em ấy đang gặp mâu thuẫn chính với bố mẹ), cách này có thể khiến học sinh cảm thấy bị "mách tội" và khép lòng hơn.',
        suitableRoles: 'Quản lý giáo dục, Giám thị học đường, Quản trị trường học'
      },
      C: {
        text: 'Giao cho em ấy làm nhóm trưởng một hoạt động văn nghệ hoặc trò chơi tập thể của lớp vào tuần tới để kéo em trở lại với không khí sôi động của bạn bè.',
        role: 'Nhà Huấn luyện Kích hoạt Tiềm năng (Inspiring Activity Coach)',
        analysis: 'Bạn có tinh thần năng động và tin vào sức mạnh tập thể. Tuy nhiên cần cân nhắc xem học sinh có đang kiệt sức (Burnout) hay không, vì việc giao thêm trọng trách nhóm trưởng khi đang khủng hoảng có thể tạo thêm áp lực.',
        suitableRoles: 'Tổ chức sự kiện học đường, Giáo viên kỹ năng sống, Hoạt động thanh thiếu niên'
      }
    },
    highschoolAdvice: 'Rèn luyện môn Ngữ văn, Lịch sử, Ngoại ngữ; trau dồi khả năng lắng nghe thấu cảm, nói chuyện trước đám đông và tham gia công tác Đoàn/Đội trường học.'
  },
  design: {
    id: 'design',
    career: 'Thiết kế Đồ họa, Đa phương tiện & Kiến trúc',
    context: 'Bạn nhận thiết kế bộ nhận diện thương hiệu cho một ứng dụng đọc sách dành cho giới trẻ Gen Z. Khách hàng bên đối tác liên tục yêu cầu bạn phải chọn tông màu xám sẫm, bỏ hết các biểu tượng vui nhộn và nhồi nhét thật nhiều văn bản vì họ cho rằng phong cách đó "sang trọng và học thuật như ngân hàng".',
    challenge: 'Bạn biết rõ nếu làm theo ý khách, ứng dụng sẽ rất kén người dùng trẻ. Bạn sẽ xử lý thế nào?',
    choices: {
      A: {
        text: 'Thiết kế 2 phương án song song: Phương án 1 chuẩn theo ý khách, và Phương án 2 tối ưu cho Gen Z kèm số liệu khảo sát thị hiếu màu sắc để giải thích thuyết phục vì sao Phương án 2 sẽ mang lại nhiều lượt tải hơn.',
        role: 'Giám đốc Nghệ thuật & Chuyên gia Thiết kế Trải nghiệm (UX Designer / Art Director)',
        analysis: 'Bạn kết hợp hoàn hảo giữa thái độ tôn trọng đối tác và lập trường chuyên môn vững chắc dựa trên dữ liệu người dùng (User-centric Design). Đây là cách làm việc đẳng cấp của những nhà thiết kế chuyên nghiệp hàng đầu.',
        suitableRoles: 'UI/UX Designer, Art Director, Thiết kế nhận diện thương hiệu'
      },
      B: {
        text: 'Làm đúng 100% tất cả yêu cầu của khách hàng vì khách hàng là người trả chi phí và chịu trách nhiệm cao nhất về sản phẩm của họ.',
        role: 'Người Thực thi Linh hoạt & Tôn trọng Yêu cầu (Pragmatic Graphic Designer)',
        analysis: 'Bạn ưu tiên sự hòa nhã và tiến độ bàn giao hợp đồng. Tuy nhiên trong ngành sáng tạo, nếu chỉ đơn thuần "vẽ theo lệnh" mà thiếu tư vấn chuyên môn, bạn sẽ khó tạo ra những tác phẩm đột phá nâng tầm sự nghiệp.',
        suitableRoles: 'Thiết kế ấn phẩm truyền thông, Họa sĩ minh họa thương mại'
      },
      C: {
        text: 'Kiên quyết từ chối yêu cầu và cảnh báo thẳng thắn rằng thiết kế đó đi ngược xu hướng thị trường, nếu khách hàng khăng khăng thì xin dừng hợp đồng.',
        role: 'Nghệ sĩ Cá tính Độc lập (Pure Visual Artist)',
        analysis: 'Bạn có cái tôi nghệ thuật mạnh mẽ và tinh thần bảo vệ tác phẩm đáng nể. Dù vậy trong ngành thiết kế ứng dụng thương mại, kỹ năng đàm phán và thuyết phục đối tác chiếm đến 50% thành công của một dự án.',
        suitableRoles: 'Họa sĩ sáng tác tự do, Nghệ thuật ý niệm (Concept Art)'
      }
    },
    highschoolAdvice: 'Phát triển cảm thụ thẩm mỹ qua môn Mỹ thuật, Tin học và Tiếng Anh; tự học các công cụ đồ họa (Figma, Photoshop, Illustrator) và xây dựng Portfolio tác phẩm cá nhân từ sớm.'
  },
  engineering: {
    id: 'engineering',
    career: 'Kỹ thuật Cơ khí, Tự động hóa, Vi mạch & Xây dựng',
    context: 'Trong buổi bay thử nghiệm mô hình Drone cứu hộ do bạn và nhóm chế tạo, cảm biến báo rung động trục cánh quạt vượt mức an toàn 12% khi gặp gió cấp 4. Nhóm có thể kịp nộp sản phẩm dự thi chiều nay nếu giữ nguyên, hoặc phải tháo rời cân chỉnh lại cơ khí và nộp muộn vào sáng mai (bị trừ 5% điểm tiến độ).',
    challenge: 'Là trưởng nhóm kỹ thuật, bạn sẽ đưa ra quyết định gì?',
    choices: {
      A: {
        text: 'Quyết định tháo dỡ để cân chỉnh lại cơ học và kiểm tra độ đồng trục; gửi báo cáo kỹ thuật giải thích rõ lý do chấp nhận trễ hạn vì an toàn vận hành là tiêu chí tối thượng.',
        role: 'Kỹ sư Trưởng Trách nhiệm & Đạo đức Kỹ thuật (Chief Engineer Integrity)',
        analysis: '"An toàn là số 1". Trong các ngành Cơ khí, Hàng không hay Vi mạch, sai số rung chấn có thể dẫn tới gãy trục thảm khốc khi hoạt động lâu dài. Sự dũng cảm dừng lại để bảo đảm chất lượng thể hiện phẩm chất của một Kỹ sư trưởng ưu tú.',
        suitableRoles: 'Kỹ sư Cơ điện tử, Thiết kế máy bay không người lái, Kiểm định chất lượng'
      },
      B: {
        text: 'Vẫn nộp sản phẩm đúng chiều nay kèm chú thích giới hạn bay ở sức gió cấp 3 để bảo toàn 100% điểm tiến độ của cả đội.',
        role: 'Nhà Quản lý Dự án & Tiến độ Kỹ thuật (Project Timeline Manager)',
        analysis: 'Bạn rất kỷ luật về thời hạn cam kết (Deadline). Dù vậy với sản phẩm mang tính cứu hộ và kỹ thuật cao, việc đẩy rủi ro sang điều kiện vận hành là quyết định cần hết sức thận trọng.',
        suitableRoles: 'Quản lý dự án xây dựng, Vận hành chuỗi sản xuất công nghiệp'
      },
      C: {
        text: 'Không tháo phần cứng mà can thiệp nhanh vào phần mềm vi điều khiển: tăng tần số bù rung và giảm 10% công suất động cơ chính để triệt tiêu rung chấn tức thì.',
        role: 'Kỹ sư Thuật toán Điều khiển & Nhúng (Firmware & Control Systems Engineer)',
        analysis: 'Bạn cực kỳ nhạy bén trong việc dùng thuật toán phần mềm để khắc phục giới hạn phần cứng (Hardware-Software Co-design). Đây là xu hướng then chốt trong thời đại Cách mạng Công nghiệp 4.0.',
        suitableRoles: 'Lập trình nhúng vi mạch, Tự động hóa & Robotics, IoT'
      }
    },
    highschoolAdvice: 'Tập trung học thật giỏi môn Vật lý, Toán học và Tin học; tham gia các cuộc thi Sáng tạo KHKT, STEM và rèn luyện kỹ năng làm việc nhóm thực hành.'
  },
  law: {
    id: 'law',
    career: 'Luật pháp, Ngoại giao & Khoa học Xã hội',
    context: 'Là chuyên viên pháp chế của một doanh nghiệp nông sản xuất khẩu, bạn phát hiện đối tác nước ngoài đưa vào hợp đồng một điều khoản phụ về việc áp dụng tỷ giá thả nổi có thể gây thiệt hại nặng nề cho công ty nếu có biến động tiền tệ. Tuy nhiên Giám đốc kinh doanh đang rất nóng lòng muốn ký hợp đồng ngay trong chiều nay để kịp chỉ tiêu quý.',
    challenge: 'Bạn sẽ giải quyết bài toán giữa tiến độ ký kết và rủi ro pháp lý như thế nào?',
    choices: {
      A: {
        text: 'Soạn ngay bản phụ lục điều khoản rào chắn tỷ giá (Currency Collar) kèm biểu đồ phân tích rủi ro tài chính súc tích 1 trang gửi Giám đốc kinh doanh và chủ động đàm phán nhanh với đối tác để cùng chốt trong buổi chiều.',
        role: 'Chuyên viên Pháp lý Doanh nghiệp & Đàm phán Quốc tế (Corporate Legal Counsel)',
        analysis: 'Bạn không chỉ nói "không" mà chủ động đưa ra giải pháp bảo vệ quyền lợi doanh nghiệp (Solution-oriented Lawyer). Tư duy giải quyết vấn đề nhanh nhẹn kết hợp với sự am hiểu luật kinh tế quốc tế là phẩm chất hàng đầu của nghề Luật hiện đại.',
        suitableRoles: 'Luật sư thương mại quốc tế, Trọng tài kinh tế, Cố vấn pháp chế tập đoàn'
      },
      B: {
        text: 'Kiên quyết từ chối phê duyệt hồ sơ và yêu cầu đình chỉ hoàn toàn việc ký kết cho đến khi đối tác chấp nhận bỏ hoàn toàn điều khoản tỷ giá đó ra khỏi hợp đồng.',
        role: 'Người Bảo vệ Pháp chế Nghiêm ngặt (Strict Compliance Officer)',
        analysis: 'Bạn có nguyên tắc thép và sự dứt khoát tuyệt đối trong việc phòng ngừa rủi ro cho tổ chức. Tố chất này đặc biệt phù hợp trong các lĩnh vực Thanh tra, Kiểm toán và Cơ quan tư pháp nhà nước.',
        suitableRoles: 'Kiểm sát viên, Thanh tra nhà nước, Chuyên viên kiểm soát tuân thủ'
      },
      C: {
        text: 'Tư vấn Giám đốc mua thêm gói bảo hiểm phòng ngừa rủi ro tỷ giá từ ngân hàng thứ ba để vừa ký được hợp đồng chiều nay vừa giảm thiểu tổn thất tiềm ẩn.',
        role: 'Chuyên gia Quản trị Rủi ro Tài chính & Pháp lý (Risk Management Strategist)',
        analysis: 'Bạn có tầm nhìn bao quát kết hợp giữa pháp lý và tài chính hiện đại. Thay vì chỉ đàm phán hợp đồng, bạn biết dùng công cụ thị trường để hóa giải rủi ro.',
        suitableRoles: 'Tư vấn tài chính doanh nghiệp, Ngân hàng đầu tư, Ngoại giao kinh tế'
      }
    },
    highschoolAdvice: 'Trau dồi môn Ngữ văn, Lịch sử, Giáo dục Kinh tế - Pháp luật và Tiếng Anh; rèn luyện tư duy phản biện, kỹ năng tranh biện (Debate) và phân tích lập luận chặt chẽ.'
  },
  default: {
    id: 'default',
    career: 'Khám phá Định hướng Nghề nghiệp Đa ngành',
    context: 'Bạn được phân công làm Trưởng nhóm một dự án nghiên cứu khoa học kỹ thuật cấp trường cùng 3 thành viên khác. Một tuần trước hạn nộp bài, sản phẩm thí nghiệm bất ngờ bị lỗi không cho kết quả như kỳ vọng lý thuyết, và hai bạn trong nhóm bắt đầu tranh cãi gay gắt đổ lỗi cho nhau.',
    challenge: 'Với vai trò là người điều phối nhóm, bạn sẽ hành động thế nào để đưa dự án về đích thành công?',
    choices: {
      A: {
        text: 'Tổ chức một buổi họp nhóm bình tĩnh trong 30 phút: cùng nhau bóc tách lại từng bước thí nghiệm để tìm ra lỗi sai khách quan, phân công lại nhiệm vụ rõ ràng và tập trung sửa chữa thay vì tranh cãi.',
        role: 'Nhà Lãnh đạo Điềm đạm & Giải quyết Vấn đề (Calm Problem-Solving Leader)',
        analysis: 'Bạn có tố chất lãnh đạo xuất sắc: tập trung vào "Vấn đề" chứ không nhắm vào "Con người". Khả năng giữ bình tĩnh và tạo lập tinh thần đồng đội dưới áp lực thời gian là năng lực vàng trong mọi ngành nghề thế kỷ 21.',
        suitableRoles: 'Quản trị dự án, Lãnh đạo nhóm, Nhà nghiên cứu khoa học'
      },
      B: {
        text: 'Tự mình thức trắng 2 đêm làm lại toàn bộ phần thí nghiệm bị lỗi để đảm bảo tiến độ và độ chính xác tuyệt đối mà không cần nhờ đến các bạn đang cãi nhau.',
        role: 'Chuyên gia Kỹ thuật Độc lập & Chịu trách nhiệm Cao (Solo Technical Hero)',
        analysis: 'Bạn có tinh thần trách nhiệm cá nhân rất cao và sự kiên trì bền bỉ đáng nể. Tuy nhiên trong tương lai ở môi trường đại học và làm việc, bạn cần học cách tin tưởng và phân quyền cho đồng đội để đi xa hơn.',
        suitableRoles: 'Chuyên gia nghiên cứu độc lập, Kỹ thuật viên chuyên sâu'
      },
      C: {
        text: 'Gặp ngay giáo viên hướng dẫn để báo cáo trung thực về sự cố thí nghiệm và xin thầy/cô lời khuyên can thiệp gỡ rối cả về kỹ thuật lẫn tinh thần nhóm.',
        role: 'Người Cầu thị & Biết Tận dụng Nguồn lực (Resourceful & Transparent Collaborator)',
        analysis: 'Bạn thông minh khi biết tìm kiếm sự hỗ trợ chuyên môn đúng lúc từ người có kinh nghiệm thay vì giấu giếm lỗi sai. Tính trung thực trong học thuật và tinh thần cầu thị là nền tảng của sự tiến bộ vững chắc.',
        suitableRoles: 'Quan hệ công chúng, Quản lý nhân sự, Hợp tác dự án'
      }
    },
    highschoolAdvice: 'Tích cực rèn luyện các môn học thế mạnh, tham gia các hoạt động ngoại khóa, câu lạc bộ và các cuộc thi sáng tạo KHKT để tôi luyện bản lĩnh.'
  }
};

function getCareerRoleplayScenario(careerName) {
  const cn = (careerName || '').toLowerCase();
  if (/công nghệ|cntt|phần mềm|it|lập trình|máy tính|tin học|ai|trí tuệ nhân tạo|dữ liệu|an toàn thông tin|mạng/.test(cn)) {
    return ROLEPLAY_SCENARIOS.it;
  }
  if (/kinh tế|kinh doanh|marketing|tài chính|ngân hàng|quản trị|thương mại|kế toán|kiểm toán|logistic/.test(cn)) {
    return ROLEPLAY_SCENARIOS.business;
  }
  if (/y|dược|bác sĩ|điều dưỡng|nha|y tế|sức khỏe|dược liệu/.test(cn)) {
    return ROLEPLAY_SCENARIOS.medical;
  }
  if (/sư phạm|giáo dục|giáo viên|dạy học|tâm lý|huấn luyện/.test(cn)) {
    return ROLEPLAY_SCENARIOS.education;
  }
  if (/thiết kế|đồ họa|mỹ thuật|kiến trúc|multimedia|truyền thông đa phương tiện|nội thất/.test(cn)) {
    return ROLEPLAY_SCENARIOS.design;
  }
  if (/cơ khí|kỹ thuật|tự động|điện|điện tử|bán dẫn|xây dựng|chế tạo|hàng hải|hàng không/.test(cn)) {
    return ROLEPLAY_SCENARIOS.engineering;
  }
  if (/luật|pháp luật|ngoại giao|báo chí|quan hệ quốc tế|xã hội|nhân văn|ngôn ngữ/.test(cn)) {
    return ROLEPLAY_SCENARIOS.law;
  }
  return ROLEPLAY_SCENARIOS.default;
}

function startCareerRoleplay() {
  const c = getChatContext();
  const careerName = c.top?.name || c.goal || 'Công nghệ Thông tin / Kỹ sư Phần mềm';
  const scenario = getCareerRoleplayScenario(careerName);
  chatState.activeRoleplay = scenario;

  return `🎭 **TRẢI NGHIỆM THỰC TẾ 1 NGÀY LÀM NGHỀ: ${scenario.career}**\n` +
    `*(Tính năng Mô phỏng Phản xạ Nghề nghiệp dựa trên Hồ sơ NS AI)*\n\n` +
    `📍 **Bối cảnh tình huống:**\n${scenario.context}\n\n` +
    `⚖️ **Thách thức đặt ra:**\n${scenario.challenge}\n\n` +
    `👉 **3 Phương án bạn có thể lựa chọn:**\n` +
    `• 🅰️ **Phương án A:** ${scenario.choices.A.text}\n` +
    `• 🅱️ **Phương án B:** ${scenario.choices.B.text}\n` +
    `• 🅲 **Phương án C:** ${scenario.choices.C.text}\n\n` +
    `----------------------------------------------------\n` +
    `💬 **Bạn sẽ xử lý ra sao?** Hãy gõ **A**, **B**, hoặc **C** (hoặc chia sẻ thêm suy nghĩ của bạn) vào khung chat để NS AI phân tích độ tương thích và phản xạ nghề nghiệp của bạn nhé! ✨`;
}

function evaluateRoleplayChoice(choiceLetter, scenario) {
  const letter = (choiceLetter || '').trim().toUpperCase();
  const selected = scenario.choices && scenario.choices[letter];
  if (!selected) return null;

  const otherLetters = ['A', 'B', 'C'].filter(l => l !== letter);

  let reply = `✨ **PHÂN TÍCH PHẢN XẠ NGHỀ NGHIỆP TỪ NS AI (Lựa chọn ${letter})**\n` +
    `*Ngành mô phỏng: ${scenario.career}*\n\n` +
    `🏆 **Phong cách làm việc & Tố chất nổi bật của bạn:**\n` +
    `• **Định vị phản xạ:** ${selected.role}\n` +
    `• **Phân tích chiều sâu:** ${selected.analysis}\n` +
    `• **Vị trí / Hướng chuyên sâu rất hợp với bạn:** ${selected.suitableRoles}\n\n` +
    `🔍 **Góc nhìn đa chiều về các phương án khác:**\n`;

  otherLetters.forEach(l => {
    const alt = scenario.choices[l];
    reply += `• **Nếu chọn ${l} (${alt.role}):** Mang lại góc nhìn bổ trợ hữu ích khi cần phối hợp đa chức năng trong nhóm.\n`;
  });

  reply += `\n📚 **Gợi ý rèn luyện ngay từ bậc THPT (GDPT 2018):**\n` +
    `${scenario.highschoolAdvice}\n\n` +
    `💡 *Bạn có muốn thử sức thêm với một tình huống nghề nghiệp khác không? Hãy gõ "Thử tình huống khác" hoặc chọn bất kỳ câu hỏi gợi ý nào nhé!* 💚`;

  // Reset sau khi phản hồi thành công
  chatState.activeRoleplay = null;
  return reply;
}

function answer(q) {
  const raw = q.trim();
  const s = normalizeQuery(raw);
  const c = getChatContext();

  // 0. XỬ LÝ TRẢ LỜI TÌNH HUỐNG MÔ PHỎNG NGHỀ NGHIỆP (A, B, C)
  if (chatState.activeRoleplay) {
    const rawClean = raw.trim().toUpperCase();
    if (rawClean === 'A' || rawClean === 'B' || rawClean === 'C') {
      const resp = evaluateRoleplayChoice(rawClean, chatState.activeRoleplay);
      if (resp) return resp;
    }
    const choiceMatch = raw.match(/(?:chọn|phương án|đáp án|câu)?\s*([abc])\b/i);
    if (choiceMatch && choiceMatch[1]) {
      const resp = evaluateRoleplayChoice(choiceMatch[1], chatState.activeRoleplay);
      if (resp) return resp;
    }
  }

  // 0.1 KHỞI ĐỘNG CHẾ ĐỘ "TRẢI NGHIỆM THỬ 1 NGÀY LÀM NGHỀ" (TÍNH NĂNG MỚI ĐỘT PHÁ)
  if (/trải nghiệm thử|1 ngày làm nghề|tình huống thực tế|thử làm nghề|đóng vai nghề nghiệp|thử việc|roleplay|thử đóng vai|tình huống nghề|thử tình huống khác/.test(s)) {
    recordTopic('career_roleplay');
    return startCareerRoleplay();
  }

  // 0.2 PHÂN TÍCH ĐỘ LỆCH KỲ VỌNG & GIẢI TỎA ÁP LỰC (EXPECTATION GAP INDEX)
  if (/áp lực kỳ vọng quá lớn|áp lực kỳ vọng|lệch kỳ vọng|khoảng cách kỳ vọng|độ lệch kỳ vọng/.test(s)) {
    recordTopic('expectation_gap_relief');
    return `💙 **NS AI luôn ở đây để lắng nghe và đồng hành cùng bạn...**\n\n` +
      `Mình hiểu rằng giai đoạn này bạn đang phải gánh trên vai rất nhiều sự kỳ vọng: kỳ vọng từ bố mẹ, thầy cô, và có lẽ lớn nhất là **kỳ vọng từ chính bản thân bạn**.\n\n` +
      `Khi mục tiêu bạn mong ước dường như đang có khoảng cách so với điểm số hiện tại, cảm giác bất an, lo sợ trượt nguyện vọng hay sợ làm người khác thất vọng là điều hoàn toàn dễ hiểu. Nhưng hãy nhớ rằng:\n\n` +
      `🌱 **3 Điều cốt lõi bạn cần nhớ lúc này:**\n` +
      `1. **Điểm số hiện tại chỉ là "tọa độ tạm thời", không phải "định mệnh":**\n` +
      `   Theo Chương trình GDPT 2018 và các kỳ thi hiện đại, chỉ cần 3 - 6 tháng học có phương pháp trọng tâm (đúng chuyên đề, chữa đề có phản hồi), mức điểm của bạn hoàn toàn có thể bứt phá từ **+1.0 đến +2.5 điểm** (bạn có thể kiểm chứng trực quan ngay tại **Bộ giả lập What-If** ở trang Kết quả).\n\n` +
      `2. **Chiến lược "Hai bến đỗ" (Dual-Track Safe Strategy):**\n` +
      `   Thay vì chỉ đặt cược tất cả vào một nguyện vọng Top đầu duy nhất gây căng thẳng tột độ, hãy xây dựng:\n` +
      `   • **Bến đỗ ước mơ (Dream School):** Giữ ngọn lửa đam mê, phấn đấu hết mình bằng điểm thi THPT hoặc ĐGNL.\n` +
      `   • **Bến đỗ an toàn (Safety Harbor):** Tận dụng xét học bạ sớm vào các trường/ngành có chất lượng tốt cùng khối ngành để bảo đảm tương lai chắc chắn. Khi đã có bến đỗ an toàn, tâm lý phòng thi của bạn sẽ nhẹ nhõm hơn rất nhiều!\n\n` +
      `3. **Giá trị của bạn không đo bằng điểm số đơn thuần:**\n` +
      `   Thành công trong cuộc đời được quyết định bởi tính bền bỉ, sự học hỏi liên tục và thái độ sống, chứ không nằm ở điểm số của một kỳ thi duy nhất.\n\n` +
      `🌿 **Lời khuyên thực hành hôm nay:**\n` +
      `• Hãy hít thở thật sâu (bạn có thể bấm chọn *🧘 Bài tập thở 4-7-8*).\n` +
      `• Đừng tự gặm nhấm nỗi lo một mình: nếu bạn muốn lập thời gian biểu ôn tập cụ thể cho từng môn, hãy nói cho mình biết bạn đang lo lắng nhất ở môn nào nhé! 🫂💚`;
  }

  // 1. CẢNH BÁO NGUY HIỂM / KHẨN CẤP
  if (/tự tử|muốn chết|tự làm hại|tự hại|tự sát|kết thúc cuộc sống/.test(s)) {
    return 'Mình rất lo lắng khi nghe bạn chia sẻ cảm xúc này. Hãy dừng lại một chút và hít thở thật sâu nhé. Bạn vô cùng quý giá và không hề đơn độc. Hãy liên hệ ngay với người thân, thầy cô hoặc gọi tổng đài bảo vệ trẻ em 111 (miễn phí) hoặc cơ sở y tế gần nhất để luôn có người bên cạnh lắng nghe và bảo vệ bạn nhé.';
  }

  // 1.00 CHÀO HỎI & LÀM QUEN CÁ NHÂN HÓA
  if (/^(chào|xin chào|hello|hi|helo|alo|hai|chao|xin chao)\b/.test(s.trim())) {
    recordTopic('greeting');
    const uName = (typeof getCurrentUser === 'function' && getCurrentUser()) || c.p?.info?.name || 'bạn';
    const topStr = c.top ? ` Hiện tại theo hồ sơ, bạn đang có thế mạnh nổi trội với ngành **${c.top.name}**.` : '';
    return `Chào **${uName}**! Rất vui được gặp bạn! 💚🌌\n\n` +
      `Mình là **NS AI Assistant** – trợ lý thông minh đồng hành cùng bạn trên hành trình định hướng nghề nghiệp, tra cứu đại học và giải tỏa áp lực thi cử.${topStr}\n\n` +
      `Hôm nay bạn đang có câu hỏi hay muốn tâm sự điều gì cùng mình không? Hãy gõ câu hỏi hoặc bấm 🎙️ để nói nhé!`;
  }

  // 1.0 MẤT ĐỘNG LỰC / HẾT ĐỘNG LỰC / TỤT MOOD / CHÁN HỌC / MÔNG LUNG (TƯ VẤN TÂM LÝ CHUYÊN SÂU)
  if (/mất động lực|hết động lực|thiếu động lực|không có động lực|chẳng có động lực|tụt mood|tụt cảm xúc|down mood|mất hứng|không có hứng|không còn hứng|chán nản|chán học|không muốn học|chán chả muốn học|lười học|muốn buông xuôi|buông xuôi|muốn từ bỏ|từ bỏ|nản quá|nản lòng|mông lung|mất phương hướng|học để làm gì|cố gắng vì điều gì|lấy lại động lực|bảo mất động lực/.test(s)) {
    recordTopic('motivation_recovery');
    return `⚡ **Mình hiểu cảm xúc của bạn lúc này... Hãy dừng lại một nhịp và hít một hơi thật sâu cùng mình nhé!**\n\n` +
      `Trước hết, mình muốn khẳng định với bạn một điều quan trọng:\n` +
      `👉 **Mất động lực là một phản ứng sinh học hoàn toàn bình thường của não bộ, không phải do bạn kém cỏi, lười biếng hay vô dụng.**\n\n` +
      `Động lực (Motivation) vốn như thời tiết, lúc nắng lúc mưa, không một ai trên đời có thể tràn đầy năng lượng suốt 365 ngày. Khi bạn ép bản thân chạy một chặng đường dài với bài vở, thi cử mà thiếu khoảng nghỉ nạp năng lượng, não bộ sẽ tự động "ngắt cầu dao" để bảo vệ bạn khỏi sự kiệt sức.\n\n` +
      `💡 **Lộ trình 4 bước "Cấp cứu & Hồi sinh động lực" thực tế nhất:**\n\n` +
      `1️⃣ **Quy tắc 5 phút (Đánh bại sức ỳ não bộ):**\n` +
      `• Đừng ép bản thân phải "ngồi học cả buổi 3-4 tiếng" (não bạn sẽ thấy ngợp và trốn tránh ngay lập tức).\n` +
      `• Hãy chỉ giao hẹn: *"Mình chỉ mở sách ra làm đúng 1 câu trắc nghiệm"* hoặc *"Đọc đúng 1 trang sách trong 5 phút"*. Khi đã vượt qua ngưỡng 5 phút đầu tiên, não bộ sẽ bắt đầu tiết Dopamine tự nhiên và cuốn bạn vào bài học một cách nhẹ nhàng.\n\n` +
      `2️⃣ **Kỹ thuật Non-Zero Day (Ngày không-về-không):**\n` +
      `• Những ngày cạn kiệt năng lượng nhất, chỉ cần bạn học thuộc 1 từ vựng Tiếng Anh, giải 1 phép tính nhỏ, hoặc đọc 1 công thức Toán. **Chỉ cần không phải là số 0, bạn đã là người chiến thắng ngày hôm đó!** Một bước tiến dù nhỏ vẫn đang đưa bạn về phía trước.\n\n` +
      `3️⃣ **Dopamine Reset & Đổi mới không gian:**\n` +
      `• Hãy cất điện thoại sang phòng khác ít nhất 45 phút để dứt khỏi vòng lặp lướt TikTok/Reels/mạng xã hội (nguyên nhân hàng đầu gây cạn kiệt dopamine học tập).\n` +
      `• Dọn dẹp lại mặt bàn học cho thật gọn gàng, mở toang cửa sổ đón gió hoặc đổi chỗ học ra ban công, thư viện, quán cà phê yên tĩnh. Một không gian mới sẽ kích hoạt lại hứng khởi mới.\n\n` +
      `4️⃣ **Tái kết nối với "Lý do bắt đầu":**\n` +
      `• Hãy nhắm mắt lại 10 giây và tưởng tượng: Ngày bạn cầm tờ giấy báo trúng tuyển trường đại học mơ ước, được bước chân vào cánh cổng tự do tuổi 18, được sống tự lập và theo đuổi đam mê của riêng mình. Đó chính là lý do xứng đáng nhất để bạn tiếp tục nỗ lực hôm nay!\n\n` +
      `🌿 *Lời nhắn từ NS AI:* "Nếu hôm nay bạn thực sự quá mệt, hãy cho phép bản thân gập sách lại, đi tắm nước ấm và đi ngủ một giấc thật sâu trước 11h đêm. Ngày mai là một trang mới tinh, chúng mình cùng bắt đầu lại từng bước nhỏ nhé!"\n\n` +
      `Bạn đang thấy nản nhất ở môn học nào, hay đang mông lung về định hướng tương lai? Hãy kể cụ thể cho mình nghe, mình luôn ở đây gỡ rối cùng bạn! 🫂💚`;
  }

  // 1.0.1 TRÌ HOÃN, LƯỜI BIẾNG & KHÔNG TẬP TRUNG ĐƯỢC
  if (/lười biếng|bớt lười|lười quá|trì hoãn|nước đến chân mới nhảy|hay trì hoãn|không tập trung|mất tập trung|hay xao nhãng|nghiện điện thoại|lướt điện thoại|bị phân tâm/.test(s)) {
    recordTopic('procrastination');
    return `🎯 **Bí quyết cai "trì hoãn" & lấy lại sự tập trung cao độ:**\n\n` +
      `Sự thật tâm lý học: **Trì hoãn không phải vì bạn lười, mà là vì nỗi sợ thất bại hoặc bài vở quá mơ hồ** khiến não bộ trốn tránh bằng cách tìm kiếm sự dễ chịu tức thì trên màn hình điện thoại.\n\n` +
      `💡 **3 mẹo tâm lý trị chứng trì hoãn hiệu quả nhất:**\n` +
      `1. **Chia nhỏ mục tiêu (Micro-Tasks):** Thay vì ghi "Tối nay học môn Toán", hãy ghi cụ thể: "Giải bài tập số 1, 2 trang 45". Khi mục tiêu rõ ràng và nhỏ, não sẽ không còn cảm giác bị đe dọa.\n` +
      `2. **Đồng hồ Pomodoro (25/5):** Bấm giờ 25 phút học tập trung tuyệt đối (úp điện thoại xuống hoặc để xa tầm với), sau đó được nghỉ xả hơi 5 phút. Bạn chỉ cần hoàn thành 3 hiệp là đã giải quyết xong lượng bài tập lớn!\n` +
      `3. **Tự thưởng có điều kiện:** Giao kèo với bản thân: "Làm xong 1 đề này mới được xem 1 video yêu thích". Não bộ sẽ có động lực hoàn thành nhanh hơn gấp đôi!\n\n` +
      `Hôm nay bạn đang có bài tập hoặc môn nào cần giải quyết ngay không? Hãy bắt đầu cùng mình 1 hiệp 25 phút nhé! ⏱️`;
  }

  // 1.0.2 HỌC ĐỂ LÀM GÌ / Ý NGHĨA CỦA VIỆC HỌC / CÓ NÊN HỌC ĐẠI HỌC
  if (/học để làm gì|tại sao phải học|ý nghĩa của việc học|có nên học đại học|học đại học hay học nghề|không học đại học|đại học có phải con đường duy nhất/.test(s)) {
    recordTopic('purpose_of_study');
    return `🌱 **"Học để làm gì và Đại học có phải con đường duy nhất?" - Một câu hỏi rất đáng trân trọng!**\n\n` +
      `Ở lứa tuổi học sinh THPT, ai trong chúng ta cũng từng có lúc băn khoăn: *"Tại sao phải thức khuya dậy sớm giải những bài toán khó, học những kiến thức có vẻ chẳng dùng trong đời thực?"*\n\n` +
      `💡 **3 góc nhìn thực tế từ NS AI:**\n` +
      `1. **Học không chỉ là điểm số, mà là "tập thể dục cho não bộ":** Việc giải một bài toán hóc búa hay viết một bài văn lập luận rèn luyện cho bạn tính kiên nhẫn, khả năng tư duy logic và kỹ năng giải quyết vấn đề khi gặp khó khăn ngoài xã hội sau này.\n` +
      `2. **Học là để "có quyền lựa chọn":** Khi bạn có học thức và năng lực tốt, bạn được quyền chọn công việc mình yêu thích, chọn mức thu nhập xứng đáng, chọn môi trường sống và người bạn muốn làm việc cùng, thay vì phải chấp nhận những gì người khác sắp đặt.\n` +
      `3. **Đại học là con đường ngắn và an toàn nhất, nhưng không phải duy nhất:** Bên cạnh đại học, bạn hoàn toàn có thể chọn học nghề chuyên sâu (lập trình thực chiến, thiết kế đồ họa, làm đẹp, làm bánh, kỹ thuật ô tô...), du học nghề hoặc khởi nghiệp. Điều quan trọng nhất là bạn có một cái nghề thực chất và sự kiên trì theo đuổi đến cùng.\n\n` +
      `Bạn đang muốn hướng tới sự nghiệp thực tế hay muốn trải nghiệm môi trường giảng đường đại học? Hãy chia sẻ với mình nhé! ✨`;
  }

  // 1.1 LẮNG NGHE & TƯ VẤN TÂM LÝ HỌC ĐƯỜNG (SAFE HAVEN)
  if (/lắng nghe và tư vấn tâm lý|tư vấn tâm lý|lắng nghe tôi|lắng nghe em|muốn tâm sự|tâm sự cùng|cần người lắng nghe|trợ lý tâm lý|góc tâm lý|lắng nghe/.test(s)) {
    recordTopic('counseling_welcome');
    return `💚 **Mình luôn ở đây để lắng nghe và đồng hành cùng bạn!**\n\n` +
      `Lứa tuổi THPT là giai đoạn có rất nhiều áp lực: từ thi cử, chọn trường, đến kỳ vọng của bố mẹ hay những lúc thấy bản thân mông lung giữa tương lai. Bạn có thể xem mình là một **người bạn đồng hành tin cậy, thấu cảm và không bao giờ phán xét**.\n\n` +
      `🌿 **Bạn có thể giãi bày hoặc nhờ mình hỗ trợ về:**\n` +
      `1. ⚡ **Mất động lực học tập, tụt mood & chán nản:** Cách lấy lại ngọn lửa học tập sau chuỗi ngày mệt mỏi.\n` +
      `2. 👨‍👩‍👧 **Áp lực gia đình & kỳ vọng của bố mẹ:** Khi bị so sánh, bị ép chọn ngành mình không thích.\n` +
      `3. 📈 **Nỗi sợ thi trượt & điểm số thấp:** Khắc phục hoang mang trước kỳ thi THPT/ĐGNL.\n` +
      `4. 🔋 **Kiệt sức học đường (Burnout):** Khi bạn thấy quá tải, kiệt quệ năng lượng.\n` +
      `5. 👥 **Áp lực đồng trang lứa (Peer pressure):** Cảm giác thấy bạn bè giỏi hơn, tự ti về mình.\n` +
      `6. 🧘 **Bài tập thở 4-7-8 & xoa dịu lo âu:** Giúp hạ nhịp tim và bình tĩnh lại sau 2 phút.\n` +
      `7. 🎙️ **Nói chuyện bằng giọng nói:** Bạn có thể bấm nút **Micro (🎙️)** ở khung chat để nói trực tiếp mà không cần gõ phím nhé!\n\n` +
      `Hôm nay bạn đang cảm thấy thế nào? Có điều gì đang làm bạn nặng lòng không, cứ chia sẻ với mình nhé! 🫂`;
  }

  // 1.2 HƯỚNG DẪN NÓI CHUYỆN BẰNG GIỌNG NÓI (MICRO / SPEECH-TO-TEXT / TTS)
  if (/giọng nói|nói chuyện bằng giọng nói|micro|lắng nghe bằng giọng nói|đọc câu trả lời|nghe nói|bật giọng nói/.test(s)) {
    recordTopic('voice_feature');
    return `🎙️ **Tính năng Lắng nghe & Đọc bằng giọng nói đã sẵn sàng!**\n\n` +
      `• **Để nói cho mình nghe:** Bạn chỉ cần bấm vào nút **Micro (🎙️)** ở ô nhập tin nhắn. Hãy nói tự nhiên câu hỏi hoặc tâm sự của bạn, mình sẽ tự động lắng nghe và gửi đi.\n` +
      `• **Để mình đọc câu trả lời:**\n` +
      `  - Bấm vào biểu tượng **Loa (🔊)** ở góc khung chat để bật chế độ tự động đọc mọi câu trả lời.\n` +
      `  - Hoặc bấm nút **"🔊 Nghe đọc"** ở ngay góc dưới mỗi tin nhắn của mình để nghe đọc riêng đoạn đó.\n\n` +
      `👉 Bạn hãy bấm nút **Micro 🎙️** và thử nói một câu để mình lắng nghe nhé! ✨`;
  }

  // 1.3 ÁP LỰC GIA ĐÌNH & BỐ MẸ
  if (/bố mẹ|ba mẹ|cha mẹ|gia đình|kỳ vọng|áp đặt|bắt học|bắt thi|con nhà người ta|so sánh|không ủng hộ|cãi nhau với bố mẹ|bố mẹ không hiểu/.test(s)) {
    recordTopic('family_pressure');
    return `👨‍👩‍👧 **Mình rất đồng cảm với bạn về áp lực gia đình và sự kỳ vọng của bố mẹ...**\n\n` +
      `Cảm giác khi đam mê của mình không được gia đình ủng hộ, hoặc liên tục bị đem ra so sánh với "con nhà người ta" thực sự rất ngột ngạt và tủi thân.\n\n` +
      `💡 **Một vài góc nhìn tâm lý giúp bạn gỡ rối:**\n` +
      `• **Hiểu về nỗi lo của bố mẹ:** Phần lớn bố mẹ thúc ép con cái chọn các ngành "truyền thống" (Y Dược, Sư phạm, Ngân hàng, Công an...) là vì họ lớn lên trong thế hệ khó khăn và rất sợ con mình sau này bấp bênh, thất nghiệp. Đằng sau sự áp đặt đó thực chất là một nỗi sợ hãi vụng về.\n` +
      `• **Chiến lược đối thoại 3 bước:**\n` +
      `  1. *Lắng nghe để hiểu nỗi lo:* Hỏi dịu dàng: "Bố mẹ lo con học ngành này sẽ khó xin việc đúng không ạ?". Khi bố mẹ thấy bạn lắng nghe, họ sẽ bớt phòng thủ.\n` +
      `  2. *Thuyết phục bằng kế hoạch thực tế:* Thay vì nói "con thích", hãy chuẩn bị tài liệu: Ngành này ra trường làm vị trí gì, mức lương khởi điểm ra sao, các công ty nào đang tuyển, và kế hoạch học tập của bạn.\n` +
      `  3. *Nhờ người uy tín trợ lực:* Một thầy cô giáo bạn quý, hoặc một anh chị đi trước trong ngành nói một câu sẽ có sức nặng thuyết phục hơn rất nhiều.\n\n` +
      `Bố mẹ bạn đang muốn bạn theo ngành gì, và nguyện vọng thực sự của bạn là gì? Kể cho mình nghe nhé!`;
  }

  // 1.4 BÀI TẬP THỞ THƯ GIÃN 4-7-8 & KỸ THUẬT TIẾP ĐẤT 5-4-3-2-1
  if (/bài tập thở|thở 4-7-8|thở 478|hướng dẫn thở|cách thở|tiếp đất|5-4-3-2-1|hoảng loạn|tim đập nhanh|thư giãn ngay|cắt cơn lo âu|bình tĩnh lại/.test(s)) {
    recordTopic('breathing_exercise');
    return `🧘 **Bài tập thở 4-7-8 giúp xoa dịu căng thẳng & lo âu tức thì:**\n\n` +
      `Kỹ thuật này được phát triển bởi Tiến sĩ Andrew Weil (Đại học Harvard), giúp kích hoạt hệ thần kinh phó giao cảm, làm chậm nhịp tim và đưa não bộ về trạng thái thư giãn chỉ sau 2 phút:\n\n` +
      `1️⃣ **Ngồi thả lỏng hai vai, khép hờ mắt lại.**\n` +
      `2️⃣ **HÍT VÀO** từ từ bằng mũi trong **4 giây** (cảm nhận bụng phồng lên nhẹ nhàng).\n` +
      `3️⃣ **GIỮ HƠI THỞ** trong phổi trong **7 giây** (để oxy lan tỏa khắp cơ thể).\n` +
      `4️⃣ **THỞ RA** thật chậm và êm bằng miệng trong **8 giây** (như đang nhẹ nhàng thổi một ngọn nến).\n\n` +
      `✨ **Hãy lặp lại chu kỳ này 4 lần.** Bạn sẽ thấy lồng ngực mình nhẹ nhõm hơn rất nhiều.\n\n` +
      `🌿 *Mẹo tiếp đất 5-4-3-2-1:* Nếu bạn đang bị "ngợp" trước kỳ thi, hãy nhìn quanh và đếm: 5 đồ vật màu xanh, 4 bề mặt bạn có thể chạm, 3 âm thanh nghe thấy, 2 mùi hương và tự mỉm cười với bản thân 1 cái nhé! Bạn cảm thấy dễ chịu hơn chưa?`;
  }

  // 1.5 TÂM SỰ NỖI BUỒN, CÔ ĐƠN & TỰ TI
  if (/buồn quá|muốn khóc|khóc|cô đơn|thất vọng về bản thân|tự ti|bất an|tủi thân|không ai hiểu|áp lực quá chừng|tôi tệ quá|em tệ quá|chán đời/.test(s)) {
    recordTopic('sadness_counseling');
    return `🫂 **Hãy ôm lấy chính mình một cái thật chặt bạn nhé...**\n\n` +
      `Nếu lúc này bạn muốn khóc, hãy cứ để những giọt nước mắt được rơi. Khóc là cơ chế tự nhiên tuyệt vời nhất để cơ thể giải phóng những dồn nén cảm xúc và hạ nồng độ hormone căng thẳng cortisol, hoàn toàn không phải là sự yếu đuối.\n\n` +
      `🌸 **Mình muốn nhắn gửi đến bạn:**\n` +
      `• **Bạn không hề kém cỏi:** Một bài kiểm tra điểm kém, một ngày học tập không năng suất hay một vài lần thất bại không định nghĩa giá trị con người bạn.\n` +
      `• **Bạn đã rất nỗ lực rồi:** Suốt những năm tháng qua, việc bạn vẫn kiên trì thức khuya dậy sớm đến lớp mỗi ngày đã là một sự dũng cảm rất đáng tự hào.\n` +
      `• **Cảm xúc tồi tệ này chỉ là tạm thời:** Mọi cơn mưa dù lớn đến đâu rồi cũng sẽ tạnh. Bạn không phải vượt qua mọi thứ một mình.\n\n` +
      `Mình luôn ở đây lắng nghe bạn. Bạn có muốn tâm sự thêm về chuyện vừa xảy ra không?`;
  }

  // 1.6 NỖI SỢ TRƯỢT ĐẠI HỌC & ĐIỂM THẤP
  if (/sợ trượt|sợ rớt|thi trượt|thi hỏng|điểm thấp quá|điểm kém quá|sợ thi|không đỗ|không kịp nữa|lo trượt/.test(s)) {
    recordTopic('exam_fear');
    return `🎯 **Về nỗi sợ trượt và áp lực điểm số thi cử:**\n\n` +
      `Việc bạn cảm thấy sợ hãi thực ra là bằng chứng cho thấy bạn là một người rất có trách nhiệm và thực sự quan tâm đến tương lai của mình. Đó là một phẩm chất tốt, đừng tự dằn vặt mình nhé!\n\n` +
      `💡 **Cách chuyển hóa nỗi sợ thành hành động hiệu quả:**\n` +
      `1. **Điểm thi thử không phải là điểm thi thật:** Bài thi thử ra đời với mục đích duy nhất là chỉ ra bạn đang "hổng" ở câu nào, chương nào để bạn kịp vá lại trước kỳ thi chính thức. Mỗi lỗi sai hôm nay là một câu bạn sẽ làm đúng trong tương lai!\n` +
      `2. **Không nhìn cả đỉnh núi:** Đừng ngồi nghĩ về khối lượng kiến thức khổng lồ rồi hoảng loạn. Hãy chia nhỏ: Hôm nay mình chỉ cần làm chắc 5 câu bài tập môn Toán, thuộc 1 dạng bài môn Lý là đã thành công.\n` +
      `3. **Đại học không chỉ có một cánh cửa duy nhất:** Hiện nay có rất nhiều phương thức xét tuyển (Xét học bạ, ĐGNL, ĐGTD, xét tuyển kết hợp chứng chỉ...). Luôn có những trường đại học chất lượng phù hợp với điểm số thực tế của bạn.\n\n` +
      `Bạn đang lo lắng nhất ở môn thi nào? Hãy nói cho mình biết điểm hiện tại của bạn để chúng mình cùng lên chiến lược nhé!`;
  }

  // 1.7 KIỆT SỨC HỌC ĐƯỜNG (ACADEMIC BURNOUT)
  if (/burnout|kiệt sức|mệt mỏi quá|quá tải|đuối quá|kiệt quệ|không thở nổi|học nhiều quá/.test(s)) {
    recordTopic('burnout');
    return `🔋 **Có vẻ như bạn đang rơi vào trạng thái kiệt sức học đường (Academic Burnout) rồi...**\n\n` +
      `Khi não bộ phải hoạt động với cường độ cao liên tục trong thời gian dài mà không được nạp năng lượng, nó sẽ tự động bật chế độ "đình công". Đó không phải là do bạn lười biếng, mà là cơ thể đang gửi tín hiệu cầu cứu đấy!\n\n` +
      `💡 **Phương thuốc hồi sinh năng lượng cho bạn:**\n` +
      `• **Cho phép bản thân "nghỉ ngơi chủ động":** Hôm nay, hãy gập sách vở lại sớm. Đi tắm nước ấm, ăn món bạn thích, đi dạo hít thở khí trời và đi ngủ trước 11h đêm mà **không ôm cảm giác tội lỗi**.\n` +
      `• **Không ép não bộ làm việc khi cạn kiệt:** Ngồi học 4 tiếng trong trạng thái kiệt sức chỉ mang lại sự mệt mỏi mà không vào đầu chữ nào. Một giấc ngủ sâu sẽ giúp bạn học 1 tiếng ngày mai hiệu quả bằng cả ngày hôm nay.\n` +
      `• **Tìm lại ngọn lửa nhỏ:** Bạn từng mơ ước bước chân vào cánh cổng trường đại học nào? Tưởng tượng cảm giác ngày bạn nhận giấy báo trúng tuyển để tiếp thêm động lực bước tiếp nhé!`;
  }

  // 1.8 ÁP LỰC ĐỒNG TRANG LỨA (PEER PRESSURE)
  if (/peer pressure|đồng trang lứa|bạn bè|thua kém|con nhà người ta|ai cũng giỏi|tự ti về bản thân|thua bạn kém bè/.test(s)) {
    recordTopic('peer_pressure');
    return `👥 **Về áp lực đồng trang lứa (Peer Pressure):**\n\n` +
      `Nhìn thấy bạn bè xung quanh đạt giải nọ giải kia, điểm số cao chót vót hay có chứng chỉ ngoại ngữ xịn sò rất dễ khiến chúng ta cảm thấy mình như người đi tụt lại phía sau.\n\n` +
      `✨ **Nhưng bạn hãy nhớ câu nói này:**\n` +
      `*"Đừng so sánh hậu trường của bạn với sân khấu hào nhoáng của người khác."*\n\n` +
      `• Mỗi người có một xuất phát điểm, hoàn cảnh gia đình và nhịp độ phát triển riêng biệt. Người khác đi nhanh hơn ở môn này không có nghĩa là bạn kém cỏi, mà chỉ là điểm bùng nổ của bạn sẽ nằm ở một lĩnh vực khác.\n` +
      `• Theo thuyết đa trí thông minh của Howard Gardner: Có người thông minh về logic/toán học, có người thông minh về ngôn ngữ, giao tiếp, nghệ thuật hay sự bền bỉ nội tâm.\n` +
      `• Đối thủ duy nhất bạn cần chiến thắng chính là **bản thân bạn của ngày hôm qua**! Bạn chỉ cần tiến bộ 1% mỗi ngày là đã là một phiên bản xuất sắc rồi!`;
  }

  // 2. TÀI LIỆU HỌC TẬP / ĐỀ THI / BÀI TẬP / SÁCH ÔN THI
  if (/tài liệu|tai lieu|tài liều|tlh|đề thi|de thi|bài tập|bai tap|sách giáo khoa|sgk|sách tham khảo|đề minh họa|nguồn học|luyện đề|xin đề|học ở đâu|kênh học|web học|ngân hàng đề/.test(s)) {
    recordTopic('study_materials');

    // Nhánh theo từng môn học cụ thể
    if (/toán/.test(s)) {
      return `📚 **Nguồn tài liệu & Đề thi ôn tập môn TOÁN chất lượng cao:**\n\n` +
        `• **Kênh YouTube tự học hay nhất:** Thầy Đỗ Văn Đức (Tư duy toán học thực chiến), Thầy Chí Toán, Thầy Phạm Tuấn Anh, Thầy Thuận.\n` +
        `• **Website tải đề thi có giải chi tiết:**\n` +
        `  - **ToanMath.com:** Kho đề thi thử THPT Quốc gia, đề giữa kỳ/cuối kỳ của các trường chuyên cả nước kèm ma trận giải chi tiết (100% miễn phí).\n` +
        `  - **VietJack / VnDoc:** Tóm tắt toàn bộ công thức 12 chương trình GDPT 2018 và giải bài tập SGK chuẩn.\n` +
        `• **Mẹo học:** Hãy làm chắc các câu 1-38 (phần nhận biết, thông hiểu) trước khi luyện dạng vận dụng cao nhé!`;
    }

    if (/văn|ngữ văn/.test(s)) {
      return `📚 **Nguồn tài liệu & Mẹo học tốt môn NGỮ VĂN:**\n\n` +
        `• **Kênh học & Nghe podcast:** Văn Học Tuổi Trẻ, Thưởng Thức Sách, Kênh Cô Sương Mai.\n` +
        `• **Tài liệu & Mở bài mẫu:** Trang web *Loigiaihay.com* và *VnDoc* có kho mở bài gián tiếp, kết bài sáng tạo và sơ đồ tư duy tóm tắt luận điểm từng tác phẩm.\n` +
        `• **Bí kíp đạt điểm 8+:** Đọc thêm dẫn chứng thực tế đời sống để đưa vào bài Nghị luận xã hội; nắm chắc cấu trúc đoạn văn 200 chữ!`;
    }

    if (/tiếng anh|tieng anh|anh văn/.test(s)) {
      return `📚 **Nguồn tài liệu & Kênh luyện thi môn TIẾNG ANH:**\n\n` +
        `• **Kênh học & Giáo viên uy tín:** Cô Trang Anh (sách 25 chuyên đề ngữ pháp, cày đề THPT), Cô Mai Phương, IELTS Fighter.\n` +
        `• **Nguồn luyện đề chuẩn form mới:** Đề thi tham khảo Bộ GD&ĐT, trang *Tienganh247* và *Hocmai*.\n` +
        `• **App học từ vựng hiệu quả:** Anki hoặc Quizlet (học theo phương pháp ngắt quãng Spaced Repetition).`;
    }

    if (/lý|vật lý|vật lí|hóa|hóa học|sinh|sinh học/.test(s)) {
      return `📚 **Nguồn tài liệu môn KHOA HỌC TỰ NHIÊN (Lý - Hóa - Sinh):**\n\n` +
        `• **Môn Vật lý:** Kênh Thầy Vũ Ngọc Anh (VNA), Thầy Chu Văn Biên, web *Thuvienvatly.com*.\n` +
        `• **Môn Hóa học:** Kênh Thầy Phạm Thắng (Mappi), Thầy Lê Đăng Khương, fanpage Tôi Yêu Hóa Học.\n` +
        `• **Môn Sinh học:** Kênh Thầy Phan Khắc Nghệ (chuyên luyện thi THPT QG khối B).\n` +
        `• Đề thi thử các trường chuyên: Tải miễn phí tại *Tuyensinh247* hoặc *VietJack*.`;
    }

    return `Có chứ bạn ơi! Mình có đầy đủ nguồn tài liệu học tập, ngân hàng đề thi có đáp án chi tiết và các kênh học miễn phí cực xịn dành cho học sinh THPT:\n\n` +
      `📚 **1. Ngân hàng đề thi thử & Giải bài tập SGK chi tiết:**\n` +
      `• **VietJack (vietjack.com) & VnDoc (vndoc.com):** Toàn bộ lời giải SGK, sách bài tập, tóm tắt lý thuyết và đề thi giữa kỳ/cuối kỳ các môn lớp 10, 11, 12 theo chương trình GDPT 2018 mới.\n` +
      `• **Tuyensinh247 / ToanMath / Hoctot:** Kho đề thi thử tốt nghiệp THPT của các trường chuyên trên toàn quốc có giải chi tiết từng bước.\n` +
      `• **Cổng thông tin Bộ GD&ĐT (thi.moet.gov.vn):** Nơi công bố đề thi tham khảo chính thức chuẩn cấu trúc.\n\n` +
      `💻 **2. Tài liệu ôn thi Đánh giá năng lực (ĐGNL/ĐGTD):**\n` +
      `• Đề thi mẫu trực tuyến của ĐHQG Hà Nội (HSA) và ĐHQG TP.HCM trên cổng khảo thí chính thức.\n\n` +
      `🎥 **3. Kênh tự học YouTube miễn phí hàng đầu:**\n` +
      `• **Toán:** Thầy Đỗ Văn Đức, Thầy Chí Toán, Thầy Thuận...\n` +
      `• **Văn:** Thưởng Thức Sách, Văn Học Tuổi Trẻ, Cô Sương Mai...\n` +
      `• **Tiếng Anh:** Cô Trang Anh, Cô Mai Phương...\n` +
      `• **Lý - Hóa - Sinh:** Thầy Vũ Ngọc Anh, Thầy Phạm Thắng, Thầy Phan Khắc Nghệ...\n\n` +
      `💡 Bạn đang cần tài liệu hay đề thi của **môn nào cụ thể** (Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa...)? Cứ nhắn tên môn cho mình nhé! ✨`;
  }

  // 3. PHƯƠNG PHÁP HỌC / LẤY LẠI GỐC / HỌC GIỎI
  if (/mất gốc|học dốt|kém|làm sao để giỏi|cách học|học nhanh thuộc|bí quyết|kéo điểm|cải thiện|học bài/.test(s)) {
    recordTopic('study_method');
    return `Đừng quá nản lòng bạn nhé, việc thấy mình "yếu" một môn thực ra là cơ hội tốt nhất để bạn bứt phá! Dưới đây là phương pháp giúp bạn lấy lại gốc và kéo điểm môn học nhanh nhất:\n\n` +
      `🎯 **1. Quy tắc 80/20 (Tập trung kiến thức cơ bản):**\n` +
      `• Đừng vội làm đề khó. Hãy mở sách giáo khoa, ghi chép lại toàn bộ công thức và định nghĩa cốt lõi của từng chương.\n` +
      `• Chỉ cần nắm chắc phần cơ bản này, bạn đã cầm chắc 6.0 - 7.0 điểm trong tay.\n\n` +
      `⏱️ **2. Học theo phương pháp Pomodoro:**\n` +
      `• Ngồi vào bàn học tập trung cao độ 25 phút (tắt điện thoại), sau đó nghỉ xả hơi 5 phút rồi mới học tiếp.\n\n` +
      `📝 **3. Cuốn sổ tay "Lỗi sai":**\n` +
      `• Mỗi khi làm sai câu nào, hãy chép lại câu đó và ghi rõ: "Tại sao mình sai? Công thức đúng là gì?". Đọc lại cuốn sổ này trước mỗi bài kiểm tra sẽ giúp bạn không bao giờ mất điểm oan.\n\n` +
      `Bạn đang muốn cải thiện điểm của môn nào nhất lúc này?`;
  }

  // 4. MỨC LƯƠNG / CƠ HỘI VIỆC LÀM / XIN VIỆC / XU HƯỚNG NGHỀ NGHIỆP
  if (/lương|thu nhập|việc làm|dễ xin việc|thất nghiệp|ngành nào hot|xu hướng|ra trường làm gì|kiếm nhiều tiền|kiếm tiền/.test(s)) {
    recordTopic('salary_jobs');
    return `Đây là một câu hỏi rất thực tế và quan trọng khi chọn nghề! Dưới đây là bức tranh toàn cảnh về thị trường việc làm hiện nay:\n\n` +
      `📈 **1. Những nhóm ngành có nhu cầu tuyển dụng & thu nhập cao:**\n` +
      `• **Công nghệ thông tin & Trí tuệ nhân tạo (AI):** Lương khởi điểm từ 10 - 18 triệu/tháng; kỹ sư 3-5 năm kinh nghiệm có thể đạt 30 - 60+ triệu/tháng.\n` +
      `• **Logistics & Quản trị chuỗi cung ứng:** Nhu cầu rất lớn nhờ thương mại điện tử và xuất nhập khẩu phát triển mạnh.\n` +
      `• **Kinh tế số & Digital Marketing:** Cơ hội việc làm rộng mở, thu nhập gắn liền với năng lực và doanh số.\n` +
      `• **Khối ngành Y Dược & Chăm sóc sức khỏe:** Luôn có sự ổn định cao, không bao giờ lo thiếu việc làm.\n\n` +
      `💡 **2. Lời khuyên vàng:**\n` +
      `• "Không có ngành nào đảm bảo 100% giàu có nếu bản thân thụ động, và cũng không có ngành nào thất nghiệp nếu bạn thuộc top những người làm việc giỏi nhất."\n` +
      `• Ngoại ngữ (đặc biệt là Tiếng Anh) và kỹ năng giao tiếp sẽ giúp tăng mức lương của bạn lên ít nhất 1.5 - 2 lần trong bất kỳ ngành nào!`;
  }

  // 5. HỌC PHÍ ĐẠI HỌC / CHI PHÍ / HỌC BỔNG
  if (/học phí|chi phí|đắt không|tốn bao nhiêu|học bổng|sinh hoạt phí|tốn tiền/.test(s)) {
    recordTopic('tuition');
    return `Về vấn đề học phí đại học, các trường hiện nay được chia thành các mức phổ biến sau:\n\n` +
      `💰 **1. Mức học phí tham khảo theo nhóm trường:**\n` +
      `• **Trường công lập truyền thống:** Khoảng 15 - 25 triệu VNĐ/năm học.\n` +
      `• **Trường công lập tự chủ tài chính (Bách Khoa, Kinh tế Quốc dân, Ngoại thương, UEH...):** Dao động từ 28 - 50 triệu VNĐ/năm tùy chương trình chuẩn hay chất lượng cao.\n` +
      `• **Khối Sư phạm:** Được **miễn 100% học phí** và hỗ trợ sinh hoạt phí 3.63 triệu/tháng theo Nghị định 116.\n` +
      `• **Khối Y Dược công lập:** Khoảng 35 - 55 triệu VNĐ/năm.\n` +
      `• **Trường tư thục & Quốc tế:** Từ 50 - 120+ triệu VNĐ/năm.\n\n` +
      `🎁 **2. Cơ hội học bổng:**\n` +
      `• Hầu như trường nào cũng có quỹ **Học bổng khuyến khích học tập** (dành cho top 10% sinh viên điểm cao mỗi kỳ) và học bổng doanh nghiệp tài trợ, có thể bao trọn học phí cả năm học!`;
  }

  // 6. GIỚI TÍNH VÀ NGHỀ NGHIỆP (CON GÁI / CON TRAI NÊN HỌC GÌ)
  if (/con gái|con trai|nữ nên học|nam nên học|phái nữ|phái nam|con gái học it|con gái học kỹ thuật/.test(s)) {
    recordTopic('gender');
    return `Hiện đại ngày nay không còn rào cản hay định kiến về giới tính trong nghề nghiệp nữa bạn nhé! Bất kỳ ngành nào bạn có đam mê và nỗ lực thì đều có thể gặt hái thành công lớn:\n\n` +
      `👩 **Đối với các bạn nữ:**\n` +
      `• Có lợi thế tự nhiên về sự tỉ mỉ, đồng cảm, khả năng ngôn từ và thẩm mỹ tinh tế.\n` +
      `• Rất thành công trong: Marketing, Nhân sự, Truyền thông số, Thiết kế đồ họa, Y Dược, Ngoại giao, Sư phạm, và cả Quản lý dự án công nghệ (Business Analyst, UI/UX Designer).\n\n` +
      `👨 **Đối với các bạn nam:**\n` +
      `• Thường thích thử thách với máy móc, logic hệ thống, công trình hoặc các môi trường kinh doanh mang tính mạo hiểm.\n` +
      `• Phát huy tốt trong: Kỹ thuật, Lập trình AI, Kiến trúc, Tài chính đầu tư, Logistics, Quản trị kinh doanh.\n\n` +
      `👉 Quan trọng nhất vẫn là **sở thích và năng lực cá nhân** của chính bạn chứ không phụ thuộc vào giới tính!`;
  }

  // 7. KHÔNG GIỎI TOÁN / SỢ TOÁN THÌ HỌC NGÀNH GÌ
  if (/không giỏi toán|dốt toán|sợ toán|kém toán|không thích toán|học dốt toán/.test(s)) {
    recordTopic('weak_math');
    return `Đừng lo bạn nhé! Rất nhiều ngành nghề hấp dẫn, cơ hội việc làm rộng mở và thu nhập cao mà **hoàn toàn không yêu cầu giỏi Toán**:\n\n` +
      `✨ **Các nhóm ngành lý tưởng cho người không thích Toán:**\n` +
      `• **Truyền thông & Báo chí (Khối D01, C00):** Viết lách, sáng tạo nội dung số, quan hệ công chúng (PR), biên tập viên.\n` +
      `• **Ngôn ngữ học (Tiếng Anh, Trung, Hàn, Nhật...):** Biên - phiên dịch, ngoại giao, làm việc tại các tập đoàn đa quốc gia.\n` +
      `• **Luật & Pháp chế:** Đòi hỏi tư duy lập luận logic xã hội, phản biện và sự am hiểu pháp luật.\n` +
      `• **Thiết kế đồ họa & Mỹ thuật số:** Nơi bạn thỏa sức bay bổng với màu sắc, hình ảnh và khiếu thẩm mỹ.\n` +
      `• **Tâm lý học & Xã hội học:** Nghiên cứu hành vi con người và tư vấn tâm lý học đường/doanh nghiệp.\n\n` +
      `Bạn có thích viết lách, giao tiếp hay đam mê nghệ thuật/sáng tạo hơn không?`;
  }

  // 8. ĐÁNH GIÁ NĂNG LỰC / XÉT HỌC BẠ / CHỨNG CHỈ IELTS
  if (/đánh giá năng lực|đgnl|đgtd|hsa|ielts|xét học bạ|học bạ|xét tuyển sớm/.test(s)) {
    recordTopic('admission_methods');
    return `Hiện nay cánh cửa vào đại học không chỉ có mỗi kỳ thi Tốt nghiệp THPT mà có rất nhiều phương thức xét tuyển thông minh:\n\n` +
      `🎯 **1. Kỳ thi Đánh giá năng lực (ĐGNL/ĐGTD):**\n` +
      `• Kì thi do ĐHQG Hà Nội (HSA) và ĐHQG TP.HCM tổ chức từ tháng 3 đến tháng 6.\n` +
      `• Đề thi kiểm tra tư duy toàn diện, bạn được thi thử sức nhiều đợt để lấy điểm cao nhất nộp vào hàng chục trường đại học lớn.\n\n` +
      `📜 **2. Xét tuyển bằng Học bạ THPT:**\n` +
      `• Chiếm từ 30 - 50% chỉ tiêu ở nhiều trường. Bạn chỉ cần giữ điểm trung bình học bạ 3 năm THPT ở mức khá/giỏi là đã chắc suất vào đại học từ sớm!\n\n` +
      `🇬🇧 **3. Chứng chỉ Tiếng Anh (IELTS / TOEIC):**\n` +
      `• Đạt IELTS từ 5.5 - 6.5 trở lên thường được quy đổi thành điểm 9.0 - 10 môn Tiếng Anh khi xét tuyển đại học.`;
  }

  // 9. CHÀO HỎI / GIAO TIẾP TỰ NHIÊN
  if (/^(chào|xin chào|hello|hi|hey|alo|bạn ơi|có ai không|bot ơi|ad ơi|chào bot)\b/.test(s) || /^(chào|hello|hi)$/.test(s)) {
    const count = recordTopic('greeting');
    const greetings = [
      `Chào bạn! Rất vui được trò chuyện cùng bạn. Mình là NS AI, sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn về chọn ngành, chọn trường, cách học hay bất kỳ điều gì bạn đang băn khoăn! ✨`,
      `Xin chào bạn nhé! Mình đã ở đây rồi. Hôm nay việc học tập của bạn thế nào? Bạn muốn hỏi về ngành học, trường đại học hay cần tài liệu/mẹo ôn thi nào không?`,
      `Chào bạn! Mình có thể giúp bạn giải đáp từ định hướng nghề nghiệp, xem xét điểm số đến chia sẻ phương pháp học tập hiệu quả. Cứ thoải mái hỏi mình nhé! 🚀`,
      `Chào bạn nha! Rất vui được đồng hành cùng một học sinh năng động như bạn. Bạn đang quan tâm điều gì nhất hôm nay?`
    ];
    return greetings[(count - 1) % greetings.length];
  }

  // 10. CẢM ƠN / KHEN NGỢI
  if (/cảm ơn|cam on|thanks|thank you|tks|tks bot|tuyệt vời|hay quá|ok bot|cảm ơn bạn|bot xịn|thông minh thế/.test(s)) {
    const count = recordTopic('thanks');
    const thanksReplies = [
      'Không có gì nè! Rất vui vì giúp ích được cho bạn. Cứ thoải mái hỏi thêm bất cứ điều gì bạn tò mò nhé! Chúc bạn học thật vui và tự tin! ✨',
      'Được trò chuyện và hỗ trợ bạn là niềm vui của mình. Bạn cố gắng lên nhé, hành trình phía trước rất nhiều điều thú vị đang chờ bạn! 🚀',
      'Cảm ơn lời khen của bạn nha! Nếu có bài học nào khó hiểu hay phân vân chọn trường thì cứ nhắn mình bất kỳ lúc nào nhé! 🌟'
    ];
    return thanksReplies[(count - 1) % thanksReplies.length];
  }

  // 11. TẠM BIỆT
  if (/tạm biệt|tam biet|bye|goodbye|hẹn gặp lại|ngủ đây|đi ngủ|mình bận rồi/.test(s)) {
    return 'Tạm biệt bạn nhé! Chúc bạn có một ngày học tập thật hiệu quả và luôn ngập tràn năng lượng tích cực. Khi nào cần người gỡ rối cứ quay lại trò chuyện với NS AI nhé! 👋';
  }

  // 12. TÁN GẪU / ĐỐ VUI / HỎI VỀ BOT
  if (/bạn là ai|tên gì|who are you|giới thiệu về bạn|bạn thông minh không|bạn mấy tuổi|người yêu|kể chuyện cười|ai tạo ra bạn/.test(s)) {
    recordTopic('casual');
    if (/người yêu|yêu đương/.test(s)) {
      return 'Mình là một AI hướng nghiệp nên "người yêu" lớn nhất của mình chính là niềm vui khi thấy các bạn học sinh tìm được đúng ước mơ và ngành học phù hợp đó! Còn bạn thì sao nè? 😊';
    }
    if (/kể chuyện cười|vui vẻ/.test(s)) {
      return 'Tặng bạn một câu chuyện vui học đường nè:\nThầy giáo hỏi Tèo: "Em hãy cho thầy biết công thức của nước là gì?"\nTèo đáp: "Dạ thưa thầy là H-I-J-K-L-M-N-O ạ!"\nThầy ngạc nhiên: "Ai dạy em thế?"\nTèo tự tin: "Dạ hôm qua thầy vừa bảo nước là H to O (H to O -> H đến O) mà thầy!" 😂\nChúc bạn luôn giữ được tinh thần vui vẻ khi học tập nhé!';
    }
    return 'Mình là **NS Career AI Assistant** – một người bạn đồng hành ảo thông minh của học sinh THPT! Mình ở đây để giúp bạn khám phá năng lực bản thân, giải đáp thắc mắc về các ngành nghề, trường đại học và đồng hành cùng bạn trên con đường học tập. Bạn muốn hỏi mình điều gì cũng được nhé!';
  }

  // 13. HỒ SƠ HỌC SINH
  if (/tôi là ai|thông tin của em|hồ sơ|profile|bạn biết gì về em|xem lại thông tin/.test(s)) {
    recordTopic('profile');
    let scoreText = c.avg ? `${c.p.scoreCount} môn (Điểm TB: ${c.avg}/10)` : 'chưa nhập điểm';
    let imprintInfo = '';
    if (c.customAnswers && c.customAnswers.length) {
      imprintInfo = `• ✨ **Dấu ấn cá nhân (Phản xạ riêng của bạn):** Đã ghi nhận ${c.customAnswers.length} chia sẻ độc lập:\n` +
        c.customAnswers.map(ca => `  - *${ca.contextLabel || `Câu ${ca.questionNumber}`}:* "${ca.userAnswer}" (Quy đổi: ${ca.matchedGroup})`).join('\n') + '\n';
    }
    return `📋 **Tóm tắt hồ sơ của bạn đang được mình ghi nhớ:**\n\n` +
      `• **Học vấn:** ${c.grade}, tại ${c.province}\n` +
      `• **Mục tiêu tương lai:** ${c.goal}\n` +
      `• **Điểm học tập:** Đã nhập ${scoreText}\n` +
      `• **Sở thích:** ${c.hobbies}${c.custom}\n` +
      `• **Xu hướng tính cách:** ${c.p.personality}.\n` +
      imprintInfo + `\n` +
      `Bạn có muốn mình phân tích sâu hơn về mục nào trong hồ sơ không?`;
  }

  // 13.1 DẤU ẤN CÁ NHÂN & PHẢN XẠ TỰ LUẬN ĐÁP ÁN E
  if (/dấu ấn cá nhân|câu trả lời tự nhập|phản xạ riêng|tự luận|câu e|đáp án e|chia sẻ riêng|hybrid assessment/.test(s)) {
    recordTopic('custom_imprint');
    if (!c.customAnswers || !c.customAnswers.length) {
      return `✨ **Về dấu ấn cá nhân của bạn:**\n\n` +
        `Hiện tại trong bài trắc nghiệm tính cách (tinhcach.html), bạn chưa chọn đáp án **"E. ✍️ Khác"** để tự nhập suy nghĩ riêng. ` +
        `Bạn có thể quay lại bước 4 để chia sẻ cách tư duy độc lập của mình, NS AI sẽ phân tích NLP và giải thích cặn kẽ cho bạn nhé!`;
    }

    let res = `✨ **Phân tích Dấu ấn Cá nhân độc bản của bạn:**\n\n` +
      `NS AI đã ghi nhận **${c.customAnswers.length} phản xạ tự luận độc lập** do chính bạn tự nhập trong bài trắc nghiệm lai:\n\n`;

    c.customAnswers.forEach((ca, idx) => {
      res += `${idx + 1}. **${ca.contextLabel || `Tình huống ${ca.questionNumber}`}:**\n` +
        `   • *Bạn chia sẻ:* "${ca.userAnswer}"\n` +
        `   • *Phân tích NLP:* Khớp với **${ca.matchedGroup}**.\n\n`;
    });

    res += `💡 **Ý nghĩa hướng nghiệp:** Những câu trả lời này cho thấy bạn không bị bó buộc vào các phương án có sẵn mà luôn có tư duy độc lập, sáng tạo và thấu hiểu chính mình. Điều này giúp dự đoán nghề nghiệp chính xác và sát thực tế hơn rất nhiều! 🌟`;
    return res;
  }

  // 14. ÁP LỰC THI CỬ & CĂNG THẲNG HỌC TẬP CHUNG
  if (/áp lực thi cử|căng thẳng thi cử|lo thi|áp lực học tập|stress|căng thẳng|lo âu/.test(s)) {
    recordTopic('stress');
    return `Mình rất thấu hiểu cảm giác này của bạn. Áp lực thi cử và chọn trường ở lứa tuổi học sinh THPT thực sự không hề dễ dàng.\n\n` +
      `💡 **Một vài điều mình muốn nhắn gửi đến bạn:**\n` +
      `1. **Bạn không cần phải hoàn hảo:** Không ai có thể giỏi tất cả các môn. Hãy tập trung phát huy thế mạnh của mình thay vì dằn vặt vì những môn mình chưa tốt.\n` +
      `2. **Nghỉ ngơi cũng là một phần của việc học:** Nếu hôm nay quá mệt, hãy cho phép bản thân nghe một bản nhạc yêu thích, đi dạo hoặc đi ngủ sớm để nạp lại năng lượng.\n` +
      `3. **Tâm sự cùng người thân:** Đừng chịu đựng áp lực một mình. Nói ra với bạn thân, bố mẹ hoặc thầy cô sẽ giúp lòng bạn nhẹ nhõm hơn rất nhiều.\n\n` +
      `Bạn đang lo lắng nhiều nhất về bài thi sắp tới hay về việc chọn ngành? Kể cho mình nghe nhé!`;
  }

  // 15. TỔ HỢP MÔN / KHỐI THI NÊN THEO
  if (/tổ hợp|khối thi|thi khối gì|xét tuyển khối nào|theo tổ hợp gì|tổ hợp nào|khối nào|học khối gì/.test(s)) {
    recordTopic('combination');
    let targetCareer = null;
    if (c.results && c.results.length) {
      targetCareer = c.results.find(r => s.includes(r.name.toLowerCase()) || r.name.toLowerCase().split(/[\/ ]+/).some(w => w.length > 3 && s.includes(w)));
    }
    if (!targetCareer) targetCareer = c.top;

    if (targetCareer && targetCareer.combinations) {
      return `📚 **Ngành ${targetCareer.name} nên theo các tổ hợp môn sau:**\n\n` +
        `• **Các tổ hợp xét tuyển phổ biến:**\n  ${targetCareer.combinations.map(cb => `→ **${cb}**`).join('\n  ')}\n\n` +
        `• **Tổ hợp tối ưu nhất:** **${targetCareer.bestCombo || 'A00 hoặc D01'}**\n` +
        `• **Lời khuyên:** ${targetCareer.advice || ''}\n\n` +
        `💡 *Mẹo:* Bạn hãy tập trung kéo điểm 3 môn trong tổ hợp bạn tự tin nhất để tối ưu điểm thi đại học nhé!`;
    }

    return `💡 **Gợi ý các khối thi đại học trọng điểm:**\n\n` +
      `• **Khối A00 (Toán - Lý - Hóa):** Phù hợp Công nghệ thông tin, Kỹ thuật, Xây dựng.\n` +
      `• **Khối A01 (Toán - Lý - Anh):** Phù hợp CNTT, Logistics, Kinh tế, Ngoại thương.\n` +
      `• **Khối D01 (Toán - Văn - Anh):** Phù hợp Kinh tế, Quản trị, Luật, Ngôn ngữ, Truyền thông.\n` +
      `• **Khối B00 (Toán - Hóa - Sinh):** Dành riêng cho Y đa khoa, Dược, Nông nghiệp.\n` +
      `• **Khối C00 (Văn - Sử - Địa):** Dành cho Báo chí, Luật, Khoa học xã hội, Sư phạm.`;
  }

  // 16. CHỌN NGÀNH PHÙ HỢP / GỢI Ý NGÀNH NGHỀ
  if (/ngành khác|còn ngành nào|ngành tiếp theo|top ngành|danh sách ngành|các ngành phù hợp|xem thêm ngành|ngành thứ 2|ngành thứ hai/.test(s) ||
      (/chọn ngành|ngành gì|nghề gì|phù hợp|định hướng|ngành nào/.test(s) && chatState.topicCounts.career > 0)) {
    recordTopic('career');
    if (!c.results || c.results.length === 0) {
      return 'Bạn hãy hoàn thành mục Điểm số, Sở thích và Mục tiêu trước để mình có đủ dữ liệu phân tích nhé!';
    }

    const otherCareers = c.results.slice(1, 4);
    if (otherCareers.length === 0) {
      return `Hiện tại ngành bạn phù hợp nhất theo phân tích hồ sơ là **${c.top.name}** (${c.top.fitLevel || '🌟 Phù hợp nhất'}). Bạn có thể thử cập nhật thêm điểm các môn khác hoặc sở thích để mở rộng thêm gợi ý!`;
    }

    let list = otherCareers.map((item, i) =>
      `**Top ${i + 2}: ${item.name}** (${item.fitLevel || '✨ Mức độ phù hợp cao'})\n` +
      `• *Tổ hợp môn nên theo:* ${(item.combinations || []).slice(0, 3).join(', ')}\n` +
      `• *Lý do:* ${item.reason}`
    ).join('\n\n');

    return `🎯 **Các ngành tiềm năng tiếp theo trong hồ sơ của bạn:**\n\n${list}\n\n` +
      `💡 Bạn muốn mình phân tích sâu hơn về cơ hội nghề nghiệp hay khối thi của ngành nào trong số này?`;
  }

  if (/chọn ngành|ngành gì|nghề|định hướng|ngành nào phù hợp|ngành hợp với em/.test(s)) {
    recordTopic('career');
    if (!c.top) {
      return 'Bạn chưa có đủ dữ liệu để mình phân tích. Hãy hoàn thành các mục Thông tin, Điểm số, Sở thích, Tính cách và Mục tiêu trước nhé.';
    }

    return `🎯 **Bạn phù hợp nhất với ngành gì?**\n\n` +
      `• **Ngành bạn phù hợp nhất:** **${c.top.name}**\n` +
      `• **Mức độ đánh giá:** **${c.top.fitLevel || '🌟 Phù hợp nhất'}**\n` +
      `• **Tổ hợp môn nên theo:** ${(c.top.combinations || []).join(', ')}\n` +
      `• **Khối thi ưu tiên:** **${c.top.bestCombo || ''}**\n` +
      `• **Lời khuyên:** ${c.top.advice || ''}\n` +
      `• **Cơ sở phân tích:** Bạn có tính cách ${c.p.personality}, yêu thích lĩnh vực ${c.hobbies}${c.custom}, và có điểm tựa học tập phù hợp.\n\n` +
      `👉 *Bạn có muốn xem tiếp các ngành ở vị trí Top 2, Top 3 không? Hãy gõ "Xem ngành khác" nhé!*`;
  }

  // 17. GỢI Ý TRƯỜNG ĐẠI HỌC THEO KẾT QUẢ, MỤC TIÊU VÀ TỈNH / VÙNG MIỀN
  const provinceMatch = s.match(/ở\s+(hà nội|tp\.?\s*hồ chí minh|hồ chí minh|tphcm|sài gòn|đà nẵng|huế|cần thơ)|trường\s+ở\s+([a-z\sà-ỹ]+)/);
  if (provinceMatch || /gợi ý.*trường|trường.*phù hợp|tìm trường|học trường nào|đại học nào|trường nào.*ngành|chọn trường|danh sách trường|vùng miền.*trường|trường.*vùng miền/.test(s)) {
    recordTopic('school');

    // 1. Xác định khu vực / tỉnh thành mục tiêu
    let targetProvince = '';
    let targetRegionName = '';
    let targetHubs = [];

    if (s.includes('hà nội') || s.includes('miền bắc')) {
      targetProvince = s.includes('hà nội') ? 'Hà Nội' : '';
      targetRegionName = 'Miền Bắc';
      targetHubs = ['Hà Nội'];
    } else if (s.includes('đà nẵng') || s.includes('huế') || s.includes('miền trung')) {
      targetProvince = s.includes('huế') ? 'Huế' : (s.includes('đà nẵng') ? 'Đà Nẵng' : '');
      targetRegionName = 'Miền Trung & Tây Nguyên';
      targetHubs = ['Huế', 'Đà Nẵng'];
    } else if (s.includes('hồ chí minh') || s.includes('tphcm') || s.includes('sài gòn') || s.includes('cần thơ') || s.includes('miền nam')) {
      targetProvince = s.includes('cần thơ') ? 'Cần Thơ' : (s.includes('hồ chí minh') || s.includes('tphcm') ? 'TP. Hồ Chí Minh' : '');
      targetRegionName = 'Miền Nam';
      targetHubs = ['TP. Hồ Chí Minh', 'Cần Thơ'];
    } else if (c.province && c.province !== 'chưa chọn tỉnh/thành') {
      targetProvince = c.province;
      // Nhận diện vùng từ c.province
      const cpLower = c.province.toLowerCase();
      const central = ['huế', 'thừa thiên huế', 'đà nẵng', 'quảng nam', 'quảng ngãi', 'bình định', 'phú yên', 'khánh hòa', 'ninh thuận', 'bình thuận', 'quảng trị', 'quảng bình', 'hà tĩnh', 'nghệ an', 'thanh hóa', 'kon tum', 'gia lai', 'đắk lắk', 'đắk nông', 'lâm đồng'];
      const south = ['tp. hồ chí minh', 'hồ chí minh', 'tphcm', 'sài gòn', 'bình dương', 'đồng nai', 'bà rịa - vũng tàu', 'long an', 'tiền giang', 'bến tre', 'trà vinh', 'vĩnh long', 'đồng tháp', 'an giang', 'kiên giang', 'cần thơ', 'hậu giang', 'sóc trăng', 'bạc liêu', 'cà mau', 'tây ninh', 'bình phước'];
      const north = ['hà nội', 'hải phòng', 'quảng ninh', 'bắc ninh', 'thái nguyên', 'nam định', 'phú thọ', 'hải dương', 'vĩnh phúc', 'hưng yên', 'hà nam', 'ninh bình', 'thái bình', 'bắc giang', 'lào cai', 'yên bái', 'điện biên', 'hòa bình', 'lai châu', 'sơn la', 'hà giang', 'cao bằng', 'bắc kạn', 'lạng sơn', 'tuyên quang'];
      
      if (central.some(x => cpLower.includes(x))) {
        targetRegionName = 'Miền Trung & Tây Nguyên';
        targetHubs = ['Huế', 'Đà Nẵng'];
      } else if (south.some(x => cpLower.includes(x))) {
        targetRegionName = 'Miền Nam';
        targetHubs = ['TP. Hồ Chí Minh', 'Cần Thơ'];
      } else if (north.some(x => cpLower.includes(x))) {
        targetRegionName = 'Miền Bắc';
        targetHubs = ['Hà Nội'];
      } else {
        targetRegionName = 'Toàn quốc';
        targetHubs = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Huế'];
      }
    } else {
      targetRegionName = 'Toàn quốc';
      targetHubs = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Huế'];
    }

    // 2. Xác định ngành mục tiêu / kết quả đánh giá nổi bật
    const targetMajorName = (c.top && c.top.name) ? c.top.name : (c.goal || 'ngành phù hợp');

    // 3. Chấm điểm độ phù hợp của các trường
    const scored = (c.schools || []).map(sch => {
      let score = 0;
      const schProv = sch.province.toLowerCase();
      const tProv = targetProvince.toLowerCase();
      
      const isDirectLocal = tProv && (schProv.includes(tProv) || tProv.includes(schProv));
      const isHub = targetHubs.some(h => schProv.includes(h.toLowerCase()));

      if (isDirectLocal) score += 60;
      else if (isHub) score += 40;
      else score += 15;

      // Khớp ngành
      const tmLower = targetMajorName.toLowerCase();
      let matchedMajor = null;
      for (const m of sch.majors) {
        const mLower = m.toLowerCase();
        if (tmLower.includes(mLower) || mLower.includes(tmLower)) {
          score += 50;
          matchedMajor = m;
          break;
        }
        if ((tmLower.includes('công nghệ') || tmLower.includes('phần mềm') || tmLower.includes('trí tuệ')) &&
            (mLower.includes('công nghệ') || mLower.includes('máy tính') || mLower.includes('kỹ thuật'))) {
          score += 45;
          matchedMajor = m;
          break;
        }
        if ((tmLower.includes('kinh tế') || tmLower.includes('quản trị') || tmLower.includes('marketing') || tmLower.includes('tài chính') || tmLower.includes('logistics')) &&
            (mLower.includes('kinh tế') || mLower.includes('quản trị') || mLower.includes('marketing') || mLower.includes('tài chính'))) {
          score += 45;
          matchedMajor = m;
          break;
        }
        if ((tmLower.includes('y') || tmLower.includes('dược') || tmLower.includes('sức khỏe')) &&
            (mLower.includes('y khoa') || mLower.includes('dược') || mLower.includes('điều dưỡng'))) {
          score += 45;
          matchedMajor = m;
          break;
        }
        if ((tmLower.includes('sư phạm') || tmLower.includes('giáo dục')) &&
            (mLower.includes('sư phạm') || mLower.includes('ngữ văn') || mLower.includes('toán học'))) {
          score += 45;
          matchedMajor = m;
          break;
        }
      }

      if (sch.description.toLowerCase().includes(tmLower)) score += 15;

      return {
        ...sch,
        score,
        isDirectLocal,
        isHub,
        matchedMajor: matchedMajor || sch.majors[0]
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const topSchools = scored.slice(0, 3);

    if (topSchools.length > 0) {
      let list = topSchools.map((sch, i) =>
        `**${i + 1}. ${sch.name}**\n` +
        `• 📍 **Địa điểm:** ${sch.province} ${sch.isDirectLocal ? '*(Tại địa phương của bạn)*' : `*(Khu vực ${targetRegionName})*`}\n` +
        `• 🎓 **Ngành đào tạo thế mạnh:** ${sch.majors.join(', ')}\n` +
        `• 💡 **Lý do phù hợp:** Rất mạnh về ${sch.matchedMajor}, phù hợp với mục tiêu "${targetMajorName}" của bạn.\n` +
        `• 💵 **Học phí & Tuyển sinh:** ${sch.tuitionNote}\n` +
        `• 🌐 **Website:** ${sch.website}`
      ).join('\n\n');

      return `🏫 **Gợi ý các trường đại học phù hợp nhất với bạn:**\n\n` +
        `• **Mục tiêu / Ngành phân tích:** **${targetMajorName}**\n` +
        `• **Khu vực ưu tiên:** **${targetProvince || targetRegionName || 'Toàn quốc'}** ${targetRegionName ? `(${targetRegionName})` : ''}\n\n` +
        `${list}\n\n` +
        `👉 *Bạn có thể bấm vào mục **Trường học** trên thanh menu để tra cứu chỉ tiêu tuyển sinh chi tiết của tất cả các trường trên cả nước nhé!*`;
    }

    return `Bạn đang ở **${c.province}**. Hệ thống có dữ liệu chi tiết của các trường đại học lớn tại Hà Nội, TP.HCM, Đà Nẵng, Huế, Cần Thơ. Bạn có thể gõ tên trường (ví dụ: *Bách Khoa, Kinh tế Quốc dân, Y Hà Nội...*) để mình tra cứu ngay!`;
  }

  // 17.2. Tên trường cụ thể
  if (/bách khoa|kinh tế quốc dân|ngoại thương|y hà nội|sư phạm hà nội|kinh tế tp|đại học quốc gia|y dược|đà nẵng|đại học huế|cần thơ/.test(s)) {
    recordTopic('school');
    const matched = c.schools.find(sch =>
      s.includes(sch.name.toLowerCase()) ||
      (s.includes('bách khoa') && sch.name.includes('Bách khoa')) ||
      (s.includes('kinh tế quốc dân') && sch.name.includes('Kinh tế Quốc dân')) ||
      (s.includes('ngoại thương') && sch.name.includes('Ngoại thương')) ||
      (s.includes('y hà nội') && sch.name.includes('Y Hà Nội')) ||
      (s.includes('cần thơ') && sch.name.includes('Cần Thơ')) ||
      (s.includes('huế') && sch.name.includes('Huế'))
    );

    if (matched) {
      return `🏫 **Thông tin về ${matched.name}:**\n\n` +
        `• **Địa điểm:** ${matched.province}\n` +
        `• **Ngành thế mạnh:** ${matched.majors.join(', ')}\n` +
        `• **Mô tả:** ${matched.description}\n` +
        `• **Tuyển sinh:** ${matched.admissionNote}\n` +
        `• **Học phí:** ${matched.tuitionNote}\n` +
        `• **Website chính thức:** ${matched.website}`;
    }
  }

  // 18. HỎI VỀ TỪNG NGÀNH CỤ THỂ (IT, Kinh tế, Y Dược, Kỹ thuật, Luật, Sư phạm...)
  if (/công nghệ thông tin|khoa học máy tính|trí tuệ nhân tạo|ai|lập trình|phần mềm|game/.test(s)) {
    return `💻 **Ngành Công nghệ thông tin & Trí tuệ nhân tạo (AI):**\n\n` +
      `• **Điểm tựa:** Rất chuộng môn Toán và Tin học, đòi hỏi tư duy logic và tính tự học cao.\n` +
      `• **Vị trí công việc:** Kỹ sư phần mềm, Chuyên viên phát triển AI/Data, An ninh mạng, Lập trình ứng dụng/Game.\n` +
      `• **Tổ hợp xét tuyển:** A00, A01, D01, D07.\n` +
      `• **Trường hàng đầu:** ĐH Bách khoa (Hà Nội, TP.HCM, Đà Nẵng), ĐH Công nghệ (ĐHQGHN), ĐH KHTN, Học viện CNBCVT.`;
  }

  if (/kinh tế|quản trị kinh doanh|marketing|tài chính|ngân hàng|kinh doanh|logistics/.test(s)) {
    return `💼 **Ngành Kinh tế & Quản trị kinh doanh:**\n\n` +
      `• **Điểm tựa:** Cần nền tảng Toán, Tiếng Anh, khả năng giao tiếp và tư duy nhạy bén về thị trường.\n` +
      `• **Vị trí công việc:** Chuyên viên Marketing, Quản trị doanh nghiệp, Tài chính - Ngân hàng, Quản lý chuỗi cung ứng Logistics.\n` +
      `• **Tổ hợp xét tuyển:** A01, D01, A00.\n` +
      `• **Trường hàng đầu:** ĐH Ngoại thương (FTU), ĐH Kinh tế Quốc dân (NEU), ĐH Kinh tế TP.HCM (UEH), ĐH Kinh tế Đà Nẵng.`;
  }

  if (/y khoa|dược|bác sĩ|y dược|điều dưỡng|y tế|nha khoa/.test(s)) {
    return `🩺 **Ngành Y khoa & Dược học:**\n\n` +
      `• **Điểm tựa:** Cần điểm Sinh học, Hóa học tốt, đặc biệt là tính kiên trì và lòng trắc ẩn.\n` +
      `• **Thời gian học:** Thường kéo dài 5 - 6 năm, sau đó học chuyên khoa định hướng hoặc nội trú.\n` +
      `• **Tổ hợp xét tuyển:** B00 (Toán-Hóa-Sinh), A00 (với một số ngành Dược).\n` +
      `• **Trường hàng đầu:** ĐH Y Hà Nội, ĐH Y Dược TP.HCM, ĐH Y Dược Huế, ĐH Y Dược Cần Thơ.`;
  }

  // 19. ĐIỂM SỐ & MÔN HỌC
  const subjectQuery = s.match(/(môn|điểm)?\s*(toán|vật lý|vật lí|lý|lí|hóa học|hóa|sinh học|sinh|tin học|tin|ngữ văn|văn|tiếng anh|anh|lịch sử|sử|địa lý|địa|gdkt&pl|công nghệ công nghiệp|công nghệ nông nghiệp|công nghiệp|nông nghiệp|công nghệ)/);
  if (subjectQuery && (/điểm|sao|thế nào|ổn không|học gì/.test(s) || s.length < 35)) {
    recordTopic('subject');
    const subNameMap = {
      'công nghệ công nghiệp': 'Công nghệ công nghiệp',
      'công nghệ nông nghiệp': 'Công nghệ nông nghiệp',
      'công nghiệp': 'Công nghệ công nghiệp',
      'nông nghiệp': 'Công nghệ nông nghiệp',
      'công nghệ': 'Công nghệ công nghiệp',
      'toán': 'Toán', 'vật lý': 'Vật lý', 'vật lí': 'Vật lý', 'lý': 'Vật lý', 'lí': 'Vật lý',
      'hóa học': 'Hóa học', 'hóa': 'Hóa học', 'sinh học': 'Sinh học', 'sinh': 'Sinh học',
      'tin học': 'Tin học', 'tin': 'Tin học', 'ngữ văn': 'Ngữ văn', 'văn': 'Ngữ văn',
      'tiếng anh': 'Tiếng Anh', 'anh': 'Tiếng Anh', 'lịch sử': 'Lịch sử', 'sử': 'Lịch sử',
      'địa lý': 'Địa lý', 'địa': 'Địa lý', 'gdkt&pl': 'GDKT&PL', 'giáo dục công dân': 'GDKT&PL', 'gdcd': 'GDKT&PL'
    };
    const foundKey = Object.keys(subNameMap).find(k => s.includes(k));
    if (foundKey) {
      const realName = subNameMap[foundKey];
      const val = c.scores[realName];
      if (val != null) {
        let assessment = val >= 8.0 ? 'rất tốt, là thế mạnh vượt trội của bạn' : (val >= 6.5 ? 'ở mức khá, có nhiều tiềm năng bứt phá' : 'cần dành thêm thời gian luyện tập');
        return `📊 **Môn ${realName} của bạn hiện tại là ${val}/10 điểm:**\n` +
          `• Nhận xét: Mức điểm này ${assessment}.\n` +
          `• Môn ${realName} là môn trụ cột trong rất nhiều tổ hợp xét tuyển đại học. Bạn hãy tiếp tục duy trì và nâng cao môn này nhé!`;
      } else {
        return `Bạn chưa nhập điểm cho môn **${realName}** trong mục Điểm số. Hãy bổ sung để mình phân tích chuẩn xác hơn nhé!`;
      }
    }
  }

  if (/điểm|học bạ|kết quả học tập|thế mạnh|môn nào giỏi/.test(s)) {
    recordTopic('score');
    if (c.avg == null) {
      return 'Bạn chưa nhập điểm môn nào. Hãy vào mục **Điểm số** trên thanh menu và nhập các môn bạn đang học để mình đưa ra phân tích chính xác nhất nhé!';
    }
    let bestStr = c.bestSubjects.length
      ? c.bestSubjects.map(([sub, score]) => `**${sub}** (${score}đ)`).join(', ')
      : 'chưa xác định';

    return `📊 **Phân tích kết quả học tập:**\n\n` +
      `• Số môn đã nhập: **${c.p.scoreCount} môn**\n` +
      `• Điểm trung bình: **${c.avg}/10**\n` +
      `• Môn thế mạnh nổi bật: ${bestStr}\n\n` +
      `Với phổ điểm này, bạn đang có lợi thế ở các tổ hợp xét tuyển có môn ${c.bestSubjects[0] ? c.bestSubjects[0][0] : 'chính'}. Bạn có muốn mình tư vấn tổ hợp khối thi đại học phù hợp nhất không?`;
  }

  // 20. TÍNH CÁCH / MBTI
  if (/tính cách|mbti|nhóm tính cách|xu hướng tính cách|con người em|bản thân em/.test(s)) {
    recordTopic('personality');
    const mbti = (typeof computeMBTI === 'function') ? computeMBTI(c.p.answers || []) : null;
    if (mbti) {
      return `🧠 **Kết quả trắc nghiệm tính cách [MBTI] của bạn:**\n\n` +
        `• **Nhóm tính cách:** **${mbti.type} – ${mbti.title}**\n` +
        `• **Đặc điểm nổi bật:** ${mbti.desc}\n` +
        `• **Tỷ lệ 4 cặp chiều kích:**\n` +
        `  - Hướng ngoại (E: ${mbti.traits.E}/3) / Hướng nội (I: ${mbti.traits.I}/3)\n` +
        `  - Thực tế (S: ${mbti.traits.S}/3) / Trực giác (N: ${mbti.traits.N}/3)\n` +
        `  - Lý trí (T: ${mbti.traits.T}/3) / Cảm xúc (F: ${mbti.traits.F}/3)\n` +
        `  - Kỷ luật (J: ${mbti.traits.J}/3) / Linh hoạt (P: ${mbti.traits.P}/3)\n\n` +
        `💡 Với nhóm tính cách **${mbti.type}**, bạn sẽ phát huy tiềm năng vượt trội trong các môi trường công việc khuyến khích đúng thế mạnh tư duy của mình. Bạn có muốn mình phân tích sâu hơn về những ngành nghề sinh ra cho ${mbti.type} không?`;
    }

    return `🧠 **Xu hướng tính cách của bạn:**\n\n` +
      `Qua bài khảo sát, bạn là người **${c.p.personality}**.\n\n` +
      `• Bạn thường phát huy năng lượng tốt nhất trong môi trường công việc khuyến khích sự tự chủ và sáng tạo cá nhân.\n` +
      `• Kết hợp tính cách này với sở thích ${c.hobbies} sẽ giúp bạn tìm được công việc vừa làm tốt vừa tạo cảm hứng mỗi ngày!`;
  }

  // 21. SỞ THÍCH
  if (/sở thích|thích gì|đam mê|yêu thích/.test(s)) {
    recordTopic('hobbies');
    return `❤️ **Sở thích hiện tại trong hồ sơ của bạn:**\n\n` +
      `• Lĩnh vực quan tâm: **${c.hobbies}**${c.custom}\n\n` +
      `Sở thích là kim chỉ nam quan trọng nhất giúp bạn không bị chán nản trong 4 năm đại học. Bạn có muốn mình so sánh sở thích này với ngành bạn đang nhắm tới không?`;
  }

  // 22. CÂU TRẢ LỜI LINH HOẠT - TỰ NHIÊN NHƯ AI BÌNH THƯỜNG (KHÔNG DÙNG TEMPLATE RẬP KHUÔN)
  chatState.fallbackIndex++;

  // Nếu câu hỏi có từ khóa liên quan đến "tại sao", "như thế nào", "có nên", "làm gì"
  if (/tại sao|vi sao|như thế nào|thế nào|có nên|phải làm gì|làm sao/.test(s)) {
    return `Đây là một câu hỏi rất hay và sâu sắc! Dưới góc độ đồng hành và định hướng cho học sinh THPT, mình nghĩ điều quan trọng nhất là bạn cần cân bằng giữa **sở thích thực sự**, **năng lực học tập hiện tại** và **nhu cầu của xã hội**.\n\n` +
      `Bạn có thể chia sẻ cụ thể hơn hoàn cảnh hoặc suy nghĩ của bạn về điều này không? Mình luôn sẵn sàng lắng nghe và cùng bạn tháo gỡ từng bước một nhé! ✨`;
  }

  if (s.length < 15) {
    return `Mình đã nghe rõ bạn nói rồi nè! Bạn đang băn khoăn về vấn đề gì liên quan đến việc học, chọn ngành hay chọn trường? Cứ chia sẻ chi tiết hơn một chút để mình hỗ trợ bạn thật tốt nhé! 😊`;
  }

  const naturalReplies = [
    `Cảm ơn câu hỏi rất thú vị của bạn! Với tư cách là một trợ lý AI đồng hành cùng học sinh THPT, mình luôn sẵn sàng hỗ trợ bạn về:\n\n` +
    `• 🎯 **Định hướng nghề nghiệp & Khối thi xét tuyển**\n` +
    `• 🏫 **Tra cứu thông tin các trường đại học & học phí**\n` +
    `• 📚 **Phương pháp học tập & Nguồn tài liệu ôn thi hiệu quả**\n` +
    `• 💬 **Lắng nghe, chia sẻ và giải tỏa áp lực học đường**\n\n` +
    `Bạn muốn chúng mình cùng bàn luận sâu hơn về chủ đề nào? Hãy kể cho mình nghe nhé!`,

    `Mình rất thích cách bạn chủ động đặt câu hỏi để tìm hiểu tương lai! Để mình có thể đưa ra câu trả lời sát thực tế nhất cho bạn, bạn có thể nói rõ hơn về ngành nghề, trường học hay môn học bạn đang băn khoăn không? Mình đang ở đây và lắng nghe bạn nè! 🌟`,

    `Một góc nhìn rất đáng để suy ngẫm! Trong học tập và định hướng nghề nghiệp, mỗi thắc mắc của bạn đều là một bước tiến gần hơn đến mục tiêu. Bạn muốn mình phân tích thêm về khía cạnh nào: cơ hội việc làm, cách chọn trường hay cách cải thiện điểm số?`
  ];

  return naturalReplies[(chatState.fallbackIndex - 1) % naturalReplies.length];
}

// =================== QUẢN LÝ LỊCH SỬ ĐOẠN CHAT (SIDEBAR) ===================

const STORAGE_KEY_SESSIONS = 'ns_chat_sessions';
const STORAGE_KEY_CURRENT = 'ns_current_chat_id';

const DEFAULT_CHAT_SESSIONS = [];

function sanitizeChatSessions(sessions) {
  if (!Array.isArray(sessions)) return [];
  // Lọc sạch toàn bộ các tiêu đề mẫu ví dụ không phải của người dùng thực tế
  const mockKeywords = ['minh mạng', 'lời chào thân thiện', 'thống kê số lượng từ', 'nhớ đồng', 'sinh học 11', 'rút gọn văn bản'];
  return sessions.filter(s => {
    if (!s || !s.title) return false;
    const lower = s.title.toLowerCase();
    return !mockKeywords.some(kw => lower.includes(kw));
  });
}

function getChatSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    const valid = Array.isArray(arr) ? arr : [];
    const cleaned = sanitizeChatSessions(valid);
    if (cleaned.length !== valid.length) {
      saveChatSessions(cleaned);
    }
    return cleaned;
  } catch (e) {
    console.error('Error reading chat sessions:', e);
    return [];
  }
}

function saveChatSessions(sessions) {
  try {
    const cleaned = sanitizeChatSessions(sessions);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(cleaned));
  } catch (e) {
    console.error('Error saving chat sessions:', e);
  }
}

function getCurrentChatId() {
  return localStorage.getItem(STORAGE_KEY_CURRENT) || '';
}

function setCurrentChatId(id) {
  if (id) {
    localStorage.setItem(STORAGE_KEY_CURRENT, id);
  } else {
    localStorage.removeItem(STORAGE_KEY_CURRENT);
  }
}

function getStudentGreetingName() {
  let name = '';
  try {
    const info = typeof read === 'function' ? read('info') : null;
    if (info && info.name && info.name.trim()) {
      name = info.name.trim();
    }
    if (!name) {
      const rawInfo = localStorage.getItem('ns_info') || localStorage.getItem('info');
      if (rawInfo) {
        const parsed = JSON.parse(rawInfo);
        if (parsed && parsed.name && parsed.name.trim()) name = parsed.name.trim();
      }
    }
    if (!name) {
      const curUser = typeof getCurrentUser === 'function' ? getCurrentUser() : localStorage.getItem('ns_current_user');
      if (curUser && typeof curUser === 'string' && curUser.trim()) name = curUser.trim();
    }
  } catch (e) {}
  return name || 'bạn';
}

function getInitialGreetingMessage() {
  const name = getStudentGreetingName();
  const salutation = name !== 'bạn' ? `Chào ${name}!` : 'Chào bạn!';
  return `${salutation} Mình là NS AI – trợ lý định hướng và tư vấn tâm lý học đường. Mình luôn ở đây để lắng nghe bạn tâm sự về áp lực thi cử, chuyện gia đình, những ngày mệt mỏi hay băn khoăn về chọn ngành, chọn trường. Bạn có thể gõ phím hoặc bấm nút 🎙️ Micro để tâm sự trực tiếp bằng giọng nói nhé! 💚🌌`;
}

function initChatHistory() {
  // Dọn sạch hoàn toàn các dữ liệu mẫu ví dụ cũ trong trình duyệt
  if (!localStorage.getItem('ns_chat_empty_init_v6')) {
    let oldSessions = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (raw) oldSessions = JSON.parse(raw);
    } catch (e) {}
    const cleaned = sanitizeChatSessions(oldSessions);
    saveChatSessions(cleaned);
    localStorage.setItem('ns_chat_empty_init_v6', 'true');
  }

  let sessions = getChatSessions();
  let currentId = getCurrentChatId();
  let currentSession = sessions.find(s => s.id === currentId);

  renderSidebarUserProfile();
  renderSidebarConversations();

  if (currentSession) {
    loadSessionMessages(currentSession);
  } else {
    const badge = document.getElementById('activeChatBadge');
    if (badge) {
      badge.textContent = 'Đoạn chat mới';
      badge.title = 'Đoạn chat mới';
    }
    const box = document.getElementById('messages');
    if (box) {
      box.innerHTML = `
        <div class="msg bot">
          ${getInitialGreetingMessage()}
          <div class="msg-tools">
            <button type="button" class="btn-read-msg" title="Đọc bằng giọng nói" onclick="speakMessage(this)">🔊 Nghe đọc</button>
          </div>
        </div>
      `;
    }
  }
}

function loadSessionMessages(session) {
  if (!session) return;
  const box = document.getElementById('messages');
  if (!box) return;

  box.innerHTML = '';
  const msgs = session.messages || [];

  if (msgs.length === 0) {
    addMsg(getInitialGreetingMessage(), 'bot');
  } else {
    const sName = getStudentGreetingName();
    msgs.forEach((m, idx) => {
      let text = m.text;
      if (idx === 0 && m.who === 'bot' && sName !== 'bạn' && text.includes('Chào bạn!')) {
        text = text.replace(/Chào bạn!/g, `Chào ${sName}!`);
      }
      addMsg(text, m.who);
    });
  }

  const badge = document.getElementById('activeChatBadge');
  if (badge) {
    badge.textContent = session.title || 'Đoạn chat';
    badge.title = session.title || 'Đoạn chat';
  }
}

function renderSidebarConversations(filterText = '') {
  const container = document.getElementById('conversationList');
  if (!container) return;

  const sessions = getChatSessions();
  const currentId = getCurrentChatId();
  const filter = (filterText || '').trim().toLowerCase();

  const filtered = filter
    ? sessions.filter(s => (s.title || '').toLowerCase().includes(filter))
    : sessions;

  if (filtered.length === 0) {
    if (filter) {
      container.innerHTML = '<div class="conversation-empty" style="padding: 24px 10px; text-align: center; color: #64748b; font-size: 13px;">Không tìm thấy đoạn chat nào.</div>';
    } else {
      container.innerHTML = '<div class="conversation-empty" style="padding: 28px 12px; text-align: center; color: #64748b; font-size: 13px; line-height: 1.5;">Chưa có đoạn chat nào.<br><span style="font-size: 12px; color: #475569;">Gửi câu hỏi để bắt đầu lưu lịch sử!</span></div>';
    }
    return;
  }

  container.innerHTML = '';
  filtered.forEach(session => {
    const item = document.createElement('div');
    item.className = 'conversation-item' + (session.id === currentId ? ' active' : '');
    item.title = session.title;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'conversation-title-text';
    titleSpan.textContent = session.title;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-delete-conv';
    delBtn.title = 'Xóa cuộc trò chuyện';
    delBtn.innerHTML = '🗑️';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteChatSession(session.id);
    };

    item.appendChild(titleSpan);
    item.appendChild(delBtn);

    item.onclick = () => {
      switchChatSession(session.id);
    };

    container.appendChild(item);
  });
}

function switchChatSession(id) {
  const sessions = getChatSessions();
  const target = sessions.find(s => s.id === id);
  if (!target) return;

  setCurrentChatId(id);
  renderSidebarConversations();
  loadSessionMessages(target);
  toggleSidebarMobile(false);
}

function createNewChatSession() {
  const sessions = getChatSessions();
  const newId = 'conv_' + Date.now();
  const greetingName = getStudentGreetingName();
  const salutation = greetingName !== 'bạn' ? `Chào ${greetingName}!` : 'Chào bạn!';
  const newSession = {
    id: newId,
    title: 'Đoạn chat mới',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        who: 'bot',
        text: `${salutation} Mình là NS AI – trợ lý định hướng và tư vấn tâm lý học đường. Hôm nay bạn đang có điều gì muốn chia sẻ hoặc câu hỏi nào cần mình hỗ trợ không? 💚🌌`
      }
    ]
  };

  sessions.unshift(newSession);
  saveChatSessions(sessions);
  setCurrentChatId(newId);

  renderSidebarConversations();
  loadSessionMessages(newSession);

  const inputEl = document.getElementById('input');
  if (inputEl) {
    inputEl.focus();
  }

  toggleSidebarMobile(false);
}

function deleteChatSession(id) {
  let sessions = getChatSessions();
  const target = sessions.find(s => s.id === id);
  const targetTitle = target ? target.title : 'cuộc trò chuyện này';

  if (!confirm(`Bạn có chắc chắn muốn xóa "${targetTitle}" khỏi danh sách lưu?`)) {
    return;
  }

  sessions = sessions.filter(s => s.id !== id);
  saveChatSessions(sessions);

  const currentId = getCurrentChatId();
  if (currentId === id) {
    if (sessions.length > 0) {
      setCurrentChatId(sessions[0].id);
      loadSessionMessages(sessions[0]);
    } else {
      setCurrentChatId('');
      const badge = document.getElementById('activeChatBadge');
      if (badge) {
        badge.textContent = 'Đoạn chat mới';
        badge.title = 'Đoạn chat mới';
      }
      const box = document.getElementById('messages');
      if (box) {
        box.innerHTML = `
          <div class="msg bot">
            ${getInitialGreetingMessage()}
            <div class="msg-tools">
              <button type="button" class="btn-read-msg" title="Đọc bằng giọng nói" onclick="speakMessage(this)">🔊 Nghe đọc</button>
            </div>
          </div>
        `;
      }
    }
  }

  renderSidebarConversations();
}

function renderSidebarUserProfile() {
  const avatarEl = document.getElementById('sidebarUserAvatar');
  const nameEl = document.getElementById('sidebarUserName');
  const subtextEl = document.getElementById('sidebarUserSubtext');

  let userName = 'Học sinh';
  let isLogged = false;

  if (typeof getCurrentUser === 'function') {
    const loggedUser = getCurrentUser();
    if (loggedUser) {
      userName = loggedUser;
      isLogged = true;
    }
  }

  if (!isLogged && typeof getProfile === 'function') {
    const p = getProfile();
    if (p && p.info && p.info.name) {
      userName = p.info.name;
    }
  }

  if (nameEl) nameEl.textContent = userName;
  if (avatarEl) {
    const initial = userName.trim().charAt(0).toUpperCase() || '👤';
    avatarEl.textContent = initial;
  }
  if (subtextEl) {
    subtextEl.textContent = isLogged ? 'Đã đăng nhập' : 'Học sinh THPT';
    subtextEl.title = isLogged ? 'Tài khoản đã đăng nhập' : 'Học sinh THPT';
  }
}

function toggleSidebarFilter() {
  const searchBox = document.getElementById('sidebarSearchBox');
  const filterBtn = document.getElementById('sidebarFilterBtn');
  const searchInput = document.getElementById('sidebarSearchInput');
  if (!searchBox) return;

  const isHidden = searchBox.style.display === 'none';
  searchBox.style.display = isHidden ? 'block' : 'none';
  if (filterBtn) {
    filterBtn.classList.toggle('active', isHidden);
  }

  if (isHidden && searchInput) {
    searchInput.focus();
  } else if (!isHidden && searchInput) {
    searchInput.value = '';
    renderSidebarConversations('');
  }
}

function handleSearchConversations(val) {
  renderSidebarConversations(val);
}

function toggleSidebarMobile(forceState) {
  const sidebar = document.getElementById('chatSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar) return;

  const shouldOpen = (typeof forceState === 'boolean')
    ? forceState
    : !sidebar.classList.contains('open');

  sidebar.classList.toggle('open', shouldOpen);
  if (backdrop) {
    backdrop.classList.toggle('active', shouldOpen);
  }
}

function saveMessageToCurrentSession(who, text) {
  let sessions = getChatSessions();
  let currentId = getCurrentChatId();
  let session = sessions.find(s => s.id === currentId);

  // Nếu chưa có phiên chat nào trong lịch sử, tự động tạo mới khi người dùng gửi tin
  if (!session) {
    currentId = 'conv_' + Date.now();
    setCurrentChatId(currentId);
    session = {
      id: currentId,
      title: 'Đoạn chat mới',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    sessions.unshift(session);
  }

  if (!session.messages) session.messages = [];
  session.messages.push({
    who: who,
    text: text,
    time: new Date().toISOString()
  });

  // Tự động đặt tiêu đề theo câu hỏi đầu tiên của người dùng nếu là đoạn chat mới
  if (who === 'user' && (!session.title || session.title === 'Đoạn chat mới')) {
    const cleanTitle = text.replace(/[\r\n]+/g, ' ').trim();
    session.title = cleanTitle.length > 28 ? cleanTitle.slice(0, 28) + '...' : cleanTitle;
    const badge = document.getElementById('activeChatBadge');
    if (badge) {
      badge.textContent = session.title;
      badge.title = session.title;
    }
  }

  session.updatedAt = new Date().toISOString();
  saveChatSessions(sessions);
  renderSidebarConversations();
}

// =================== HIỆU ỨNG SUY NGHĨ & XỬ LÝ GỬI TIN NHẮN ===================

function showThinkingIndicator() {
  removeThinkingIndicator();
  const box = document.getElementById('messages');
  if (!box) return;

  const d = document.createElement('div');
  d.className = 'msg bot msg-thinking';
  d.id = 'thinkingIndicator';
  d.innerHTML = `
    <div class="thinking-dots">
      <span></span><span></span><span></span>
    </div>
    <span style="font-size: 13px; color: #a78bfa; margin-left: 8px; font-weight: 500;">
      NS AI đang suy nghĩ...
    </span>
  `;
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
}

function removeThinkingIndicator() {
  const el = document.getElementById('thinkingIndicator');
  if (el) el.remove();
}

function send() {
  if (chatState.isSending) return;

  const inputEl = document.getElementById('input');
  if (!inputEl) return;

  const q = inputEl.value.trim();
  if (!q) return;

  chatState.isSending = true;
  addMsg(q, 'user');
  saveMessageToCurrentSession('user', q);
  inputEl.value = '';
  inputEl.disabled = true;

  showThinkingIndicator();

  // Hiệu ứng phản hồi suy nghĩ tự nhiên (khoảng 300-380ms)
  setTimeout(() => {
    try {
      removeThinkingIndicator();
      let reply = answer(q);

      // Chống lặp câu trả lời giống hệt câu vừa trả lời
      if (reply === chatState.lastAnswer) {
        reply += '\n\n*(Nếu bạn muốn tìm hiểu khía cạnh khác, cứ gõ chủ đề cụ thể hoặc chọn các nút câu hỏi nhanh ở trên nhé!)*';
      }

      chatState.lastAnswer = reply;
      addMsg(reply, 'bot');
      saveMessageToCurrentSession('bot', reply);
    } catch (err) {
      console.error(err);
      removeThinkingIndicator();
      const errMsg = 'Mình đang gặp một chút gián đoạn khi xử lý, bạn hỏi lại giúp mình nhé! 😊';
      addMsg(errMsg, 'bot');
      saveMessageToCurrentSession('bot', errMsg);
    } finally {
      removeThinkingIndicator();
      chatState.isSending = false;
      inputEl.disabled = false;
      inputEl.focus();
    }
  }, 320);
}

function quick(q) {
  const inputEl = document.getElementById('input');
  if (!inputEl) return;
  inputEl.value = q;
  send();
}

// Bắt sự kiện phím Enter an toàn với bộ gõ tiếng Việt (Unikey / EVKey)
function initChatInput() {
  const inputEl = document.getElementById('input');
  if (inputEl && !inputEl.dataset.bound) {
    inputEl.dataset.bound = 'true';
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (e.isComposing) return; // Đang gõ dấu tiếng Việt thì không kích hoạt gửi
        e.preventDefault();
        send();
      }
    });
  }
}

function checkUrlPrompt() {
  try {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const p = params.get('prompt');
    if (p && p.trim()) {
      setTimeout(() => {
        quick(p.trim());
      }, 400);
    }
  } catch (err) {
    console.warn('URL prompt check error:', err);
  }
}

function initAllChatbot() {
  initChatInput();
  initChatHistory();
  checkUrlPrompt();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllChatbot);
} else {
  initAllChatbot();
}
