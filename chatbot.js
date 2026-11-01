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
  fallbackIndex: 0
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
    schools
  };
}

function recordTopic(topic) {
  chatState.topicCounts[topic] = (chatState.topicCounts[topic] || 0) + 1;
  chatState.lastTopic = topic;
  return chatState.topicCounts[topic];
}

function answer(q) {
  const raw = q.trim();
  const s = normalizeQuery(raw);
  const c = getChatContext();

  // 1. CẢNH BÁO NGUY HIỂM / KHẨN CẤP
  if (/tự tử|muốn chết|tự làm hại|tự hại|tự sát|kết thúc cuộc sống/.test(s)) {
    return 'Mình rất lo lắng khi nghe bạn chia sẻ cảm xúc này. Hãy dừng lại một chút và hít thở thật sâu nhé. Bạn vô cùng quý giá và không hề đơn độc. Hãy liên hệ ngay với người thân, thầy cô hoặc gọi tổng đài bảo vệ trẻ em 111 (miễn phí) hoặc cơ sở y tế gần nhất để luôn có người bên cạnh lắng nghe và bảo vệ bạn nhé.';
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
    return `📋 **Tóm tắt hồ sơ của bạn đang được mình ghi nhớ:**\n\n` +
      `• **Học vấn:** ${c.grade}, tại ${c.province}\n` +
      `• **Mục tiêu tương lai:** ${c.goal}\n` +
      `• **Điểm học tập:** Đã nhập ${scoreText}\n` +
      `• **Sở thích:** ${c.hobbies}${c.custom}\n` +
      `• **Xu hướng tính cách:** ${c.p.personality}.\n\n` +
      `Bạn có muốn mình phân tích sâu hơn về mục nào trong hồ sơ không?`;
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
  const subjectQuery = s.match(/(môn|điểm)?\s*(toán|vật lý|vật lí|lý|lí|hóa học|hóa|sinh học|sinh|tin học|tin|ngữ văn|văn|tiếng anh|anh|lịch sử|sử|địa lý|địa|gdkt&pl)/);
  if (subjectQuery && (/điểm|sao|thế nào|ổn không|học gì/.test(s) || s.length < 25)) {
    recordTopic('subject');
    const subNameMap = {
      'toán': 'Toán', 'vật lý': 'Vật lý', 'vật lí': 'Vật lý', 'lý': 'Vật lý', 'lí': 'Vật lý',
      'hóa học': 'Hóa học', 'hóa': 'Hóa học', 'sinh học': 'Sinh học', 'sinh': 'Sinh học',
      'tin học': 'Tin học', 'tin': 'Tin học', 'ngữ văn': 'Ngữ văn', 'văn': 'Ngữ văn',
      'tiếng anh': 'Tiếng Anh', 'anh': 'Tiếng Anh', 'lịch sử': 'Lịch sử', 'sử': 'Lịch sử',
      'địa lý': 'Địa lý', 'địa': 'Địa lý', 'gdkt&pl': 'GDKT&PL'
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

function send() {
  if (chatState.isSending) return;

  const inputEl = document.getElementById('input');
  if (!inputEl) return;

  const q = inputEl.value.trim();
  if (!q) return;

  chatState.isSending = true;
  addMsg(q, 'user');
  inputEl.value = '';
  inputEl.disabled = true;

  // Hiệu ứng phản hồi tự nhiên (khoảng 250-350ms)
  setTimeout(() => {
    try {
      let reply = answer(q);

      // Chống lặp câu trả lời giống hệt câu vừa trả lời
      if (reply === chatState.lastAnswer) {
        reply += '\n\n*(Nếu bạn muốn tìm hiểu khía cạnh khác, cứ gõ chủ đề cụ thể hoặc chọn các nút câu hỏi nhanh ở trên nhé!)*';
      }

      chatState.lastAnswer = reply;
      addMsg(reply, 'bot');
    } catch (err) {
      console.error(err);
      addMsg('Mình đang gặp một chút gián đoạn khi xử lý, bạn hỏi lại giúp mình nhé! 😊', 'bot');
    } finally {
      chatState.isSending = false;
      inputEl.disabled = false;
      inputEl.focus();
    }
  }, 280);
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatInput);
} else {
  initChatInput();
}
