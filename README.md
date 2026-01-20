# ots-sign

Browser-based PDF signing tool. It uses your email and password to generate keys and anchors the final document to the Bitcoin blockchain.

**Repo:** [https://github.com/ciphernom/otisign](https://github.com/ciphernom/otisign)

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
1. Document integrity (SHA-256 hash).
2. All digital signatures.
3. The Bitcoin timestamp proof.



## Installation

This tool requires no build step, but you must download the vendor libraries.

### 1. Get the code

Clone this repository.

### 2. Download dependencies

Create a `lib/` folder and download these 5 files into it:

* **pdf.js** & **pdf.worker.js** (v3.11.174)
* `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js`
* `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`


* **pdf-lib.js** (v1.17.1)
* `https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js`


* **tweetnacl.js** (v1.0.3)
* `https://unpkg.com/tweetnacl@1.0.3/nacl-fast.min.js`


* **opentimestamps.js**
* `https://opentimestamps.org/assets/javascripts/vendor/opentimestamps.min.js`


* **jszip.js** (Required for final output generation)
* `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`



### 3. Run

Start a local web server (required for browser security policies).

```bash
# Python
python3 -m http.server 8000

# OR Node
npx serve .

```

Go to `http://localhost:8000`.

## License

GPLv3
