
const NS_PREFIX = 'ns_';

function save(key, value) {
  localStorage.setItem(NS_PREFIX + key, JSON.stringify(value));
}

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(NS_PREFIX + key));
  } catch (e) {
    return null;
  }
}

function resetAllData(showMessage = true) {
  Object.keys(localStorage)
    .filter(k => k.startsWith(NS_PREFIX))
    .forEach(k => localStorage.removeItem(k));

  if (showMessage) {
    alert('Đã tạo phiên mới. Toàn bộ dữ liệu cũ đã được xóa.');
    location.href = 'index.html';
  }
}

function loadInfo() {
  const d = read('info');
  if (!d) return;

  ['province', 'grade', 'goal'].forEach(k => {
    const el = document.getElementById(k);
    if (el && d[k] != null) el.value = d[k];
  });
}

function getProfile() {
  const info = read('info') || {};
  const scores = read('scores') || {};
  const hobbies = read('hobbies') || {selected: [], custom: ''};
  const answers = read('personalityAnswers') || [];
  const goals = read('goals') || {selected: [], other: ''};

  const values = Object.values(scores);
  const avg = values.length
    ? values.reduce((a,b) => a + Number(b), 0) / values.length
    : null;

  const counts = {logic: 0, people: 0, creative: 0, patient: 0};
  answers.forEach(a => {
    if (a === 0) counts.logic++;
    if (a === 1) counts.people++;
    if (a === 2) counts.creative++;
    if (a === 3) counts.patient++;
  });

  let personality = 'đang được xác định';
  const top = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
  if (top && top[1] > 0) {
    personality = {
      logic: 'thiên về tư duy và phân tích',
      people: 'thiên về giao tiếp và hợp tác',
      creative: 'thiên về sáng tạo và thử nghiệm',
      patient: 'thiên về kiên trì và ổn định'
    }[top[0]];
  }

  return {
    info,
    scores,
    hobbies,
    answers,
    goals,
    avg,
    personality,
    scoreCount: values.length
  };
}

function profileText() {
  const p = getProfile();
  const name = 'bạn';
  const province = p.info.province || 'chưa chọn tỉnh/thành';
  const grade = p.info.grade ? `lớp ${p.info.grade}` : 'chưa chọn lớp';
  const goal = p.info.goal || 'chưa đặt mục tiêu';
  const hobbies = (p.hobbies.selected || []).join(', ') || 'chưa chọn sở thích';
  const goals = (p.goals.selected || []).join(', ') || 'chưa chọn ngành';
  const custom = p.hobbies.custom ? `; sở thích thêm: ${p.hobbies.custom}` : '';
  const other = p.goals.other ? `; ngành quan tâm thêm: ${p.goals.other}` : '';
  const avg = p.avg == null ? 'chưa có' : p.avg.toFixed(1);

  return `${name} đang ở ${province}, ${grade}; mục tiêu: ${goal}; đã nhập ${p.scoreCount} môn, điểm trung bình ${avg}; sở thích: ${hobbies}${custom}; ngành quan tâm: ${goals}${other}; xu hướng tính cách: ${p.personality}.`;
}

function analyzeCareer() {
  const info = read('info') || {};
  const scores = read('scores') || {};
  const hobbies = read('hobbies') || {selected: [], custom: ''};
  const answers = read('personalityAnswers') || [];
  const goals = read('goals') || {selected: [], other: ''};

  const vals = Object.values(scores);
  const avg = vals.length ? vals.reduce((a,b) => a + Number(b), 0) / vals.length : 6;
  const has = txt => ((hobbies.selected || []).join(' ') + ' ' + (hobbies.custom || '')).toLowerCase().includes(txt);

  const result = [
    {name:'Công nghệ thông tin', base:55, fit:(scores['Tin học']||0)*3+(scores['Toán']||0)*2+(has('công nghệ')?12:0)+(has('game')?4:0)},
    {name:'Khoa học máy tính / Trí tuệ nhân tạo', base:50, fit:(scores['Tin học']||0)*2.5+(scores['Toán']||0)*2.5+(has('khoa học')?10:0)+(has('toán')?8:0)},
    {name:'Kinh tế / Quản trị kinh doanh', base:50, fit:(scores['Toán']||0)*1.5+(scores['Tiếng Anh']||0)*1.5+(has('kinh doanh')?15:0)+(has('giao tiếp')?7:0)},
    {name:'Y khoa / Dược học', base:45, fit:(scores['Sinh học']||0)*2.5+(scores['Hóa học']||0)*2.2+(has('khoa học')?7:0)},
    {name:'Kỹ thuật', base:50, fit:(scores['Toán']||0)*2+(scores['Vật lý']||0)*2+(has('kỹ thuật')?14:0)},
    {name:'Luật / Ngôn ngữ / Truyền thông', base:48, fit:(scores['Ngữ văn']||0)*2+(scores['Tiếng Anh']||0)*2+(has('giao tiếp')?12:0)+(has('viết')?8:0)},
    {name:'Sư phạm', base:45, fit:(scores['Ngữ văn']||0)*1.4+(scores['Toán']||0)*1.2+(has('giao tiếp')?10:0)}
  ];

  const boosts = answers.reduce((o,a) => {
    if (a===0) o.logic=(o.logic||0)+1;
    if (a===1) o.people=(o.people||0)+1;
    if (a===2) o.creative=(o.creative||0)+1;
    if (a===3) o.patient=(o.patient||0)+1;
    return o;
  }, {});

  result.forEach(x => {
    x.fit += (boosts.logic||0) * (x.name.includes('Công nghệ') || x.name.includes('Kỹ thuật') ? 3 : 1);
    x.fit += (boosts.people||0) * (x.name.includes('Luật') || x.name.includes('Sư phạm') || x.name.includes('Kinh tế') ? 3 : 1);
    x.fit += (boosts.creative||0) * (x.name.includes('Trí tuệ') || x.name.includes('Truyền') ? 3 : 1);

    const wanted = [...(goals.selected || []), goals.other || ''].join(' ').toLowerCase();
    if (wanted && x.name.toLowerCase().split(/[\/ ]+/).some(word => word.length > 3 && wanted.includes(word))) {
      x.fit += 12;
    }

    x.score = Math.max(35, Math.min(98, Math.round(x.base + x.fit/2)));
  });

  result.sort((a,b) => b.score-a.score);

  result.forEach(x => {
    x.reason = `Điểm phù hợp được tham khảo từ ${vals.length ? `điểm ${vals.length} môn (TB ${avg.toFixed(1)})` : 'chưa có dữ liệu điểm'}, sở thích, câu trả lời tính cách và mục tiêu ngành.`;
  });

  return {
    province: info.province,
    grade: info.grade,
    goals: goals.selected || [],
    results: result.slice(0,6)
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
