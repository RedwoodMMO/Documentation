---
sidebar_position: 2
sidebar_label: ZeptoMail
---

# ZeptoMail Email Provider

## Configuration

|Variable|Default Value|Description|
|-|-|-|
|`email.zeptomail.api.url`|`api.zeptomail.com/`|Url endpoint of the ZeptoMail service; you shouldn't need to change this.|
|`email.zeptomail.api.key`|``|Your ZeptoMail API key.|

## Creating a Template

You'll need to create an [Email Template](https://www.zoho.com/zeptomail/help/using-templates.html) for the email verification and specify the Template ID (reference the guide linked here on how to retrieve it) in the common `email.templates.verify-email` config. When creating the Email Template for email verification, you'll need to provide a URL for the player to click to verify the email. The URL value should just be: `{{verify_email_url}}`; this will be auto-populated by Redwood.

You'll also need to change `email.email-addresses.no-reply` to be an email under an [associated domain](https://www.zoho.com/zeptomail/help/domain-association.html).
