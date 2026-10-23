function analyzeCareer(){
 const info=read('info')||{}, scores=read('scores')||{}, hobbies=read('hobbies')||{selected:[],custom:''}, answers=read('personalityAnswers')||[], goals=read('goals')||{selected:[],other:''};
 const avg=Object.values(scores).length?Object.values(scores).reduce((a,b)=>a+b,0)/Object.values(scores).length:6;
 const has=(txt)=>((hobbies.selected||[]).join(' ')+' '+(hobbies.custom||'')).toLowerCase().includes(txt);
 const result=[
  {name:'Công nghệ thông tin',base:55,fit:(scores['Tin học']||0)*3+(scores['Toán']||0)*2+(has('công nghệ')?12:0)+(has('game')?4:0)},
  {name:'Khoa học máy tính / Trí tuệ nhân tạo',base:50,fit:(scores['Tin học']||0)*2.5+(scores['Toán']||0)*2.5+(has('khoa học')?10:0)+(has('toán')?8:0)},
  {name:'Kinh tế / Quản trị kinh doanh',base:50,fit:(scores['Toán']||0)*1.5+(scores['Tiếng Anh']||0)*1.5+(has('kinh doanh')?15:0)+(has('giao tiếp')?7:0)},
  {name:'Y khoa / Dược học',base:45,fit:(scores['Sinh học']||0)*2.5+(scores['Hóa học']||0)*2.2+(has('khoa học')?7:0)},
  {name:'Kỹ thuật',base:50,fit:(scores['Toán']||0)*2+(scores['Vật lý']||0)*2+(has('kỹ thuật')?14:0)},
  {name:'Luật / Ngôn ngữ / Truyền thông',base:48,fit:(scores['Ngữ văn']||0)*2+(scores['Tiếng Anh']||0)*2+(has('giao tiếp')?12:0)+(has('viết')?8:0)},
  {name:'Sư phạm',base:45,fit:(scores['Ngữ văn']||0)*1.4+(scores['Toán']||0)*1.2+(has('giao tiếp')?10:0)}
 ];
 const boosts=answers.reduce((o,a)=>{if(a===0)o.logic=(o.logic||0)+1;if(a===1)o.people=(o.people||0)+1;if(a===2)o.creative=(o.creative||0)+1;if(a===3)o.patient=(o.patient||0)+1;return o},{});
 result.forEach(x=>{x.fit+=(boosts.logic||0)*(x.name.includes('Công nghệ')||x.name.includes('Kỹ thuật')?3:1);x.fit+=(boosts.people||0)*(x.name.includes('Luật')||x.name.includes('Sư phạm')||x.name.includes('Kinh tế')?3:1);x.fit+=(boosts.creative||0)*(x.name.includes('Trí tuệ')||x.name.includes('Truyền')?3:1);x.score=Math.max(35,Math.min(98,Math.round(x.base+x.fit/2)))});
 result.sort((a,b)=>b.score-a.score);
 result.forEach(x=>{x.reason=`Kết quả tham khảo dựa trên điểm các môn đã nhập (điểm trung bình hiện tại ${avg.toFixed(1)}), sở thích, câu trả lời tính cách và mục tiêu của bạn.`});
 return {province:info.province,goals:goals.selected||[],results:result.slice(0,6)};
}
