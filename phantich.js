/**
 * NS AI - Thuật toán phân tích định hướng nghề nghiệp công bằng & khoa học
 * Đánh giá đa chiều dựa trên 5 trụ cột:
 * 1. Điểm số môn học (Tương thích theo tổ hợp môn xét tuyển thực tế tại các trường ĐH)
 * 2. Sở thích & Đam mê tự nhiên (Bao quát trọn vẹn toàn bộ 50 sở thích thực tế)
 * 3. Xu hướng tính cách MBTI & Phong cách tư duy
 * 4. Tiếng nói tự thân (Câu hỏi tự bộc lộ & Đáp án tự do E)
 * 5. Mục tiêu & Nguyện vọng cụ thể của học sinh (Ưu tiên cao nhất khi học sinh đã có định hướng rõ)
 *
 * Đảm bảo: TUYỆT ĐỐI KHÔNG THIÊN VỊ bất kỳ ngành nào (kể cả CNTT). Mọi ngành đều có cơ hội và xuất phát điểm công bằng.
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
      hobbyKeys: ['y học', 'y tế', 'khám chữa bệnh', 'dược học', 'thảo dược', 'hóa dược', 'nghiên cứu khoa học', 'chăm sóc động vật', 'thú cưng', 'môi trường', 'sinh thái', 'yoga', 'thiền định', 'sức khỏe tinh thần', 'tập gym', 'thể hình', 'fitness', 'thể thao', 'phục hồi chức năng', 'nông nghiệp công nghệ cao', 'công nghệ sinh học'],
      entHobbyKeys: ['chăm sóc', 'thú cưng', 'sức khỏe'],
      goalKeys: ['bác sĩ', 'y khoa', 'y đa khoa', 'dược sĩ', 'dược', 'y tế', 'điều dưỡng', 'nha sĩ', 'răng hàm mặt', 'y - dược', 'bệnh viện', 'cứu người', 'thú y', 'y học cổ truyền'],
      mbtiPairs: ['ISFJ', 'INFJ', 'ISTJ', 'ISFP', 'ESFJ', 'ENFJ', 'IS', 'IF'],
      reflectKeys: ['bác sĩ', 'y tế', 'chữa bệnh', 'cứu người', 'dược', 'sức khỏe', 'bệnh viện', 'y khoa', 'chăm sóc', 'sinh học', 'nông nghiệp'],
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
      hobbyKeys: ['cơ khí', 'ô tô', 'chế tạo máy móc', 'điện tử', 'vi mạch', 'phần cứng máy tính', 'kiến trúc', 'kỹ thuật xây dựng', 'thiên văn học', 'vũ trụ', 'thiết kế nội thất', 'môi trường', 'năng lượng', 'công nghệ công nghiệp'],
      entHobbyKeys: ['lắp ráp', 'mô hình', 'diy'],
      goalKeys: ['kỹ thuật', 'cơ khí', 'chế tạo', 'ô tô', 'điện', 'tự động hóa', 'cơ điện tử', 'kỹ sư', 'hàng không', 'kiến trúc', 'xây dựng'],
      mbtiPairs: ['ISTP', 'ISTJ', 'ESTP', 'INTJ', 'ENTJ', 'ST'],
      reflectKeys: ['kỹ thuật', 'cơ khí', 'chế tạo', 'máy móc', 'ô tô', 'robot', 'lắp ráp', 'điện tử', 'công trình', 'công nghệ'],
      combinations: ['A00 (Toán, Lý, Hóa)', 'A01 (Toán, Lý, Anh)', 'C01 (Toán, Văn, Lý)'],
      bestCombo: 'A00 hoặc A01',
      advice: 'Nên tập trung tối đa vào khối Tự nhiên (Toán - Lý - Công nghệ công nghiệp/Hóa/Anh) để xét tuyển vào các trường kỹ thuật hàng đầu.'
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