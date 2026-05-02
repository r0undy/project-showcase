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
>
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

   > 💡 _"This S3 bucket has static web hosting enabled. If you plan to use this distribution as a website, we recommend using the S3 website endpoint rather than the bucket endpoint."_

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
>
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
>
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
>
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
