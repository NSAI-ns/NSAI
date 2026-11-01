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
