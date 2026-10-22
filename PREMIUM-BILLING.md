# Premium billing implementation brief

Status: backend implementation prepared for R$ 15 manual Pix renewals. Live checkout requires the Discord OAuth secret and Pix details to be installed in the private server environment. Do not claim automatic recurring billing: this flow requires manual payment confirmation.

## Purchase journey
1. Sign in with Discord through OAuth `identify`.
2. Confirm that the Discord account matches an activated, linked NovaClient license, then ask for its license ID.
3. Create a R$ 15 pending order on the backend and reveal the private Pix QR and copy-and-paste code only after both checks pass.
4. The player reports that Pix was sent. This does not activate Premium; an administrator checks the payment and confirms it in the private dashboard.
5. A confirmed order grants one calendar month of Supporter Premium. If another payment is not confirmed, the benefit ends after a 24-hour grace period.
6. The license service signs the effective role; the existing base license and permanent role remain unchanged.

## Separation from existing licenses
The current license service already uses plan and expires_at to authorize access to the entire client. Do not reuse those fields as cosmetic Premium subscription expiry: that would disable the base client when Premium ends.

Keep a separate entitlement table with license_id, provider, subscription_id, status, paid_through and audit timestamps. Resolve the effective role without overwriting permanent Owner, Collaborator or manually granted Supporter rights. Use the existing signed authorization path to communicate effective permissions. No additional authority in browser local storage.

## Service boundaries
GitHub Pages remains the static frontend. The existing HTTPS license backend handles Discord OAuth, orders, private QR delivery, payment audit, admin confirmation and signed entitlement updates. OAuth secrets and Pix payload/QR stay in the private server environment. The public site contains only a link to the backend. Avoid collecting bank passwords, card data or a complete activation key in the public frontend; use authenticated account linking.

## Required decisions
- Discord Client Secret and exact registered callback URI.
- Confirmation that the stored Pix QR and copy-and-paste payload are for R$ 15 and can accept the intended repeat payments.
- Merchant identity, support contact and refund/cancellation terms before production checkout.

## Required verification before launch
Before describing this as automated recurring billing, integrate a payment provider with verifiable payment notifications and test duplicate/forged notifications, amount mismatch, replay/out-of-order events, expiry, refunds, chargebacks and cancellation. The current manual Pix confirmation is not a provider webhook or subscription.
