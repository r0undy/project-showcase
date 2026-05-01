# AWS Workshop — Deploy Your Portfolio Website

<p align="center">
  <img width="500" alt="AWS Workshop Cover" src="https://github.com/user-attachments/assets/f515c62c-dce3-49a1-ac3b-e734a0adb4af" />
</p>

---

## What You'll Learn

- How to set up Amazon S3 for static website hosting
- How to upload and deploy your portfolio's built files
- How to make your site publicly accessible
- How to put CloudFront in front of S3 for HTTPS and global performance
- Real-world AWS skills you can put on your resume

## What You'll Need

- Your AWS credentials (sent via email as a CSV file)
- A built portfolio website ready to upload (a folder of static files like `index.html`, CSS, JS, images)
- A modern web browser (Chrome, Edge, or Firefox)

## Workshop Outline

- **Part 1 — Setup:** Receive credentials and sign in to AWS
- **Part 2 — Deploy with S3:** Get your portfolio live (HTTP)
- **Part 3 — Secure with CloudFront:** Add HTTPS via AWS's CDN
- **Part 4 — Celebrate:** Share your live URL! 🎉

> 💡 **TIP:** Make sure your portfolio's built files are ready before we start. If your project uses a build step (like `npm run build` for React/Vue/Astro/Vite/etc.), do that now so your output folder (`dist/`, `build/`, `out/`, or similar) is ready to upload. If you're using plain HTML/CSS/JS, your files are already good to go. Please ask one of our roving developers if you haven't done this step yet :).

> ⚠️ **IMPORTANT:** Your AWS credentials are like passwords. Never share them, post them publicly, or commit them to GitHub. They will be revoked after a while.

---

# Part 1 — Receiving Your Credentials

Before the workshop begins, your Instructor Lead will send your AWS credentials to your email as a CSV file. The file will look something like this:

<img width="500" alt="Credentials CSV example" src="https://github.com/user-attachments/assets/dce2dbd7-b778-49c7-965a-b27614cc1de7" />

## Understanding Your Credentials

Your CSV contains three pieces of information:

| Field | What it's for |
|-------|---------------|
| **User name** | Your unique IAM username (e.g., `david-batobato`). Your bucket names must start with this. |
| **Password** | A temporary password used for your first sign-in. You'll be asked to change it immediately. |
| **Console login link** | Direct URL to sign in. Bookmark this — it's faster than searching. |

## Step 1.1 — Sign In to AWS

