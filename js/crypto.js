/**
 * crypto.js - Key derivation and digital signatures
 * 
 * Uses PBKDF2 for key stretching and TweetNaCl for Ed25519 signatures.
 * 
 * The core idea: email + password deterministically derives a keypair.
 * Same inputs = same keypair, always. No key files to manage.
 */

const Crypto = (function() {
  'use strict';

  const PBKDF2_ITERATIONS = 100000;
  const SALT_PREFIX = 'ots-sign-v1:';

  /**
   * Derive an Ed25519 keypair from email + password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{publicKey: Uint8Array, secretKey: Uint8Array}>}
   */
  async function deriveKeypair(email, password) {
    const normalizedEmail = email.toLowerCase().trim();
    const salt = new TextEncoder().encode(SALT_PREFIX + normalizedEmail);
    const passwordBytes = new TextEncoder().encode(password);

    // Import password as key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    // Derive 256 bits (32 bytes) for Ed25519 seed
    const seedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const seed = new Uint8Array(seedBits);

    // Generate Ed25519 keypair from seed using TweetNaCl
    const keypair = nacl.sign.keyPair.fromSeed(seed);

    return {
      publicKey: keypair.publicKey,
      secretKey: keypair.secretKey
    };
  }

  /**
   * Sign a message with a secret key
   * @param {Uint8Array} message 
   * @param {Uint8Array} secretKey 
   * @returns {Uint8Array} signature (64 bytes)
   */
  function sign(message, secretKey) {
    const signedMessage = nacl.sign(message, secretKey);
    // Extract just the signature (first 64 bytes)
    return signedMessage.slice(0, nacl.sign.signatureLength);
  }

  /**
   * Verify a signature
   * @param {Uint8Array} message 
   * @param {Uint8Array} signature 
   * @param {Uint8Array} publicKey 
   * @returns {boolean}
   */
  function verify(message, signature, publicKey) {
    // Reconstruct signed message format for verification
    const signedMessage = new Uint8Array(signature.length + message.length);
    signedMessage.set(signature);
    signedMessage.set(message, signature.length);

    const result = nacl.sign.open(signedMessage, publicKey);
    return result !== null;
  }

  /**
   * Hash data using SHA-256
   * @param {Uint8Array} data 
   * @returns {Promise<Uint8Array>}
   */
  async function sha256(data) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  /**
   * Convert bytes to hex string
   * @param {Uint8Array} bytes 
   * @returns {string}
   */
  function bytesToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to bytes
   * @param {string} hex 
   * @returns {Uint8Array}
   */
  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  /**
   * Format public key for display
   * @param {Uint8Array} publicKey 
   * @returns {string}
   */
  function formatPublicKey(publicKey) {
    return 'ed25519:' + bytesToHex(publicKey);
  }

  /**
   * Parse formatted public key
   * @param {string} formatted 
   * @returns {Uint8Array}
   */
  function parsePublicKey(formatted) {
    if (!formatted.startsWith('ed25519:')) {
      throw new Error('Invalid public key format');
    }
    return hexToBytes(formatted.slice(8));
  }

  /**
   * Create the message that gets signed
   * This binds the signature to the document and metadata
   * @param {Uint8Array} documentHash 
   * @param {string} email 
   * @param {string} timestamp 
   * @returns {Uint8Array}
   */
  async function createSigningMessage(documentHash, email, timestamp) {
    const message = JSON.stringify({
      documentHash: bytesToHex(documentHash),
      email: email.toLowerCase().trim(),
      timestamp: timestamp,
      version: 'ots-sign-v1'
    });
    return new TextEncoder().encode(message);
  }

  // Password strength checker
  function checkPasswordStrength(password) {
    const result = {
      score: 0,
      feedback: []
    };

    if (password.length < 8) {
      result.feedback.push('at least 8 characters');
    } else {
      result.score++;
    }

    if (password.length >= 12) {
      result.score++;
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      result.score++;
    } else {
      result.feedback.push('mix of upper and lowercase');
    }

    if (/\d/.test(password)) {
      result.score++;
    } else {
      result.feedback.push('at least one number');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      result.score++;
    }

    return {
      score: result.score,
      maxScore: 5,
      isStrong: result.score >= 3,
      feedback: result.feedback
    };
  }

  // Local storage for credentials (optional save)
  const STORAGE_KEY = 'ots-sign-credentials';

  function saveCredentials(email, password) {
    // Simple obfuscation - not true encryption, but prevents casual reading
    // The real security is that the private key is never stored
    const data = btoa(JSON.stringify({ email, password }));
    localStorage.setItem(STORAGE_KEY, data);
  }

  function loadCredentials() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(atob(data));
    } catch {
      return null;
    }
  }

  function clearCredentials() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function hasStoredCredentials() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  return {
    deriveKeypair,
    sign,
    verify,
    sha256,
    bytesToHex,
    hexToBytes,
    formatPublicKey,
    parsePublicKey,
    createSigningMessage,
    checkPasswordStrength,
    saveCredentials,
    loadCredentials,
    clearCredentials,
    hasStoredCredentials
  };
})();
