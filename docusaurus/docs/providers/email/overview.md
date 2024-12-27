---
sidebar_position: 1
sidebar_label: Overview
---

# Transactional Email Providers

Redwood currently only uses transactional emails for account verification ([if enabled](../authentication/overview.md#basic-authentication)), but you can use the integration for other purposes (e.g. sending an email to a player with a gift since they haven't been online in awhile, players receive a message from in-game chat, etc.).

Currently, the only supported email provider is [SendGrid](https://sendgrid.com/).

## SendGrid Configuration

Below are the configuration variables available in `RedwoodBackend/config/node/default/sendgrid.yaml`:

``` yaml
api-key: ""
contact:
  name: "Company"
  address: "1234 Address St"
  city: "City"
  state: "State"
  zip: "12345"
templates:
  verify-email: ""
email-addresses:
  no-reply: "Company <no-reply@website.com>"
```

You'll need to configure the `api-key` with an [API Key](https://docs.sendgrid.com/api-reference/api-keys/create-api-keys); it's recommended you use Restricted Access and only enable mail sending.

You'll need to create a [Dynamic Template](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates) for the email verification and specify the Template ID (reference the guide linked here on how to retrieve it) in `templates.verify-email`. When creating the Dynamic Template for email verification, you'll need to provide a URL for the player to click to verify the email. It should have the syntax: `https://<yourhostname>/verify-email/{{email_verification_secret}}`. Leave `{{email_verification_secret}}` as is, but replace `<yourhostname` with the hostname specified in the `deployment.redwood.hostname` config variable (e.g. `director.redwoodmmo.com`).

You'll also need to change `email-addresses.no-reply` to be an email that you have set up as an [authorized sender identity](https://docs.sendgrid.com/for-developers/sending-email/sender-identity).
