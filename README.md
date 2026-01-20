# ots-sign

Sign documents. Timestamp to Bitcoin. Trust no one.

## What is this?

An open-source document signing tool with:

- **Cryptographic signatures** — Ed25519 digital signatures derived from your email + password. No key files to manage.
- **Bitcoin timestamps** — OpenTimestamps anchors your signature to the Bitcoin blockchain. Trustless, permanent proof.
- **Fully client-side** — Everything runs in your browser. Documents never leave your machine.
- **No accounts** — No signup, no data collection, no servers storing your documents.

## How it works

### For document preparers:
1. Upload a PDF
2. Add signers (name + email)
3. Place signature/initials/date fields, assign to signers
4. Download `.ots-sign` bundle
5. Send to signers

### For signers:
1. Open the `.ots-sign` file
2. Enter your email + signing password
3. Sign your assigned fields
4. Download updated bundle (or final signed PDF if you're last)

### Verification:
Anyone can verify:
- Document integrity (hash check)
- Cryptographic signatures (Ed25519)
- Timestamp (Bitcoin blockchain via OpenTimestamps)

## Setup

### 1. Download vendor libraries

Create a `lib/` folder and download these files:

**pdf.js** (Mozilla PDF renderer):
```bash
curl -o lib/pdf.min.js "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
curl -o lib/pdf.worker.min.js "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
```

**pdf-lib** (PDF manipulation):
```bash
curl -o lib/pdf-lib.min.js "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"
```

**TweetNaCl** (Ed25519 cryptography):
```bash
curl -o lib/tweetnacl.min.js "https://unpkg.com/tweetnacl@1.0.3/nacl-fast.min.js"
```

**OpenTimestamps** (Bitcoin timestamps):
```bash
curl -o lib/opentimestamps.min.js "https://opentimestamps.org/assets/javascripts/vendor/opentimestamps.min.js"
```

### 2. Serve locally

```bash
python -m http.server 8000
# or
npx serve .
```

Open `http://localhost:8000`

### 3. Deploy to GitHub Pages

1. Push to GitHub
2. Go to Settings → Pages
3. Select "Deploy from a branch" → main → / (root)
4. Your site is live at `https://username.github.io/ots-sign`

## Project Structure

```
ots-sign/
├── index.html          # Landing page
├── prepare.html        # Document preparation
├── sign.html           # Signing interface
├── verify.html         # Verification page
├── css/
│   └── style.css
├── js/
│   ├── bundle.js       # .ots-sign file format
│   ├── crypto.js       # Ed25519 key derivation & signing
│   ├── fields.js       # Field placement/rendering
│   ├── pdf-viewer.js   # PDF.js wrapper
│   ├── signature-pad.js# Signature capture
│   ├── state.js        # State management
│   └── utils.js        # Helpers
├── lib/
│   ├── pdf.min.js
│   ├── pdf.worker.min.js
│   ├── pdf-lib.min.js
│   ├── tweetnacl.min.js
│   └── opentimestamps.min.js
└── README.md
```

## Security Model

- **Identity**: Email + password deterministically derive an Ed25519 keypair. Same inputs = same keys, always.
- **No key files**: Nothing to lose or backup (except your password).
- **Tamper-evident**: Any modification to the document invalidates all signatures.
- **Trustless timestamps**: Anchored to Bitcoin, verifiable without trusting any server.

## File Format

The `.ots-sign` bundle is a JSON file containing:

```json
{
  "version": "1.0",
  "document": {
    "name": "contract.pdf",
    "data": "<base64 PDF>"
  },
  "signers": [
    {
      "id": "s1",
      "name": "Alice",
      "email": "alice@example.com",
      "publicKey": "ed25519:...",
      "signed": true
    }
  ],
  "fields": [
    {
      "type": "signature",
      "signerId": "s1",
      "page": 0,
      "x": 100,
      "y": 150,
      "value": "<signature image>"
    }
  ],
  "status": "completed"
}
```

## Verification Without This Tool

```bash
# Install OpenTimestamps CLI
pip install opentimestamps-client

# Verify timestamp
ots verify document-signed.pdf.ots
```

## Privacy

- Documents never leave your browser
- No analytics, no tracking
- No server-side storage
- Fully auditable open source code

## License

GPLv3
```

