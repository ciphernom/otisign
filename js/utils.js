const Utils = (function() {
  'use strict';

  function el(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') element.className = value;
      else if (key === 'style' && typeof value === 'object') Object.assign(element.style, value);
      else if (key.startsWith('on') && typeof value === 'function') element.addEventListener(key.slice(2).toLowerCase(), value);
      else if (key === 'dataset') Object.assign(element.dataset, value);
      else element.setAttribute(key, value);
    }
    if (typeof children === 'string') element.textContent = children;
    else if (Array.isArray(children)) children.forEach(child => {
      if (typeof child === 'string') element.appendChild(document.createTextNode(child));
      else if (child instanceof Node) element.appendChild(child);
    });
    return element;
  }

  function $(selector, parent = document) { return parent.querySelector(selector); }
  function $$(selector, parent = document) { return parent.querySelectorAll(selector); }

  function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function formatSigningDate(date = new Date()) { return date.toISOString().split('T')[0]; }

  function formatTimestamp(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function debounce(fn, delay) {
    let timeout;
    return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => fn.apply(this, args), delay); };
  }

  function throttle(fn, limit) {
    let inThrottle;
    return function(...args) { if (!inThrottle) { fn.apply(this, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } };
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function uniqueId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function prevent(e) { e.preventDefault(); e.stopPropagation(); }

  function isSecureContext() {
    return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  }

  function toast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const t = el('div', {
      className: `toast toast-${type}`,
      style: { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: '4px', backgroundColor: type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#333', color: '#fff', fontSize: '14px', zIndex: '10000', opacity: '0', transition: 'opacity 0.3s' }
    }, message);
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; });
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
  }

  function pdfToScreen(pdfX, pdfY, pageHeight, scale) { return { x: pdfX * scale, y: (pageHeight - pdfY) * scale }; }
  function screenToPdf(screenX, screenY, pageHeight, scale) { return { x: screenX / scale, y: pageHeight - (screenY / scale) }; }

  return { el, $, $$, formatDate, formatSigningDate, formatTimestamp, debounce, throttle, clone, uniqueId, downloadBlob, readFileAsArrayBuffer, readFileAsText, readFileAsDataURL, prevent, isSecureContext, toast, pdfToScreen, screenToPdf };
})();
