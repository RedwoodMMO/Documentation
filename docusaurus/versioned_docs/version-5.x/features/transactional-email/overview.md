---
sidebar_position: 1
sidebar_label: Overview
---

# Transactional Email

Redwood currently only uses transactional emails for account verification ([if enabled](../authentication/local.md#email-verification-flow)), but you can use the integration for other purposes if you have source access (e.g. sending an email to a player with a gift since they haven't been online in a while, or when players receive a message from in-game chat).

Redwood's available email providers are:
- [**ZeptoMail**](./zeptomail.md) - Uses Zoho's [ZeptoMail](https://www.zoho.com/zeptomail/) service.
- [**SendGrid**](./sendgrid.md) - Uses Twilio's [SendGrid](https://sendgrid.com/) service.

## Common Configuration

You will need to change the default common configuration in `config/node/your-env/email/_index.yaml`; here is the default:

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

| Variable | Description |
| --- | --- |
| `email.provider` | Which provider sends emails: `none` (default), `zeptomail`, or `sendgrid`. With `none`, registering with [account verification](../authentication/local.md#configuration) enabled fails with `Failed to send account verification email`. |
| `email.contact.*` | Your company's postal details. They're passed to SendGrid templates as `Sender_Name`, `Sender_Address`, `Sender_City`, `Sender_State`, and `Sender_Zip` (many regions legally require a physical address in marketing-style emails). |
| `email.templates.verify-email` | The provider's ID for your verification email template. If empty, verification emails can't be sent. |
| `email.email-addresses.no-reply.name` / `.address` | The sender name and address for Redwood's emails |

The verification link in the email points at the Director Frontend's external connection (`director.frontend.connection.external`), e.g. `https://director.yourgame.com:443/verify-email/<code>`, so that needs to be reachable from your players' browsers.

:::note
During development, `director.development.auto-verify-email` (on by default) automatically verifies new accounts about a second after registering when `environment.development` is `true`, so you don't need an email provider to test the flow. The email is still attempted.
:::

See the [email config reference](../../configuration/reference/chat-and-email.md) for every variable.
