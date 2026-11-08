---
sidebar_position: 1
sidebar_label: Overview
---

# Transactional Email

Redwood currently only uses transactional emails for account verification ([if enabled](../authentication/local.md)), but you can use the integration for other purposes (e.g. sending an email to a player with a gift since they haven't been online in awhile, players receive a message from in-game chat, etc.).

Redwood's available email providers are:
- [**ZeptoMail**](./zeptomail.md) - Uses Zoho's [ZeptoMail](https://www.zoho.com/zeptomail/) service.
- [**SendGrid**](./sendgrid.md) - Uses Twilio's [SendGrid](https://sendgrid.com/) service.

## Common Configuration

You will need to change the default common configuration in `config/node/your-env/email/_index.yaml`; here is the default template:

``` yaml
# Can be "none", "zeptomail", and "sendgrid"
provider: "none"

contact:
  name: "Company"
  address: "1234 Address St"
  city: "City"
  state: "State"
  zip: "12345"

# IDs for various templates; both providers will provide
# an ID after you create the email template.
templates:
  verify-email: ""

email-addresses:
  no-reply:
    name: "Company"
    address: "no-reply@website.com"
```
