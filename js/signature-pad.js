const SignaturePad = (function() {
  'use strict';

  let modal = null;
  let canvas = null;
  let ctx = null;
  let isDrawing = false;
  let hasContent = false;
  let currentType = 'signature';
  let currentTab = 'draw';
  let onSave = null;
  let onCancel = null;

  const STROKE_COLOR = '#111111';
  const STROKE_WIDTH = 2.5;

  function init(callbacks = {}) {
    onSave = callbacks.onSave || (() => {});
    onCancel = callbacks.onCancel || (() => {});
    createModal();
  }

  function createModal() {
    modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="sig-title">Draw your signature</h3>
          <button class="modal-close" id="sig-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="tabs">
            <button class="tab active" data-tab="draw">Draw</button>
            <button class="tab" data-tab="type">Type</button>
          </div>
          <div class="tab-content" data-tab-content="draw">
            <div class="signature-pad-container">
              <canvas id="sig-canvas" class="signature-pad-canvas"></canvas>
              <div class="signature-pad-actions">
                <button class="btn btn-sm btn-ghost" id="sig-clear">Clear</button>
              </div>
            </div>
          </div>
          <div class="tab-content" data-tab-content="type" style="display: none;">
            <div class="form-group">
              <input type="text" id="sig-text" placeholder="Type your name" 
                style="font-family: 'Brush Script MT', 'Segoe Script', cursive; font-size: 2rem; text-align: center;">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="sig-cancel">Cancel</button>
          <button class="btn btn-primary" id="sig-save" disabled>Apply</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    canvas = modal.querySelector('#sig-canvas');
    ctx = canvas.getContext('2d');

    modal.querySelector('#sig-close').addEventListener('click', close);
    modal.querySelector('#sig-cancel').addEventListener('click', close);
    modal.querySelector('#sig-clear').addEventListener('click', clear);
    modal.querySelector('#sig-save').addEventListener('click', save);
    modal.querySelector('#sig-text').addEventListener('input', handleTextInput);

    modal.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', e => { e.preventDefault(); startDrawing(e.touches[0]); });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); draw(e.touches[0]); });
    canvas.addEventListener('touchend', stopDrawing);

    modal.addEventListener('click', e => { if (e.target === modal) close(); });
  }

  function switchTab(tabName) {
    currentTab = tabName;
    modal.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    modal.querySelectorAll('.tab-content').forEach(c => c.style.display = c.dataset.tabContent === tabName ? 'block' : 'none');
    updateSaveButton();
  }

  function open(type = 'signature') {
    currentType = type;
    hasContent = false;
    currentTab = 'draw';

    const title = type === 'initials' ? 'Draw your initials' : 'Draw your signature';
    modal.querySelector('#sig-title').textContent = title;

    modal.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'draw'));
    modal.querySelectorAll('.tab-content').forEach(c => c.style.display = c.dataset.tabContent === 'draw' ? 'block' : 'none');
    modal.querySelector('#sig-text').value = '';

    setupCanvas();
    clear();
    modal.classList.add('open');
    updateSaveButton();
  }

  function close() { modal.classList.remove('open'); onCancel(); }

  function setupCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = 150 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '150px';
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function clear() {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    hasContent = false;
    updateSaveButton();
  }

  function startDrawing(e) {
    isDrawing = true;
    ctx.beginPath();
    const pos = getCanvasPos(e);
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!isDrawing) return;
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    hasContent = true;
    updateSaveButton();
  }

  function stopDrawing() { isDrawing = false; }

  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleTextInput(e) { updateSaveButton(); }

  function updateSaveButton() {
    const saveBtn = modal.querySelector('#sig-save');
    let canSave = false;
    if (currentTab === 'draw') canSave = hasContent;
    else canSave = modal.querySelector('#sig-text').value.trim().length > 0;
    saveBtn.disabled = !canSave;
  }

  function save() {
    let imageData;
    if (currentTab === 'draw') imageData = getCanvasDataUrl();
    else imageData = getTextAsImage(modal.querySelector('#sig-text').value.trim());
    modal.classList.remove('open');
    onSave(imageData, currentType);
  }

  function getCanvasDataUrl() {
    const trimmed = trimCanvas(canvas);
    return trimmed.toDataURL('image/png');
  }

  function getTextAsImage(text) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = '48px "Brush Script MT", "Segoe Script", cursive';
    const metrics = tempCtx.measureText(text);
    const padding = 20;
    tempCanvas.width = metrics.width + padding * 2;
    tempCanvas.height = 70;
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.fillStyle = STROKE_COLOR;
    tempCtx.font = '48px "Brush Script MT", "Segoe Script", cursive';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);
    return tempCanvas.toDataURL('image/png');
  }

  function trimCanvas(c) {
    const context = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = c.width;
    const height = c.height;
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    let minX = width, minY = height, maxX = 0, maxY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (minX >= maxX || minY >= maxY) return c;

    const padding = 10 * dpr;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width, maxX + padding);
    maxY = Math.min(height, maxY + padding);

    const trimmedWidth = maxX - minX;
    const trimmedHeight = maxY - minY;

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = trimmedWidth;
    trimmedCanvas.height = trimmedHeight;

    const trimmedCtx = trimmedCanvas.getContext('2d');
    trimmedCtx.fillStyle = '#ffffff';
    trimmedCtx.fillRect(0, 0, trimmedWidth, trimmedHeight);
    trimmedCtx.drawImage(c, minX, minY, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);

    return trimmedCanvas;
  }

  function isOpen() { return modal && modal.classList.contains('open'); }

  return { init, open, close, isOpen };
})();
