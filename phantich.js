/**
 * NS AI - Thuật toán phân tích định hướng nghề nghiệp
 * Kết hợp 5 trụ cột: Điểm số môn học, Sở thích, Xu hướng tính cách MBTI, Câu hỏi tự trả lời & Đáp án E, Mục tiêu học sinh
 * Cung cấp: Độ phù hợp, Lập luận minh bạch, Tổ hợp môn xét tuyển và lời khuyên chi tiết.
 */

function analyzeCareer() {
  const info = typeof read === 'function' ? (read('info') || {}) : {};
  const scores = typeof read === 'function' ? (read('scores') || {}) : {};
  const hobbies = typeof read === 'function' ? (read('hobbies') || { selected: [], custom: '' }) : { selected: [], custom: '' };
  const answers = typeof read === 'function' ? (read('personalityAnswers') || []) : [];
  const customAnswers = typeof read === 'function' ? (read('personalityCustomAnswers') || {}) : {};
  const selfReflect = typeof read === 'function' ? (read('personalitySelfReflect') || { strengths: '', idealEnv: '', vision: '' }) : { strengths: '', idealEnv: '', vision: '' };
  const goals = typeof read === 'function' ? (read('goals') || { selected: [], other: '' }) : { selected: [], other: '' };

  const vals = Object.values(scores);
  const avg = vals.length
    ? vals.reduce((a, b) => a + Number(b), 0) / vals.length
    : 6;

  const allHobbyText = ((hobbies.selected || []).join(' ') + ' ' + (hobbies.custom || '')).toLowerCase();
  const has = (...keywords) => keywords.some(k => allHobbyText.includes(k.toLowerCase()));

  const customValues = Object.values(customAnswers).filter(Boolean);
  const openText = (
    (selfReflect.strengths || '') + ' ' +
    (selfReflect.idealEnv || '') + ' ' +
    (selfReflect.vision || '') + ' ' +
    customValues.join(' ')
  ).toLowerCase();
  const hasReflect = (...keywords) => keywords.some(k => openText.includes(k.toLowerCase()));

  const result = [
    {
      name: 'Công nghệ thông tin',
      base: 55,
      fit:
        (scores['Tin học'] || 0) * 3 +
        (scores['Toán'] || 0) * 2 +
        (has('công nghệ', 'lập trình', 'phần mềm', 'website', 'máy tính', 'an ninh mạng', 'app') ? 14 : 0) +
        (has('game', 'esports') ? 5 : 0) +
        (hasReflect('công nghệ', 'lập trình', 'code', 'phần mềm', 'máy tính', 'ai', 'game', 'dữ liệu', 'app') ? 12 : 0),
      combinations: [
        'A00 (Toán, Lý, Hóa)',
        'A01 (Toán, Lý, Anh)',
        'D01 (Toán, Văn, Anh)',
        'D07 (Toán, Hóa, Anh)'
      ],
      bestCombo: 'A00 hoặc A01',
      advice: 'Nên ưu tiên khối A00 hoặc A01 nếu có thế mạnh tự nhiên; hoặc D01 nếu tự tin môn Tiếng Anh.'
    },
    {
      name: 'Khoa học máy tính / Trí tuệ nhân tạo',
      base: 50,
      fit:
        (scores['Tin học'] || 0) * 2.5 +
        (scores['Toán'] || 0) * 2.5 +
        (has('ai', 'trí tuệ nhân tạo', 'dữ liệu', 'khoa học', 'toán', 'robot') ? 15 : 0) +
        (has('lập trình', 'công nghệ') ? 8 : 0) +
        (hasReflect('ai', 'trí tuệ nhân tạo', 'dữ liệu', 'khoa học', 'toán', 'robot', 'thuật toán') ? 12 : 0),
      combinations: [
        'A00 (Toán, Lý, Hóa)',
        'A01 (Toán, Lý, Anh)',
        'D01 (Toán, Văn, Anh)'
      ],
      bestCombo: 'A00 hoặc A01',
      advice: 'Môn Toán tư duy logic và Tin học là chìa khóa. Các trường lớn (Bách Khoa, ĐHQG) tuyển sinh chủ yếu khối A00 và A01.'
    },
    {
      name: 'Kinh tế / Quản trị kinh doanh',
      base: 50,
      fit:
        (scores['Toán'] || 0) * 1.5 +
        (scores['Tiếng Anh'] || 0) * 1.5 +
        (has('kinh doanh', 'khởi nghiệp', 'tài chính', 'chứng khoán', 'marketing', 'bán hàng', 'thương mại', 'logistics') ? 16 : 0) +
        (has('giao tiếp', 'lãnh đạo', 'đàm phán') ? 7 : 0) +
        (hasReflect('kinh doanh', 'khởi nghiệp', 'tài chính', 'quản lý', 'marketing', 'doanh nghiệp', 'lãnh đạo') ? 12 : 0),
      combinations: [
        'A01 (Toán, Lý, Anh)',
        'D01 (Toán, Văn, Anh)',
        'A00 (Toán, Lý, Hóa)',
        'D07 (Toán, Hóa, Anh)'
      ],
      bestCombo: 'D01 hoặc A01',
      advice: 'Khối D01 và A01 có chỉ tiêu lớn nhất tại các trường như Ngoại thương, Kinh tế Quốc dân, UEH.'
    },
    {
      name: 'Y khoa / Dược học',
      base: 45,
      fit:
        (scores['Sinh học'] || 0) * 2.5 +
        (scores['Hóa học'] || 0) * 2.2 +
        (has('y học', 'dược', 'sức khỏe', 'thảo dược', 'bệnh') ? 16 : 0) +
        (has('khoa học', 'thí nghiệm', 'sinh học', 'hóa học') ? 9 : 0) +
        (hasReflect('bác sĩ', 'y tế', 'chữa bệnh', 'cứu người', 'dược', 'sức khỏe', 'bệnh viện') ? 12 : 0),
      combinations: [
        'B00 (Toán, Hóa, Sinh)',
        'A00 (Toán, Lý, Hóa)',
        'D07 (Toán, Hóa, Anh)'
      ],
      bestCombo: 'B00',
      advice: 'Khối B00 là con đường chính cho Y đa khoa; ngành Dược mở rộng thêm xét tuyển khối A00 và D07.'
    },
    {
      name: 'Kỹ thuật',
      base: 50,
      fit:
        (scores['Toán'] || 0) * 2 +
        (scores['Vật lý'] || 0) * 2 +
        (has('kỹ thuật', 'cơ khí', 'ô tô', 'máy bay', 'chế tạo', 'mạch điện', 'in 3d', 'kiến trúc') ? 16 : 0) +
        (has('robot', 'tự động') ? 6 : 0) +
        (hasReflect('kỹ thuật', 'cơ khí', 'chế tạo', 'máy móc', 'ô tô', 'robot', 'lắp ráp') ? 12 : 0),
      combinations: [
        'A00 (Toán, Lý, Hóa)',
        'A01 (Toán, Lý, Anh)',
        'C01 (Toán, Văn, Lý)'
      ],
      bestCombo: 'A00 hoặc A01',
      advice: 'Nên tập trung tối đa vào cặp môn Toán - Lý để xét tuyển vào các trường kỹ thuật hàng đầu.'
    },
    {
      name: 'Luật / Ngôn ngữ / Truyền thông',
      base: 48,
      fit:
        (scores['Ngữ văn'] || 0) * 2 +
        (scores['Tiếng Anh'] || 0) * 2 +
        (has('giao tiếp', 'thuyết trình', 'tranh biện', 'ngoại ngữ', 'luật', 'công lý') ? 14 : 0) +
        (has('viết', 'báo chí', 'podcast', 'nội dung', 'truyện', 'truyền thông') ? 10 : 0) +
        (hasReflect('luật', 'công lý', 'báo chí', 'truyền thông', 'viết lách', 'ngoại ngữ', 'tranh biện', 'thuyết trình') ? 12 : 0),
      combinations: [
        'D01 (Toán, Văn, Anh)',
        'C00 (Văn, Sử, Địa)',
        'A01 (Toán, Lý, Anh)',
        'D14 (Văn, Sử, Anh)'
      ],
      bestCombo: 'D01 hoặc C00',
      advice: 'Khối D01 mang lại cơ hội xét tuyển rộng nhất; khối C00 có lợi thế lớn với ngành Luật và Báo chí.'
    },
    {
      name: 'Sư phạm',
      base: 45,
      fit:
        (scores['Ngữ văn'] || 0) * 1.4 +
        (scores['Toán'] || 0) * 1.2 +
        (has('giảng dạy', 'truyền cảm hứng', 'giáo dục') ? 16 : 0) +
        (has('giao tiếp', 'sách', 'tâm lý') ? 8 : 0) +
        (hasReflect('dạy học', 'giảng dạy', 'giáo dục', 'truyền cảm hứng', 'học sinh', 'sư phạm') ? 12 : 0),
      combinations: [
        'C00 (Văn, Sử, Địa)',
        'D01 (Toán, Văn, Anh)',
        'A00 (Toán, Lý, Hóa)',
        'B00 (Toán, Hóa, Sinh)'
      ],
      bestCombo: 'Tùy bộ môn chuyên ngành',
      advice: 'Chọn tổ hợp có môn bạn muốn giảng dạy (Dạy Toán - A00/A01; Dạy Văn/Sử - C00/D01; Dạy Ngoại ngữ - D01).'
    }
  ];

  const mbti = typeof computeMBTI === 'function' ? computeMBTI(answers) : null;
  const customMap = typeof read === 'function' ? (read('personalityCustomAnswers') || {}) : {};

  const boosts = answers.reduce((o, a, i) => {
    if (a === 0) o.logic = (o.logic || 0) + 1;
    if (a === 1) o.people = (o.people || 0) + 1;
    if (a === 2) o.creative = (o.creative || 0) + 1;
    if (a === 3) o.patient = (o.patient || 0) + 1;
    if (a === 4) {
      const txt = (customMap[i] || '').toLowerCase();
      if (/toán|logic|phân tích|nghiên cứu|khoa học|công nghệ|lập trình/.test(txt)) o.logic = (o.logic || 0) + 1;
      else if (/con người|giao tiếp|chia sẻ|lắng nghe|giúp đỡ|tư vấn/.test(txt)) o.people = (o.people || 0) + 1;
      else if (/sáng tạo|nghệ thuật|đổi mới|tự do|ý tưởng|thiết kế/.test(txt)) o.creative = (o.creative || 0) + 1;
      else if (/cẩn thận|kiên nhẫn|kỷ luật|thực tế|chăm chỉ/.test(txt)) o.patient = (o.patient || 0) + 1;
    }
    return o;
  }, {});

  result.forEach(x => {
    if (mbti) {
      const t = mbti.type;
      const xn = x.name.toLowerCase();
      if (t.includes('T') && t.includes('N') && (xn.includes('công nghệ') || xn.includes('kỹ thuật') || xn.includes('trí tuệ'))) x.fit += 8;
      if (t.includes('E') && t.includes('T') && (xn.includes('kinh tế') || xn.includes('quản trị') || xn.includes('logistics'))) x.fit += 8;
      if (t.includes('E') && t.includes('F') && (xn.includes('sư phạm') || xn.includes('truyền thông') || xn.includes('luật'))) x.fit += 8;
      if (t.includes('I') && t.includes('F') && (xn.includes('y') || xn.includes('dược') || xn.includes('sư phạm'))) x.fit += 8;
      if (t.includes('S') && t.includes('J') && (xn.includes('kinh tế') || xn.includes('kỹ thuật'))) x.fit += 5;
    } else {
      x.fit +=
        (boosts.logic || 0) *
        (x.name.includes('Công nghệ') || x.name.includes('Kỹ thuật') ? 3 : 1);
      x.fit +=
        (boosts.people || 0) *
        (x.name.includes('Luật') ||
        x.name.includes('Sư phạm') ||
        x.name.includes('Kinh tế')
          ? 3
          : 1);
      x.fit +=
        (boosts.creative || 0) *
        (x.name.includes('Trí tuệ') || x.name.includes('Truyền') ? 3 : 1);
    }

    const wanted = [
      ...(goals.selected || []),
      goals.other || '',
      goals.dreamMajor || '',
      goals.dreamCareer || ''
    ]
      .join(' ')
      .toLowerCase();

    if (
      wanted &&
      x.name
        .toLowerCase()
        .split(/[\/ ]+/)
        .some(word => word.length > 3 && wanted.includes(word))
    ) {
      x.fit += 12;
    }

    x.score = Math.max(35, Math.min(98, Math.round(x.base + x.fit / 2)));
  });

  result.sort((a, b) => b.score - a.score);

  result.forEach((x, idx) => {
    if (idx === 0) x.fitLevel = '🌟 Phù hợp nhất';
    else if (idx === 1) x.fitLevel = '✨ Phù hợp rất cao';
    else if (idx === 2) x.fitLevel = '✨ Phù hợp cao';
    else x.fitLevel = '👍 Khá phù hợp';
  });

  // Xây dựng cơ sở lập luận chi tiết cho từng ngành
  result.forEach(x => {
    // 1. Phân tích Điểm số & Năng lực học tập
    const relevantSubjects = [];
    if (x.name.includes('Công nghệ') || x.name.includes('Khoa học máy tính')) {
      if (scores['Tin học'] != null) relevantSubjects.push(`Tin học (${scores['Tin học']})`);
      if (scores['Toán'] != null) relevantSubjects.push(`Toán (${scores['Toán']})`);
      if (scores['Vật lý'] != null) relevantSubjects.push(`Vật lý (${scores['Vật lý']})`);
      if (scores['Tiếng Anh'] != null) relevantSubjects.push(`Tiếng Anh (${scores['Tiếng Anh']})`);
    } else if (x.name.includes('Kinh tế')) {
      if (scores['Toán'] != null) relevantSubjects.push(`Toán (${scores['Toán']})`);
      if (scores['Tiếng Anh'] != null) relevantSubjects.push(`Tiếng Anh (${scores['Tiếng Anh']})`);
      if (scores['Ngữ văn'] != null) relevantSubjects.push(`Ngữ văn (${scores['Ngữ văn']})`);
    } else if (x.name.includes('Y')) {
      if (scores['Sinh học'] != null) relevantSubjects.push(`Sinh học (${scores['Sinh học']})`);
      if (scores['Hóa học'] != null) relevantSubjects.push(`Hóa học (${scores['Hóa học']})`);
      if (scores['Toán'] != null) relevantSubjects.push(`Toán (${scores['Toán']})`);
    } else if (x.name.includes('Kỹ thuật')) {
      if (scores['Toán'] != null) relevantSubjects.push(`Toán (${scores['Toán']})`);
      if (scores['Vật lý'] != null) relevantSubjects.push(`Vật lý (${scores['Vật lý']})`);
      if (scores['Hóa học'] != null) relevantSubjects.push(`Hóa học (${scores['Hóa học']})`);
    } else if (x.name.includes('Luật') || x.name.includes('Truyền')) {
      if (scores['Ngữ văn'] != null) relevantSubjects.push(`Ngữ văn (${scores['Ngữ văn']})`);
      if (scores['Tiếng Anh'] != null) relevantSubjects.push(`Tiếng Anh (${scores['Tiếng Anh']})`);
      if (scores['Lịch sử'] != null) relevantSubjects.push(`Lịch sử (${scores['Lịch sử']})`);
    } else if (x.name.includes('Sư phạm')) {
      if (scores['Ngữ văn'] != null) relevantSubjects.push(`Ngữ văn (${scores['Ngữ văn']})`);
      if (scores['Toán'] != null) relevantSubjects.push(`Toán (${scores['Toán']})`);
    }

    let academicDetail = '';
    if (relevantSubjects.length) {
      academicDetail = `Các môn thế mạnh tương thích: <strong>${relevantSubjects.join(', ')}</strong> (Điểm TB chung: ${vals.length ? avg.toFixed(1) : 'Chưa có'}). Rất phù hợp tổ hợp xét tuyển <strong>${x.bestCombo}</strong>.`;
    } else if (vals.length) {
      academicDetail = `Điểm trung bình các môn đã nhập đạt <strong>${avg.toFixed(1)}</strong>. Nhóm ngành này phù hợp xét tuyển các tổ hợp: ${x.combinations.join(', ')}.`;
    } else {
      academicDetail = `Bạn chưa nhập điểm môn học cụ thể. Ngành này xét tuyển các tổ hợp: ${x.combinations.join(', ')}.`;
    }

    // 2. Phân tích MBTI & phong cách tư duy
    let mbtiDetail = '';
    if (mbti) {
      mbtiDetail = `Nhóm tính cách <strong>[${mbti.type}] ${mbti.title}</strong> (${mbti.vietnameseTrait}). ${mbti.desc} Phong cách tư duy và hành động này là ưu thế lớn trong môi trường ${x.name}.`;
    } else {
      mbtiDetail = `Dựa trên kết quả trả lời câu hỏi, phong cách tư duy của bạn có xu hướng phù hợp với văn hóa làm việc của ngành ${x.name}.`;
    }

    // 3. Phân tích Sở thích & Đam mê
    let hobbyDetail = '';
    const selectedList = hobbies.selected || [];
    if (selectedList.length || hobbies.custom) {
      const allList = [...selectedList];
      if (hobbies.custom) allList.push(`"${hobbies.custom}"`);
      hobbyDetail = `Sở thích bạn đã chọn: <strong>${allList.join(', ')}</strong>. Sự say mê tự nhiên này mang lại động lực học tập và nghiên cứu bền bỉ.`;
    } else {
      hobbyDetail = 'Bạn chưa chọn danh mục sở thích cụ thể (có thể bổ sung tại bước Sở thích để tăng độ chuẩn xác).';
    }

    // 4. Phân tích Tiếng nói tự thân (Câu hỏi tự trả lời & Đáp án E)
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

    x.reason = `Điểm phù hợp được tổng hợp từ: ${relevantSubjects.length ? relevantSubjects.join(', ') : `Điểm TB ${avg.toFixed(1)}`}, nhóm tính cách [${mbti ? mbti.type : 'MBTI'}], sở thích tự nhiên và mục tiêu đã chọn.`;
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
