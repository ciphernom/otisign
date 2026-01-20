# OtiSign

**Repo:** https://github.com/ciphernom/otisign

Browser-based PDF signing tool. It uses your email and password to generate keys and anchors the final document to the Bitcoin blockchain.

**Live Demo:** (Optional: Add your GitHub Pages link here)

## What it does

* **Signatures:** Deterministic Ed25519 keys (derived from Email + Password via PBKDF2).
* **Timestamping:** Anchors the document hash to Bitcoin using OpenTimestamps.
* **Privacy:** Runs 100% in the browser. No servers, no accounts, no data collection.

## Workflow

### 1. Prepare
* Open the tool and upload a PDF.
* Add signers (Email/Name) and drag signature fields onto pages.
* Download the **`.ots-sign`** file (JSON).
* Send this file to the signers.

### 2. Sign
* Open the **`.ots-sign`** file.
* Select your name and enter your email/password to sign your fields.
* Save the file.
    * *If you are the last signer:* The tool downloads a **`.ots-signed`** file (ZIP).
    * *If others must still sign:* It downloads an updated **`.ots-sign`** file to pass along.

### 3. Verify
* Upload the **`.ots-signed`** file.
* The tool checks:
    1.  Document integrity (SHA-256 hash).
    2.  All digital signatures.
    3.  The Bitcoin timestamp proof.

## Run Locally

This project is a static site with no build steps or external dependencies to install.

### 1. Clone
Clone this repository. All necessary crypto and PDF libraries are included in `lib/`.

```bash
git clone [https://github.com/ciphernom/otisign.git](https://github.com/ciphernom/otisign.git)
cd otisign

```

### 2. Serve

Start a local web server (required due to browser security policies for checking origins).

**Python:**

```bash
python3 -m http.server 8000

```

**Node:**

```bash
npx serve .

```

Open `http://localhost:8000` in your browser.

## Included Libraries

The `lib/` folder contains the following vendor dependencies (pre-packaged for offline/static usage):

* **pdf.js** (v3.11.174) - PDF rendering
* **pdf-lib.js** (v1.17.1) - PDF modification
* **tweetnacl.js** (v1.0.3) - Ed25519 cryptography
* **opentimestamps.js** - Bitcoin timestamping
* **jszip.js** (v3.10.1) - ZIP file generation

## License

GPLv3
