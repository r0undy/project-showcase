Amazon S3 (Simple Storage Service) is a cloud storage service that can also serve static websites. We'll create a "bucket" (think: a folder), upload your files, and turn on website hosting.

## Step 2.1 — Open the S3 Console

1. In the AWS Console search bar at the top, type `S3` and click **S3**.
2. You should see the Amazon S3 dashboard with your bucket list (probably empty).

<img width="500" alt="Amazon S3 dashboard" src="https://github.com/user-attachments/assets/445e5b0d-ea92-4676-ae2b-92370e1d846d" />

## Step 2.2 — Create Your Bucket

Click the orange **Create bucket** button at the top right.

<img width="500" alt="Create bucket button" src="https://github.com/user-attachments/assets/2a63c97a-5071-4202-b689-f8d713581fcd" />

> ⚠️ **CRITICAL — Bucket naming:** Your bucket name MUST start with your username and contain only lowercase letters, numbers, and hyphens.
>
> **Examples (if your username is `david-batobato`):**
>
> - `david-batobato-portfolio` ✅
> - `david-batobato-myapp` ✅
>
> **These will NOT work:** - because in this workshop for better visibility we enforce this rule, in a typical S3 this is allowed depending on the policy
>
> - `portfolio` — doesn't start with your username ❌
> - `David-Batobato-Portfolio` — uppercase letters ❌
> - `someoneelse-portfolio` — different username ❌

### General configuration

1. **AWS Region:** Asia Pacific (Sydney) ap-southeast-2 (should already be selected)
2. **Bucket namespace:**: Global namespace ✅ (default)
3. **Bucket name:** Type your unique name, e.g., `david-batobato-portfolio`
4. **Object Ownership:** Leave default (ACLs disabled — recommended)

### ⚠️ Block Public Access settings (CRITICAL)

Scroll down to "Block Public Access settings for this bucket":

1. **UNCHECK** "Block all public access"
2. All four sub-checkboxes will uncheck automatically
3. **CHECK** the acknowledgment box at the bottom: _"I acknowledge that the current settings might result in this bucket and the objects within becoming public"_

<img width="500" alt="Block Public Access settings" src="https://github.com/user-attachments/assets/ceba5b26-9ed5-4f79-9b6f-102266f4455a" />

**Why?** A static website needs to be publicly readable so visitors and we can see it. We're intentionally allowing public read access for HTML/CSS/JS files.

### Other settings — leave as default

- Bucket Versioning: Disable
- Tags: Skip
- Default encryption: SSE-S3
- Bucket Key: Enable

Scroll all the way to the bottom and click **Create bucket**.

> ✅ **EXPECTED RESULT:** Green banner: "Successfully created bucket [your-bucket-name]". Your bucket appears in the list.

<img width="500" alt="Bucket created successfully" src="https://github.com/user-attachments/assets/632cb2bc-8246-44e3-baef-c62c4ac6395e" />

## Step 2.3 — Upload Your Files

Now we'll upload the contents of your portfolio folder to the bucket. Depending on your project, this folder might be called:

- `dist/` — Vite, Vue, Astro, etc.
- `build/` — Create React App, some Next.js setups
- `out/` — Next.js export
- `public/` — some static site setups
- Or just your project root if you wrote plain HTML/CSS/JS

Whatever it's called, this is the folder that contains your `index.html` at its root. We'll call it your **website folder** in the steps below.

1. Click your bucket name to open it.
2. Click the orange **Upload** button.

<img width="500" alt="Upload button" src="https://github.com/user-attachments/assets/fd6fe9d6-4cee-4b98-bbfc-6e2362aa48e0" />

### Upload the CONTENTS, not the folder itself

> ⚠️ **IMPORTANT:** S3 looks for `index.html` at the bucket root. If you upload the website FOLDER, your files end up at `/your-folder/index.html` instead of `/index.html`, and your site won't work.

> Always navigate INTO your website folder and select its contents.

### How to drag-and-drop

1. Open File Explorer and navigate to your project folder.
2. Open your website folder (e.g., `dist/`, `build/`, `out/`) so you see `index.html`, your CSS/JS files, etc.
3. Press **Ctrl + A** to select all items inside that folder.
4. Drag the selected items onto the dotted upload area in your browser.

<img width="500" alt="Drag and drop files" src="https://github.com/user-attachments/assets/0cf2195a-a923-41e1-909e-52003c1a3ff6" />

### Verify before uploading

