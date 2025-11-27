# AWS Credentials Setup - REQUIRED STEP

To deploy to AWS, you need to configure your credentials. Here's how:

## Step 1: Get Your AWS Credentials

1. Go to https://console.aws.amazon.com/iam/home#/users
2. Click on your username (or create a user if you don't have one)
3. Go to **Security credentials** tab
4. Click **Create access key**
5. Choose **Command Line Interface (CLI)**
6. Copy:
   - **Access Key ID** (starts with AKIA...)
   - **Secret Access Key** (looks like a long string)

⚠️ **SAVE THESE - You'll only see them once!**

## Step 2: Configure AWS CLI

Run this command in PowerShell:

```powershell
aws configure
```

It will ask:

1. **AWS Access Key ID**: Paste your Access Key ID
2. **AWS Secret Access Key**: Paste your Secret Access Key
3. **Default region name**: Type `ap-south-1`
4. **Default output format**: Type `json`

## Example:

```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: ap-south-1
Default output format [None]: json
```

## Step 3: Verify Setup

```powershell
aws sts get-caller-identity
```

Should show your account info. If it works, you're ready to deploy!

---

**Once configured, let me know and I'll deploy everything automatically!**
