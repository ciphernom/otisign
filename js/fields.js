const Fields = (function() {
  'use strict';

  let container = null;
  let onFieldClick = null;
  let onFieldMove = null;
  let onFieldResize = null;
  let onFieldDelete = null;

  let dragging = null;
  let dragOffset = { x: 0, y: 0 };
  let resizing = null;
  let resizeStart = { x: 0, y: 0, width: 0, height: 0 };

  function init(containerEl, callbacks = {}) {
    container = containerEl;
    onFieldClick = callbacks.onClick || (() => {});
    onFieldMove = callbacks.onMove || (() => {});
    onFieldResize = callbacks.onResize || (() => {});
    onFieldDelete = callbacks.onDelete || (() => {});
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  function render(fields, pageNum, options = {}) {
    if (!container) return;
    container.querySelectorAll('.field-overlay').forEach(el => el.remove());
    const pageFields = fields.filter(f => f.page === pageNum);
    pageFields.forEach(field => {
      const el = createFieldElement(field, options);
      container.appendChild(el);
    });
  }

  function createFieldElement(field, options = {}) {
    const { signers = [], selectedId = null, mode = 'prepare', currentSigner = null } = options;
    const signer = signers.find(s => s.id === field.signerId);
    const color = signer?.color || '#666666';

    const screenPos = PdfViewer.pdfToScreen(field.x, field.y, field.page + 1);
    const screenDims = PdfViewer.pdfDimsToScreen(field.width, field.height, field.page + 1);

    const el = document.createElement('div');
    el.className = 'field-overlay';
    el.dataset.fieldId = field.id;

    if (field.id === selectedId) el.classList.add('selected');
    if (field.value) el.classList.add('filled');

    if (mode === 'sign' && currentSigner && field.signerId !== currentSigner) {
      el.style.opacity = '0.4';
      el.style.pointerEvents = 'none';
    }

    el.style.cssText = `
      left: ${screenPos.x}px;
      top: ${screenPos.y - screenDims.height}px;
      width: ${screenDims.width}px;
      height: ${screenDims.height}px;
      border-color: ${color};
      color: ${color};
    `;

    if (field.value) {
      if (field.type === 'signature' || field.type === 'initials') {
        const img = document.createElement('img');
        img.src = field.value;
        img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain;';
        el.appendChild(img);
      } else {
        el.textContent = field.value;
      }
    } else {
      const label = document.createElement('span');
      label.className = 'field-label';
      label.textContent = getFieldLabel(field.type);
      if (signer && mode === 'prepare') label.textContent += `: ${signer.name.split(' ')[0]}`;
      el.appendChild(label);
    }

    if (mode === 'prepare') {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'field-delete';
      deleteBtn.innerHTML = '×';
      deleteBtn.addEventListener('click', e => { e.stopPropagation(); onFieldDelete(field.id); });
      el.appendChild(deleteBtn);

      if (field.id === selectedId) {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle resize-handle-se';
        resizeHandle.addEventListener('mousedown', e => { e.stopPropagation(); startResize(field, e); });
        el.appendChild(resizeHandle);
      }
    }

    el.addEventListener('click', e => { e.stopPropagation(); onFieldClick(field.id, field); });

    if (mode === 'prepare') {
      el.addEventListener('mousedown', e => {
        if (e.target.classList.contains('resize-handle') || e.target.classList.contains('field-delete')) return;
        startDrag(field, el, e);
      });
    }

    return el;
  }

  function getFieldLabel(type) {
    switch (type) {
      case 'signature': return 'Sign';
      case 'initials': return 'Initial';
      case 'date': return 'Date';
      case 'text': return 'Text';
      default: return type;
    }
  }

  function startDrag(field, element, e) {
    dragging = { field, element };
    const rect = element.getBoundingClientRect();
    dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    element.style.cursor = 'grabbing';
    element.style.zIndex = '100';
  }

  function startResize(field, e) {
    const element = container.querySelector(`[data-field-id="${field.id}"]`);
    if (!element) return;
    resizing = { field, element };
    resizeStart = { x: e.clientX, y: e.clientY, width: element.offsetWidth, height: element.offsetHeight };
  }

  function handleMouseMove(e) {
    if (dragging) {
      const containerRect = container.getBoundingClientRect();
      const newLeft = e.clientX - containerRect.left - dragOffset.x;
      const newTop = e.clientY - containerRect.top - dragOffset.y;
      dragging.element.style.left = `${Math.max(0, newLeft)}px`;
      dragging.element.style.top = `${Math.max(0, newTop)}px`;
    }
    if (resizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const newWidth = Math.max(50, resizeStart.width + deltaX);
      const newHeight = Math.max(20, resizeStart.height + deltaY);
      resizing.element.style.width = `${newWidth}px`;
      resizing.element.style.height = `${newHeight}px`;
    }
  }

  function handleMouseUp(e) {
    if (dragging) {
      const element = dragging.element;
      const field = dragging.field;
      element.style.cursor = '';
      element.style.zIndex = '';
      const screenX = parseFloat(element.style.left);
      const screenY = parseFloat(element.style.top) + element.offsetHeight;
      const pdfCoords = PdfViewer.screenToPdf(screenX, screenY, field.page + 1);
      onFieldMove(field.id, pdfCoords.x, pdfCoords.y);
      dragging = null;
    }
    if (resizing) {
      const element = resizing.element;
      const field = resizing.field;
      const scale = PdfViewer.getScale();
      const pdfWidth = element.offsetWidth / scale;
      const pdfHeight = element.offsetHeight / scale;
      onFieldResize(field.id, pdfWidth, pdfHeight);
      resizing = null;
    }
  }

  function highlight(fieldId) {
    const element = container?.querySelector(`[data-field-id="${fieldId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.animation = 'pulse 0.5s ease 2';
      setTimeout(() => { element.style.animation = ''; }, 1000);
    }
  }

  function destroy() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    container = null;
  }

  return { init, render, highlight, destroy };
})();
