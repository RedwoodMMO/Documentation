---
sidebar_position: 3
sidebar_label: SendGrid
---

# SendGrid Email Provider


## Configuration

|Variable|Default Value|Description|
|-|-|-|
|`email.sendgrid.api-url`|``|Your SendGrid [API Key](https://docs.sendgrid.com/api-reference/api-keys/create-api-keys); it's recommended you use Restricted Access and only enable mail sending.|

## Creating a Template

You'll need to create a [Dynamic Template](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates) for the email verification and specify the Template ID (reference the guide linked here on how to retrieve it) in the common `email.templates.verify-email` config. When creating the Dynamic Template for email verification, you'll need to provide a URL for the player to click to verify the email. The URL value should just be: `{{verify_email_url}}`; this will be auto-populated by Redwood.

You'll also need to change `email.email-addresses.no-reply` to be an email that you have set up as an [authorized sender identity](https://docs.sendgrid.com/for-developers/sending-email/sender-identity).
