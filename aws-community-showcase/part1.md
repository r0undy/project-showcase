Before the workshop begins, your Instructor Lead will send your AWS credentials to your email as a CSV file. The file will look something like this:

<img width="500" alt="Credentials CSV example" src="https://github.com/user-attachments/assets/dce2dbd7-b778-49c7-965a-b27614cc1de7" />

## Understanding Your Credentials

Your CSV contains three pieces of information:

| Field                  | What it's for                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **User name**          | Your unique IAM username (e.g., `david-batobato`). Your bucket names must start with this.  |
| **Password**           | A temporary password used for your first sign-in. You'll be asked to change it immediately. |
| **Console login link** | Direct URL to sign in. Bookmark this — it's faster than searching.                          |

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
