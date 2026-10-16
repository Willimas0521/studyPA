const fs=require('fs');
const p='assets/diagrams.js';
let src=fs.readFileSync(p,'utf8');
let count=0;
/* g.arrow(g.cx(A), p1, g.cx(B)[+6], p2, color, lw)  →  g.arrow(A, p1, B[→(B)+0.15], p2, color, lw)
   arrow 的第 1/3 参数是 K 线索引，旧代码误包了一层 g.cx()（像素），二次转换后越界画出画布外 */
src=src.replace(/g\.arrow\(g\.cx\((.+?)\),\s*(.+?),\s*g\.cx\((.+?)\)(\s*\+\s*6)?,\s*(.+?),\s*(.+?),\s*([\d.]+)\)/g,
 (m,a1,p1,a2,off,p2,col,lw)=>{
   count++;
   const i2 = off ? '('+a2+') + 0.15' : a2;   /* 原来 +6 像素 ≈ 0.15 根棒 (barW=40) */
   return 'g.arrow('+a1+', '+p1+', '+i2+', '+p2+', '+col+', '+lw+')';
 });
fs.writeFileSync(p,src);
console.log('替换了',count,'处箭头');
