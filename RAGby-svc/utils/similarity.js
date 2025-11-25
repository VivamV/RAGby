// server/utils/similarity.js
export function dot(a,b){
  let s = 0;
  for(let i=0;i<a.length && i<b.length;i++) s += a[i]*b[i];
  return s;
}
export function norm(a){
  return Math.sqrt(dot(a,a));
}
export function cosineSim(a,b){
  const na = norm(a), nb = norm(b);
  if(na === 0 || nb === 0) return 0;
  return dot(a,b)/(na*nb);
}
