const PdfViewer = (function() {
  'use strict';

  let pdfDoc = null;
  let currentScale = 1.5;
  let pageCanvases = new Map();
  let pageInfos = new Map();

  function init() {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
    }
  }

  async function loadPdf(arrayBuffer) {
    if (typeof pdfjsLib === 'undefined') throw new Error('pdf.js library not loaded');
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    pdfDoc = await loadingTask.promise;
    pageCanvases.clear();
    pageInfos.clear();
    return pdfDoc;
  }

  function getPageCount() { return pdfDoc ? pdfDoc.numPages : 0; }

  async function getPageInfo(pageNum) {
    if (pageInfos.has(pageNum)) return pageInfos.get(pageNum);
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const info = { width: viewport.width, height: viewport.height };
    pageInfos.set(pageNum, info);
    return info;
  }

  async function renderPage(pageNum, canvas, scale = currentScale) {
    if (!pdfDoc) throw new Error('No PDF loaded');
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    const renderContext = { canvasContext: ctx, viewport: viewport };
    await page.render(renderContext).promise;
    const info = { width: viewport.width / scale, height: viewport.height / scale, scale: scale };
    pageInfos.set(pageNum, info);
    return info;
  }

  async function renderThumbnail(pageNum, canvas, maxWidth = 150) {
    if (!pdfDoc) return;
    const page = await pdfDoc.getPage(pageNum);
    const originalViewport = page.getViewport({ scale: 1 });
    const scale = maxWidth / originalViewport.width;
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
  }

  function setScale(scale) { currentScale = scale; }
  function getScale() { return currentScale; }

  function screenToPdf(screenX, screenY, pageNum) {
    const info = pageInfos.get(pageNum);
    if (!info) return { x: 0, y: 0 };
    const scale = info.scale || currentScale;
    return { x: screenX / scale, y: info.height - (screenY / scale) };
  }

  function pdfToScreen(pdfX, pdfY, pageNum) {
    const info = pageInfos.get(pageNum);
    if (!info) return { x: 0, y: 0 };
    const scale = info.scale || currentScale;
    return { x: pdfX * scale, y: (info.height - pdfY) * scale };
  }

  function pdfDimsToScreen(pdfWidth, pdfHeight, pageNum) {
    const info = pageInfos.get(pageNum);
    const scale = info?.scale || currentScale;
    return { width: pdfWidth * scale, height: pdfHeight * scale };
  }

  function getDocument() { return pdfDoc; }

  return {
    init, loadPdf, getPageCount, getPageInfo, renderPage, renderThumbnail,
    setScale, getScale, screenToPdf, pdfToScreen, pdfDimsToScreen, getDocument
  };
})();
