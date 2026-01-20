/**
 * bundle.js - .ots-sign file format handling
 * 
 * The .ots-sign format is a JSON file containing:
 * - The PDF document (base64 encoded)
 * - Signer definitions
 * - Field placements
 * - Signature data
 * - Completion status
 */

const Bundle = (function() {
  'use strict';

  const VERSION = '1.0';
  const MIME_TYPE = 'application/json';
  const EXTENSION = '.ots-sign';

  /**
   * Create a new empty bundle
   * @param {File} pdfFile 
   * @returns {Promise<Object>}
   */
  async function create(pdfFile) {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    return {
      version: VERSION,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      
      document: {
        name: pdfFile.name,
        size: pdfFile.size,
        data: base64
      },

      signers: [],
      fields: [],
      
      status: 'draft',  // draft | in_progress | completed
      
      // Filled after completion
      completedDocument: null,
      timestamp: null
    };
  }

  /**
   * Load bundle from file
   * @param {File} file 
   * @returns {Promise<Object>}
   */
  async function load(file) {
    const text = await file.text();
    const bundle = JSON.parse(text);

    // Validate
    if (!bundle.version) {
      throw new Error('Invalid bundle: missing version');
    }
    if (!bundle.document || !bundle.document.data) {
      throw new Error('Invalid bundle: missing document');
    }

    return bundle;
  }

  /**
   * Save bundle to downloadable file
   * @param {Object} bundle 
   * @param {string} filename 
   */
  function save(bundle, filename) {
    bundle.modified = new Date().toISOString();
    
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: MIME_TYPE });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || getDefaultFilename(bundle);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get PDF as ArrayBuffer from bundle
   * @param {Object} bundle 
   * @returns {ArrayBuffer}
   */
  function getPdfBytes(bundle) {
    return base64ToArrayBuffer(bundle.document.data);
  }

  /**
   * Update PDF in bundle (after embedding signatures)
   * @param {Object} bundle 
   * @param {Uint8Array} pdfBytes 
   */
  function setCompletedPdf(bundle, pdfBytes) {
    bundle.completedDocument = {
      data: arrayBufferToBase64(pdfBytes),
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Add a signer to the bundle
   * @param {Object} bundle 
   * @param {string} name 
   * @param {string} email 
   * @returns {Object} the new signer
   */
  function addSigner(bundle, name, email) {
    const colors = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#9b5de5', '#f72585'];
    const colorIndex = bundle.signers.length % colors.length;

    const signer = {
      id: 's' + Date.now() + Math.random().toString(36).substr(2, 5),
      name: name,
      email: email.toLowerCase().trim(),
      color: colors[colorIndex],
      signed: false,
      signedAt: null,
      publicKey: null,
      signatureImage: null
    };

    bundle.signers.push(signer);
    return signer;
  }

  /**
   * Remove a signer and their fields
   * @param {Object} bundle 
   * @param {string} signerId 
   */
  function removeSigner(bundle, signerId) {
    bundle.signers = bundle.signers.filter(s => s.id !== signerId);
    bundle.fields = bundle.fields.filter(f => f.signerId !== signerId);
  }

  /**
   * Add a field to the bundle
   * @param {Object} bundle 
   * @param {Object} fieldData 
   * @returns {Object} the new field
   */
  function addField(bundle, fieldData) {
    const field = {
      id: 'f' + Date.now() + Math.random().toString(36).substr(2, 5),
      type: fieldData.type,        // signature | initials | date | text
      signerId: fieldData.signerId,
      page: fieldData.page,        // 0-indexed
      x: fieldData.x,              // PDF coordinates
      y: fieldData.y,
      width: fieldData.width || getDefaultWidth(fieldData.type),
      height: fieldData.height || getDefaultHeight(fieldData.type),
      required: fieldData.required !== false,
      value: null,
      signatureData: null          // cryptographic signature data
    };

    bundle.fields.push(field);
    return field;
  }

  /**
   * Remove a field
   * @param {Object} bundle 
   * @param {string} fieldId 
   */
  function removeField(bundle, fieldId) {
    bundle.fields = bundle.fields.filter(f => f.id !== fieldId);
  }

  /**
   * Update a field
   * @param {Object} bundle 
   * @param {string} fieldId 
   * @param {Object} updates 
   */
  function updateField(bundle, fieldId, updates) {
    const field = bundle.fields.find(f => f.id === fieldId);
    if (field) {
      Object.assign(field, updates);
    }
  }

  /**
   * Get fields for a specific signer
   * @param {Object} bundle 
   * @param {string} signerId 
   * @returns {Array}
   */
  function getFieldsForSigner(bundle, signerId) {
    return bundle.fields.filter(f => f.signerId === signerId);
  }

  /**
   * Get unsigned fields for a signer
   * @param {Object} bundle 
   * @param {string} signerId 
   * @returns {Array}
   */
  function getUnsignedFields(bundle, signerId) {
    return bundle.fields.filter(f => f.signerId === signerId && !f.value);
  }

  /**
   * Check if all required fields are filled
   * @param {Object} bundle 
   * @returns {boolean}
   */
  function isComplete(bundle) {
    return bundle.fields
      .filter(f => f.required)
      .every(f => f.value !== null);
  }

  /**
   * Check if a signer has completed all their fields
   * @param {Object} bundle 
   * @param {string} signerId 
   * @returns {boolean}
   */
  function isSignerComplete(bundle, signerId) {
    const fields = getFieldsForSigner(bundle, signerId);
    return fields.length > 0 && fields
      .filter(f => f.required)
      .every(f => f.value !== null);
  }

  /**
   * Mark a signer as having signed
   * @param {Object} bundle 
   * @param {string} signerId 
   * @param {Object} signatureData 
   */
  function markSignerSigned(bundle, signerId, signatureData) {
    const signer = bundle.signers.find(s => s.id === signerId);
    if (signer) {
      signer.signed = true;
      signer.signedAt = new Date().toISOString();
      signer.publicKey = signatureData.publicKey;
      signer.signatureImage = signatureData.signatureImage;
      signer.cryptoSignature = signatureData.cryptoSignature;
    }

    // Update bundle status
    updateStatus(bundle);
  }

  /**
   * Update bundle status based on signatures
   * @param {Object} bundle 
   */
  function updateStatus(bundle) {
    if (bundle.signers.length === 0) {
      bundle.status = 'draft';
    } else if (bundle.signers.every(s => s.signed)) {
      bundle.status = 'completed';
    } else if (bundle.signers.some(s => s.signed)) {
      bundle.status = 'in_progress';
    } else {
      bundle.status = 'draft';
    }
  }

  /**
   * Get signers who haven't signed yet
   * @param {Object} bundle 
   * @returns {Array}
   */
  function getPendingSigners(bundle) {
    return bundle.signers.filter(s => !s.signed);
  }

  // Default field dimensions (in PDF points)
  function getDefaultWidth(type) {
    switch (type) {
      case 'signature': return 200;
      case 'initials': return 80;
      case 'date': return 120;
      case 'text': return 150;
      default: return 100;
    }
  }

  function getDefaultHeight(type) {
    switch (type) {
      case 'signature': return 60;
      case 'initials': return 40;
      case 'date': return 20;
      case 'text': return 20;
      default: return 30;
    }
  }

  function getDefaultFilename(bundle) {
    const baseName = bundle.document.name.replace(/\.pdf$/i, '');
    return baseName + EXTENSION;
  }

  // Utility functions
  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Detect file type (PDF or bundle)
   * @param {File} file 
   * @returns {string} 'pdf' | 'bundle' | 'unknown'
   */
  function detectFileType(file) {
    if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
      return 'pdf';
    }
    if (file.name.endsWith(EXTENSION) || file.type === 'application/json') {
      return 'bundle';
    }
    return 'unknown';
  }

  return {
    VERSION,
    EXTENSION,
    create,
    load,
    save,
    getPdfBytes,
    setCompletedPdf,
    addSigner,
    removeSigner,
    addField,
    removeField,
    updateField,
    getFieldsForSigner,
    getUnsignedFields,
    isComplete,
    isSignerComplete,
    markSignerSigned,
    updateStatus,
    getPendingSigners,
    detectFileType,
    arrayBufferToBase64,
    base64ToArrayBuffer
  };
})();