In the "Files and folders" table, the Folder column for `index.html` should be empty (meaning it goes to the bucket root). Other files like CSS, JS, and images may sit at the root or inside subfolders (such as `assets/`, `css/`, `js/`, or `images/`) — that's fine, as long as `index.html` itself is at the root.

<img width="500" alt="Files and folders table" src="https://github.com/user-attachments/assets/a0597ac7-fc69-4063-b7e4-8062c02b16ae" />

1. Scroll down past Storage class, Encryption, etc. (leave all defaults).
2. Click **Upload** at the very bottom.

> ✅ **EXPECTED RESULT:** Green banner: "Upload succeeded". All files show "Succeeded" status.

## Step 2.4 — Enable Static Website Hosting

Now we tell S3 that this bucket should serve a website (not just store files).

1. Click the **Properties** tab at the top of your bucket page.
2. Scroll all the way to the LAST section: "Static website hosting".
3. Click **Edit**.

<img width="500" alt="Static website hosting section" src="https://github.com/user-attachments/assets/21d94806-791b-49f1-a0c6-2fa1daf1ad4d" />

### Configure these settings

- **Static website hosting:** Enable
- **Hosting type:** Host a static website
- **Index document:** `index.html`
- **Error document:** `index.html` (also helps if your site uses client-side routing)

Click **Save changes**.

> ✅ **EXPECTED RESULT:** After saving, the section displays your Bucket website endpoint URL — something like:
>
> ```
> http://<your-bucket-name>.s3-website-ap-southeast-2.amazonaws.com
> ```

Copy this URL — you'll need it!

<img width="500" alt="Bucket website endpoint URL" src="https://github.com/user-attachments/assets/2a8a9032-36e3-4549-8bce-dfbf8dea984e" />

## Step 2.5 — Add a Public-Read Bucket Policy

If you visit your URL right now, you'll get a 403 Forbidden error. Your files are uploaded but the bucket needs explicit permission to let visitors read them.

1. Click the **Permissions** tab at the top of your bucket page.
2. Scroll to the **Bucket policy** section (currently empty).
3. Click **Edit**.

<img width="500" alt="Bucket policy section" src="https://github.com/user-attachments/assets/30189485-a156-4915-b533-756c33450840" />

### Paste this policy

> ⚠️ **IMPORTANT:** REPLACE `<YOUR-BUCKET-NAME>` with your actual bucket name (e.g., `david-batobato-portfolio`) in the policy below.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<YOUR-BUCKET-NAME>/*"
    }
  ]
}
```

<img width="500" alt="Bucket policy editor" src="https://github.com/user-attachments/assets/ad5882f4-f004-4410-96bd-a6d4938a2f37" />

Click **Save changes**.

> ✅ **EXPECTED RESULT:** Green banner: "Successfully edited bucket policy". The bucket will show a "Publicly accessible" badge — that's correct for a website.

## Step 2.6 — Visit Your Live Site! 🎉

Open a new browser tab and paste your bucket website endpoint URL:

```
http://<your-bucket-name>.s3-website-ap-southeast-2.amazonaws.com
```

> ✅ **EXPECTED RESULT:** Your portfolio should render!

<img width="500" alt="Live portfolio site" src="https://github.com/user-attachments/assets/a02d203f-4c1a-4755-b1d8-527a313549bc" />

> 💡 **TIP:** Notice the URL says "Not secure" (no padlock). That's because S3 website hosting only supports HTTP. We'll fix that next with CloudFront!
>
> But first — congrats! Your website is genuinely deployed on AWS. Take a screenshot to celebrate. 📸

## Troubleshooting Part 2

### ❌ 403 Forbidden

- Did you uncheck "Block all public access" when creating the bucket? (Step 2.2)
- Did you save the Bucket policy in Step 2.5?
- Did you replace `YOUR-BUCKET-NAME` in the policy with your actual bucket name?

### ❌ 404 Not Found

- Did you upload the contents of your website folder, not the folder itself? (Step 2.3)
- Verify `index.html` is at the bucket root (not inside a subfolder)
- Index document set to `index.html`? (Step 2.4)

### ❌ Page loads but is blank

- Open browser DevTools (F12) → Console tab — look for error messages
- Likely cause: your build tool has a `base` URL or `publicPath` set to something other than `/` (this is common in React/Vue/Astro/Vite/Webpack configs). Set it to `/` or remove that property, rebuild, and re-upload.
- Another cause: you uploaded the project folder instead of the contents of your build output folder. Re-check Step 2.3.

### ❌ AccessDenied when creating bucket

- Bucket name MUST start with your username (e.g., `david-batobato-`).
- If you typed the right prefix and still see this error, ask a roving dev.
