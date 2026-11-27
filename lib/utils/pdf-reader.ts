export function pdfReaderHtml(url: string): string {
  const pdfUrl = JSON.stringify(url).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="bn"><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
<style>
body { margin: 0; background: #f2f2f0; font-family: sans-serif; color: #59645c; }
#pages { padding: 14px 12px 4px; max-width: 760px; margin: 0 auto; }
.page { overflow: hidden; margin-bottom: 14px; border: 1px solid #e5e5e2; border-radius: 14px; background: white; box-shadow: 0 2px 5px #0002; }
canvas { display: block; width: 100%; height: auto; }
.label { padding: 7px 8px; text-align: center; font-size: 13px; color: #818981; border-top: 1px solid #f0f0ed; }
#status { padding: 40px 20px; text-align: center; }
</style></head><body><div id="status">প্রিভিউ লোড হচ্ছে...</div><div id="pages"></div>
<script type="module">
(async function () {
  const status = document.getElementById('status');
  const pages = document.getElementById('pages');
  try {
    const pdfjsLib = await import("https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.min.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
    const documentPdf = await pdfjsLib.getDocument({url: ${pdfUrl}, cMapUrl: "https://unpkg.com/pdfjs-dist@4.10.38/cmaps/", cMapPacked: true, standardFontDataUrl: "https://unpkg.com/pdfjs-dist@4.10.38/standard_fonts/"}).promise;
    status.remove();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(async entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        try {
          const page = await documentPdf.getPage(Number(entry.target.dataset.page));
          const natural = page.getViewport({scale: 1});
          const scale = Math.min((entry.target.clientWidth * Math.min(devicePixelRatio || 1, 2)) / natural.width, 3);
          const viewport = page.getViewport({scale});
          const canvas = entry.target.querySelector('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({canvasContext: canvas.getContext('2d'), viewport}).promise;
        } catch (_) { entry.target.querySelector('.label').textContent = 'পৃষ্ঠা লোড হয়নি'; }
      });
    }, {rootMargin: '700px'});
    for (let i = 1; i <= documentPdf.numPages; i++) {
      const card = document.createElement('section');
      card.className = 'page';
      card.dataset.page = i;
      const canvas = document.createElement('canvas');
      canvas.style.minHeight = '180px';
      card.appendChild(canvas);
      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = 'পৃষ্ঠা ' + i.toLocaleString('bn-BD');
      card.appendChild(label);
      pages.appendChild(card);
      observer.observe(card);
    }
  } catch (_) { status.textContent = 'প্রিভিউ লোড হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।'; }
})();
</script></body></html>`;
}
