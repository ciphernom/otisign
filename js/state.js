const State = (function() {
  'use strict';

  let state = {
    bundle: null,
    pdf: { document: null, pageCount: 0, pages: [], scale: 1.5 },
    ui: {
      mode: 'landing',
      currentPage: 0,
      selectedField: null,
      activeTool: null,
      zoom: 1.0,
      currentSigner: null,
      showSignaturePad: false,
      signaturePadType: null,
      loading: false,
      error: null
    }
  };

  const listeners = new Set();

  function get() { return state; }

  function update(updater) { updater(state); notify(); }

  function set(path, value) {
    const parts = path.split('.');
    let obj = state;
    for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = value;
    notify();
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function notify() {
    listeners.forEach(listener => {
      try { listener(state); }
      catch (e) { console.error('State listener error:', e); }
    });
  }

  function reset() {
    state = {
      bundle: null,
      pdf: { document: null, pageCount: 0, pages: [], scale: 1.5 },
      ui: {
        mode: 'landing', currentPage: 0, selectedField: null, activeTool: null,
        zoom: 1.0, currentSigner: null, showSignaturePad: false,
        signaturePadType: null, loading: false, error: null
      }
    };
    notify();
  }

  function setLoading(isLoading) { state.ui.loading = isLoading; notify(); }
  function setError(error) { state.ui.error = error; state.ui.loading = false; notify(); }
  function clearError() { state.ui.error = null; notify(); }
  function setMode(mode) { state.ui.mode = mode; state.ui.selectedField = null; state.ui.activeTool = null; notify(); }
  function setCurrentPage(page) { state.ui.currentPage = page; notify(); }
  function selectField(fieldId) { state.ui.selectedField = fieldId; notify(); }
  function deselectField() { state.ui.selectedField = null; notify(); }
  function setActiveTool(tool) { state.ui.activeTool = tool; state.ui.selectedField = null; notify(); }
  function clearActiveTool() { state.ui.activeTool = null; notify(); }
  function setCurrentSigner(signerId) { state.ui.currentSigner = signerId; notify(); }
  function openSignaturePad(type) { state.ui.showSignaturePad = true; state.ui.signaturePadType = type; notify(); }
  function closeSignaturePad() { state.ui.showSignaturePad = false; state.ui.signaturePadType = null; notify(); }
  function setBundle(bundle) { state.bundle = bundle; notify(); }

  function setPdfDocument(pdfDoc) {
    state.pdf.document = pdfDoc;
    state.pdf.pageCount = pdfDoc.numPages;
    state.pdf.pages = [];
    for (let i = 0; i < pdfDoc.numPages; i++) state.pdf.pages.push({ rendered: false, width: 0, height: 0 });
    notify();
  }

  function setPageInfo(pageNum, info) {
    if (state.pdf.pages[pageNum]) { Object.assign(state.pdf.pages[pageNum], info); notify(); }
  }

  return {
    get, update, set, subscribe, reset, setLoading, setError, clearError,
    setMode, setCurrentPage, selectField, deselectField, setActiveTool,
    clearActiveTool, setCurrentSigner, openSignaturePad, closeSignaturePad,
    setBundle, setPdfDocument, setPageInfo
  };
})();
