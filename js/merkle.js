const Merkle = (function() {
  'use strict';

  async function hash(data) {
    const bytes = typeof data === 'string' 
      ? new TextEncoder().encode(data)
      : data;
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    return new Uint8Array(hashBuffer);
  }

  async function hashNodes(left, right) {
    const combined = new Uint8Array(left.length + right.length);
    if (Crypto.bytesToHex(left) < Crypto.bytesToHex(right)) {
      combined.set(left, 0);
      combined.set(right, left.length);
    } else {
      combined.set(right, 0);
      combined.set(left, right.length);
    }
    return hash(combined);
  }

  async function buildTree(leaves) {
    if (leaves.length === 0) return { root: null, layers: [] };
    
    const layers = [leaves];
    let current = leaves;

    while (current.length > 1) {
      const next = [];
      for (let i = 0; i < current.length; i += 2) {
        if (i + 1 < current.length) {
          next.push(await hashNodes(current[i], current[i + 1]));
        } else {
          next.push(current[i]);
        }
      }
      layers.push(next);
      current = next;
    }

    return { root: current[0], layers };
  }

  function getProof(layers, index) {
    const proof = [];
    let idx = index;

    for (let i = 0; i < layers.length - 1; i++) {
      const layer = layers[i];
      const isRight = idx % 2 === 1;
      const siblingIdx = isRight ? idx - 1 : idx + 1;

      if (siblingIdx < layer.length) {
        proof.push({
          hash: Crypto.bytesToHex(layer[siblingIdx]),
          position: isRight ? 'left' : 'right'
        });
      }

      idx = Math.floor(idx / 2);
    }

    return proof;
  }

  async function verifyProof(leafHash, proof, root) {
    let current = typeof leafHash === 'string' 
      ? Crypto.hexToBytes(leafHash) 
      : leafHash;

    for (const step of proof) {
      const sibling = Crypto.hexToBytes(step.hash);
      if (step.position === 'left') {
        current = await hashNodes(sibling, current);
      } else {
        current = await hashNodes(current, sibling);
      }
    }

    const rootBytes = typeof root === 'string' ? Crypto.hexToBytes(root) : root;
    return Crypto.bytesToHex(current) === Crypto.bytesToHex(rootBytes);
  }

  async function hashDocument(pdfBytes) {
    return hash(pdfBytes);
  }

  async function hashSigner(signer) {
    const data = JSON.stringify({
      email: signer.email,
      publicKey: signer.publicKey,
      signature: signer.cryptoSignature,
      signedAt: signer.signedAt
    });
    return hash(data);
  }

  return {
    hash,
    hashNodes,
    buildTree,
    getProof,
    verifyProof,
    hashDocument,
    hashSigner
  };
})();