1. Open the **[Console login link](https://484907520476.signin.aws.amazon.com/console)** from your CSV in your web browser.
2. Enter your **User name** (e.g., `david-batobato`) and **Password** exactly as in the CSV.
3. Click **Sign in**.

<img width="500" alt="AWS IAM sign-in page" src="https://github.com/user-attachments/assets/2cb3e591-4bbe-426b-a039-c136aec9a8c4" />

## Step 1.2 — Create Your New Password 🔑

The first time you sign in, AWS will ask you to set a new password. This is a security feature — the password in your CSV is temporary and only works once.

1. You'll see a **"You must change your password"** screen.
2. Enter the **temporary password** from your CSV in the "Old password" field.
3. Choose a **new password** that meets AWS's requirements:
   - At least 8 characters long
   - Includes uppercase and lowercase letters
   - Includes at least one number
   - Includes at least one symbol (e.g., `!`, `@`, `#`, `$`)
4. Type your new password again in "Confirm new password".
5. Click **Confirm password change**.

<img width="500" alt="AWS password change screen" src="https://github.com/user-attachments/assets/35782fc0-b5f2-4a5e-9c9a-a9682ab8fe60" />

> 💡 **TIP:** Write your new password down somewhere safe (a password manager is best). You'll need it if you sign out and need to sign back in during the workshop. Your Instructor Lead cannot recover this password for you — only reset it.

## Step 1.3 — Verify You're Signed In

After changing your password, you'll be redirected to the AWS Console. Look at the top-right corner — you should see your username displayed.

<img width="500" alt="AWS Console signed in" src="https://github.com/user-attachments/assets/d6d51bda-dd8f-4322-b9cf-9167c86af3c8" />

## Step 1.4 — Set the Region to Sydney

AWS has many regions worldwide. For this workshop, we use **Asia Pacific (Sydney)** for fast performance from the Philippines.

1. Click the region dropdown in the top-right (next to your username).
2. Select **Asia Pacific (Sydney) ap-southeast-2**.

<img width="500" alt="Region dropdown with Sydney selected" src="https://github.com/user-attachments/assets/f17853d5-c618-470e-a2e5-b82491efd805" />

> ⚠️ **IMPORTANT:** If your region is not Sydney, your buckets and resources will be created in the wrong place. Always check the region first!

---

# Part 2 — Deploy with Amazon S3

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
> - `david-batobato-portfolio` ✅
> - `david-batobato-myapp` ✅
>
> **These will NOT work:** - because in this workshop for better visibility we enforce this rule, in a typical S3 this is allowed depending on the policy
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
3. **CHECK** the acknowledgment box at the bottom: *"I acknowledge that the current settings might result in this bucket and the objects within becoming public"*

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

---

# Part 3 — Make It Secure with CloudFront 🔒

Your portfolio is live, but the URL says "Not secure" because S3 website hosting doesn't support HTTPS. CloudFront is AWS's Content Delivery Network (CDN) that wraps your S3 site to give you:

- ✅ HTTPS with a free SSL certificate
- ✅ Faster loading worldwide (cached at 750+ edge locations)
- ✅ A more professional URL ending in `.cloudfront.net`

> ⚠️ **IMPORTANT:** CloudFront has paid plans that cost $15-1000/month. We will use the FREE **Pay-as-you-go** option, which gives you 1 TB of free traffic per month — far more than your portfolio will ever use.
>
> **On the Choose a Plan screen, you MUST scroll to the bottom and select "Pay as you go".**

## Step 3.1 — Open the CloudFront Console

1. In the AWS Console search bar, type `CloudFront` and click **CloudFront**.

<img width="500" alt="CloudFront search" src="https://github.com/user-attachments/assets/b4986f0d-a668-4119-899f-e18fa253e408" />

2. Click the orange **Create distribution** button.

<img width="500" alt="Create distribution button" src="https://github.com/user-attachments/assets/7da82ac4-539a-44c7-b2f2-250f438f419b" />


## Step 3.2 — Choose Pay-as-you-go (CRITICAL!)

You'll see a "Choose a plan" screen with several options: Free, Pro ($15/month), Business ($200/month), and Premium ($1,000/month).

> ⛔ **DO NOT DO THIS:**
> - DO NOT click any of the cards: **Free, Pro, Business, or Premium**.
> - These plans cost money or have limits that will block you.
> - **If you accidentally click one and try to create:** Click Cancel and start over.

### ✅ What to do instead

1. Scroll all the way DOWN past the colorful plan cards.
2. At the bottom you'll see a smaller option called **"Pay as you go"** — select that radio button.
3. Click **Next**.

<img width="500" alt="Pay as you go option" src="https://github.com/user-attachments/assets/61bbae35-6f09-4c9b-8ae7-94bad464567e" />


> ⚠️ **IMPORTANT:** If you don't see "Pay as you go" at the bottom, scroll further. It's below all the plan cards. The "Pro" plan is highlighted by AWS as a default — don't accept that default.

## Step 3.3 — Get Started

### Distribution name

Enter a memorable name. We recommend matching your bucket name:

```
your-username-portfolio
```

### Description (optional)

You can add something like:

```
My portfolio - HTTPS via CloudFront
```

### Distribution type

- **Single website or app:** ✅ leave selected (default)
- **Multi-tenant architecture:** ❌ do NOT select

### Domain (Route 53)

LEAVE BLANK. You don't have a custom domain. CloudFront will provide a free one.

> ⚠️ **IMPORTANT:** You may see a red error like `Access denied to route53:ListHostedZonesByName`. This is EXPECTED — it just means you don't have any domains. Ignore it and continue.

When done, click **Next**.

<img width="500" alt="Get started page" src="https://github.com/user-attachments/assets/0f988c22-f48b-4544-acd5-0d3fdff00d9b" />

## Step 3.4 — Specify Origin

This tells CloudFront which S3 bucket to serve content from.

### Origin type

✅ **Amazon S3** (default selection)

### S3 origin field — most important step!

1. Click **Browse S3** and select your bucket from the list.
2. AWS will populate the field with the REST endpoint:
   ```
   your-bucket.s3.ap-southeast-2.amazonaws.com
   ```
3. A **YELLOW WARNING BOX** will appear that says:

   > 💡 *"This S3 bucket has static web hosting enabled. If you plan to use this distribution as a website, we recommend using the S3 website endpoint rather than the bucket endpoint."*

4. Click the **"Use website endpoint"** button in that warning. The field will update to:
   ```
   your-bucket.s3-website-ap-southeast-2.amazonaws.com
   ```

> ⚠️ **IMPORTANT:** This step is critical. The "website endpoint" (with `-website-`) is different from the regular S3 endpoint. Using the wrong one will break your site.


### Origin path

LEAVE EMPTY. Do not put `/index.html` or anything else here.

### Settings section

- **UNCHECK** "Allow private S3 bucket access to CloudFront"
- **Origin settings:** Use recommended origin settings ✅
- **Cache settings:** Use recommended cache settings tailored to serving S3 content ✅

> ⚠️ **IMPORTANT:** Why uncheck "Allow private S3 bucket access"? Because we already made our bucket public in Part 2. If you check it, AWS will try to lock down the bucket — which conflicts with what we already did and breaks the site. Just uncheck it and keep things simple.

<img width="500" alt="Origin settings" src="https://github.com/user-attachments/assets/8120048e-d345-4a08-90ee-2fea5afc813b" />

When done, click **Next**.

## Step 3.5 — Enable Security (Say NO to WAF)


This page asks if you want to enable AWS WAF (Web Application Firewall).

> ⛔ **DO NOT DO THIS:**
> - WAF costs money — about **$14/month** for 10 million requests.
> - We do NOT need WAF for a portfolio site. It's overkill for static content.
> - **DO NOT click "Enable security protections".**

### ✅ What to do

1. Click the right option: **"Do not enable security protections"**
2. The price estimate at the bottom should disappear.
3. Click **Next**.

<img width="500" alt="Security protections option" src="https://github.com/user-attachments/assets/ce9b75cd-f1c6-48df-9a6f-a0d935f8792c" />

## Step 3.6 — Review and Create

This is the final step. Verify EVERYTHING before clicking Create.

### ✅ Required values

- **Distribution name:** your chosen name
- **Billing:** Pay-as-you-go ($0/month) ← MUST say $0!
- **S3 origin:** MUST contain `-website-` (e.g., `your-bucket.s3-website-ap-southeast-2.amazonaws.com`)
- **Origin path:** (empty)
- **Security protections:** None
- **Use existing WAF configuration:** No

> ⛔ **DO NOT DO THIS:**
> - If the Billing line shows "$15/month", "$2 today's pro-rated charge", or any plan name (Pro, Business, etc.) — **STOP!** Click Previous and select Pay-as-you-go instead.
> - Do NOT click Create distribution if you see any charges.

<img width="500" alt="Review and create page" src="https://github.com/user-attachments/assets/2ca2d1f0-25c6-41b6-93b3-cb44a3cbc0df" />

Once verified, click the orange **Create distribution** button.

> ✅ **EXPECTED RESULT:** Green banner: "Successfully created new distribution". You'll see your distribution domain name (e.g., `dXXXXX.cloudfront.net`). Status: Deploying.

<img width="500" alt="Distribution created" src="https://github.com/user-attachments/assets/7e41687e-8c8a-43ef-a506-a86d22f95c26" />


## Step 3.7 — Set the Default Root Object

Right after creation, we need to tell CloudFront what to serve when someone visits the bare URL (e.g., `dXXXXX.cloudfront.net`).

<img width="500" alt="Distribution detail page" src="https://github.com/user-attachments/assets/15c80dbf-8b81-45f6-b257-cd9e9d8fe42a" />


1. On your distribution detail page, scroll to the **Settings** section.
2. Notice that **Default root object** is empty (shows a dash).
3. Click the **Edit** button on the Settings card.
4. Find the Default root object field and type: `index.html`

   <img width="500" alt="Default root object field" src="https://github.com/user-attachments/assets/86ef7718-bfe5-4c2a-a376-a85ec5553872" />

5. Scroll down and click **Save changes**.


## Step 3.8 — Wait for Deployment ⏳

CloudFront is now pushing your distribution config to 750+ edge locations worldwide. This takes 5-15 minutes.

<img width="500" alt="Deployment in progress" src="https://github.com/user-attachments/assets/8f5f2702-61df-40ef-b0a0-6539eedfed59" />

- **Status: Deploying** → Still working
- **Status: Last modified [date]** with green check → Done!

> 💡 **TIP:** While you wait, you can:
> - ask questions, network
> - Help a dev with their setup
> - Find your love one 😉

## Step 3.9 — Visit Your HTTPS Site! 🎉🔒

Once status changes to "Deployed", visit:

```
https://<YOUR-DISTRIBUTION-ID>.cloudfront.net
```

<img width="500" alt="HTTPS site live" src="https://github.com/user-attachments/assets/322bd03e-a814-41f2-bde7-22e8fdaa2565" />


Notice it says **HTTPS** — and your browser shows a green padlock!

> ✅ **EXPECTED RESULT:** Your portfolio renders with HTTPS. You now have a production-grade deployment with global CDN caching and SSL encryption. This is the same architecture used by major websites worldwide. 🌍

<img width="500" alt="Final HTTPS portfolio" src="https://github.com/user-attachments/assets/546b1d58-19e1-4c2b-9b46-dcc33e177686" />

sheesh!

## Troubleshooting Part 3

### ❌ DNS_PROBE_FINISHED_NXDOMAIN

DNS hasn't fully propagated yet. Wait 5-15 minutes and try again. This is normal right after creation.

### ❌ 403 Forbidden on CloudFront URL

- Did you set Default root object to `index.html` in Step 3.7?
- Is your underlying S3 site working? Test the S3 URL first — if it doesn't work, fix that before troubleshooting CloudFront.

### ❌ "Access denied to route53:ListHostedZonesByName" on Get started page

This is EXPECTED. You don't have a Route 53 domain. Just leave the domain field empty and continue.

### ❌ "Access denied to wafv2:CreateWebACL" on Create distribution

You accidentally selected a plan with WAF. Click Cancel, start over, and on Step 3.2 choose Pay-as-you-go (NOT Free, Pro, Business, or Premium). On Step 3.5, choose "Do not enable security protections".

### ❌ Billing shows $15/month or pro-rated charge

Click Cancel immediately. You're on a paid plan. Start over and select Pay-as-you-go on Step 3.2.

---

# Part 4 — Celebrate! 🎉

Congratulations! You've successfully deployed a portfolio website to AWS using:

- ✅ Amazon S3 for static file hosting
- ✅ S3 static website hosting feature
- ✅ S3 bucket policies for public read access
- ✅ CloudFront for HTTPS and global CDN
- ✅ Real-world AWS architecture used by professional sites

## Share Your Work

Take a screenshot of your live HTTPS portfolio and share it in our workshop chat! Bonus points for showing the green padlock.

## Add to Your Resume

Now you can confidently say:

> 📝 **RESUME-WORTHY:** *"Deployed a production website to AWS using S3 for static hosting and CloudFront for HTTPS content delivery."*

## What Happens Next

> ⚠️ **IMPORTANT:** Your AWS workshop credentials will be revoked after a week of the workshop ending. Your S3 buckets and CloudFront distribution will also be cleaned up.
>
> If you want to keep deploying to AWS:
> 1. Create your own free AWS account at aws.amazon.com (you'll get $100 in credits, 🤯)
> 2. Recreate the same setup using your own account
> 3. Or use Vercel, Netlify, or Cloudflare Pages for simpler hosting, but of course to stand out we need to learn these kind on infra level setup 🫡

## Questions?

Reach out to your Instructor Lead or one of the roving devs. We're here to help!

---

**Happy deploying! 🚀**
