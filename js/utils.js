export const debounce = (fn, ms=80) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };
export function downloadText(text, filename="download.txt"){
  const blob = new Blob([text], { type:"text/plain" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href:url, download:filename });
  a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
export async function tryShare(data){
  try { if (navigator.share) await navigator.share(data); else alert("Link: " + data.url); } catch {}
}