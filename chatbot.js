
function addMsg(text, who='bot') {
  const box = document.getElementById('messages');
  const d = document.createElement('div');
  d.className = 'msg ' + who;
  d.textContent = text;
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
}

function getChatContext() {
  const p = getProfile();
  const result = typeof analyzeCareer === 'function' ? analyzeCareer() : {results:[]};
  const top = result.results?.[0];

  const province = p.info.province || 'chưa chọn tỉnh/thành';
  const grade = p.info.grade ? `lớp ${p.info.grade}` : 'chưa chọn lớp';
  const goal = p.info.goal || 'chưa đặt mục tiêu';
  const hobbies = (p.hobbies.selected || []).join(', ') || 'chưa có';
  const custom = p.hobbies.custom ? `; ${p.hobbies.custom}` : '';
  const goals = (p.goals.selected || []).join(', ') || 'chưa có';
  const other = p.goals.other ? `; ${p.goals.other}` : '';
  const avg = p.avg == null ? null : p.avg.toFixed(1);

  return {p, top, province, grade, goal, hobbies, custom, goals, other, avg};
}

function answer(q) {
  const s = q.toLowerCase().trim();
  const c = getChatContext();

  if (/tự tử|muốn chết|tự làm hại|tự hại/.test(s)) {
    return 'Mình rất tiếc vì bạn đang phải đối mặt với cảm xúc nặng nề như vậy. Hãy báo ngay cho một người lớn đáng tin cậy ở gần bạn và tìm hỗ trợ khẩn cấp tại nơi bạn sống nếu bạn có nguy cơ không an toàn. Bạn không cần phải đối mặt với chuyện này một mình.';
  }

  if (/áp lực|stress|căng thẳng|mệt|buồn|lo lắng/.test(s)) {
    return `Mình hiểu ${c.grade} có thể có khá nhiều áp lực. Với mục tiêu hiện tại của bạn là “${c.goal}”, bạn có thể chia việc học thành từng phần nhỏ và nghỉ ngắn giữa các phiên học. Nếu cảm giác căng thẳng kéo dài hoặc ảnh hưởng mạnh đến sinh hoạt, hãy nói với phụ huynh, thầy cô hoặc người lớn đáng tin cậy.`;
  }

  if (/tôi là ai|thông tin của em|hồ sơ|profile|bạn biết gì về em/.test(s)) {
    return `Mình đang dựa trên thông tin bạn đã nhập: ${profileText()}`;
  }

  if (/chọn ngành|ngành gì|nghề|định hướng/.test(s)) {
    if (!c.top) return 'Bạn chưa có đủ dữ liệu để mình phân tích. Hãy hoàn thành các mục Thông tin, Điểm số, Sở thích, Tính cách và Mục tiêu trước nhé.';
    return `Dựa trên hồ sơ hiện tại của bạn, mình đang ưu tiên “${c.top.name}” với mức phù hợp ${c.top.score}%. Bạn đang ${c.p.personality}, có sở thích ${c.hobbies}${c.custom}, và đang quan tâm ${c.goals}${c.other}. Đây là gợi ý tham khảo, không phải kết luận nghề nghiệp.`;
  }

  if (/điểm|kết quả/.test(s)) {
    if (c.avg == null) return 'Bạn chưa nhập điểm. Vào mục Điểm số và chỉ nhập những môn bạn đang học hoặc đã có điểm.';
    return `Bạn đã nhập ${c.p.scoreCount} môn, điểm trung bình khoảng ${c.avg}/10. Mình sẽ kết hợp điểm này với sở thích, tính cách và mục tiêu thay vì chỉ nhìn vào một môn riêng lẻ.`;
  }

  if (/sở thích|thích gì|đam mê/.test(s)) {
    return `Hồ sơ hiện tại ghi nhận sở thích của bạn là: ${c.hobbies}${c.custom}. Nếu những sở thích này chưa đúng, bạn có thể vào mục Sở thích để cập nhật.`;
  }

  if (/tính cách|tính cách của em|phù hợp với tính cách/.test(s)) {
    return `Qua bộ câu hỏi hiện tại, xu hướng của bạn là ${c.p.personality}. Đây chỉ là xu hướng tham khảo; tính cách của mỗi người có thể thay đổi theo hoàn cảnh và trải nghiệm.`;
  }

  if (/trường/.test(s)) {
    return `Bạn đang ở ${c.province}. Hãy vào mục “Trường học” để tìm theo tên trường, tỉnh/thành hoặc ngành. Khi xem một trường, bạn có thể mở thông tin chi tiết về ngành tiêu biểu, mô tả, tuyển sinh và website chính thức.`;
  }

  if (/mục tiêu|mục tiêu học|ngành mục tiêu/.test(s)) {
    return `Mục tiêu hiện tại của bạn là “${c.goal}”; ngành bạn đang quan tâm là ${c.goals}${c.other}. Nếu chưa chắc, bạn có thể chọn nhiều ngành để mình so sánh.`;
  }

  return `Chào bạn! Mình đã đọc hồ sơ hiện tại của bạn và có thể hỗ trợ về ngành học, điểm số, sở thích, tính cách, mục tiêu và trường học. Ví dụ: “Ngành nào phù hợp với em?” hoặc “Tìm trường ở ${c.province}”.`;
}

function send() {
  const x = document.getElementById('input');
  const q = x.value.trim();
  if (!q) return;
  addMsg(q, 'user');
  x.value = '';
  setTimeout(() => addMsg(answer(q)), 250);
}

function quick(q) {
  document.getElementById('input').value = q;
  send();
}

document.getElementById('input').addEventListener('keydown', e => {
  if (e.key === 'Enter') send();
});
