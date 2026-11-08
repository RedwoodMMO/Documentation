---
sidebar_position: 3
sidebar_label: SendGrid
---

# SendGrid Email Provider

The `sendgrid` provider sends Redwood's emails with Twilio's [SendGrid](https://sendgrid.com/) using a Dynamic Template. Set `email.provider` to `sendgrid` to use it.

## Configuration

|Variable|Default Value|Description|
|-|-|-|
|`email.sendgrid.api-key`|`""`|Your SendGrid [API Key](https://docs.sendgrid.com/api-reference/api-keys/create-api-keys); we recommend you use Restricted Access and only enable mail sending. This variable doesn't support the [secrets](../secrets/overview.md) system in 5.0.|

For example, in `config/node/your-game/email/_index.yaml` and `config/node/your-game/email/sendgrid.yaml`:

```yaml
# email/_index.yaml
provider: "sendgrid"

templates:
  verify-email: "d-0123456789abcdef0123456789abcdef"

email-addresses:
  no-reply:
    name: "Your Game"
    address: "no-reply@yourgame.com"
```

```yaml
# email/sendgrid.yaml
api-key: "SG.xxxxx"
```

## Creating a Template

You'll need to create a [Dynamic Template](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates) for the email verification and specify the Template ID (reference the guide linked here on how to retrieve it) in the common `email.templates.verify-email` config. When creating the Dynamic Template for email verification, you'll need to provide a URL for the player to click to verify the email. The URL value should just be `{{verify_email_url}}`; this is auto-populated by Redwood. Redwood also provides `{{Sender_Name}}`, `{{Sender_Address}}`, `{{Sender_City}}`, `{{Sender_State}}`, and `{{Sender_Zip}}` from the [`email.contact` config](./overview.md#common-configuration) for your template's footer.

You'll also need to change `email.email-addresses.no-reply` to be an email that you have set up as an [authorized sender identity](https://docs.sendgrid.com/for-developers/sending-email/sender-identity).
