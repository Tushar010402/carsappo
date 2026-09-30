/**
 * Starter policy text, used until a policy is customised in Admin → Pages. Review with your legal / CA
 * advisor before launch — these are sensible defaults for an Indian D2C store, not legal advice.
 * {tokens} are filled from the store, shipping and delivery settings (see CONTENT_TOKENS in src/lib/content.ts).
 */
export const POLICY_DEFAULTS: Record<string, { title: string; body: string }> = {
  "shipping-policy": {
    title: "Shipping Policy",
    body: `We ship across India through trusted courier partners.

## Dispatch
Orders are dispatched within **{dispatchTime}** (excluding Sundays and public holidays). Custom-fit products (7D mats, seat covers, body covers) may take 2–4 additional days to make for your exact vehicle.

## Delivery timelines
{deliveryTable}

## Shipping charges
- **Free shipping** on orders above {freeShipping}.
- A flat fee of {shippingFee} applies to smaller orders.
{codNote}

## Tracking
Once your order ships you'll receive the courier name and tracking number by email, and you can track it anytime from **My Account → Track Orders** or the [Track Order](/track-order) page.

## Undelivered packages
If a delivery fails because of an incorrect address or the recipient being unavailable, the courier will re-attempt. Packages returned to us after failed attempts will be refunded minus shipping charges.

Questions? Contact us at {contact}.`,
  },
  "return-policy": {
    title: "Return & Refund Policy",
    body: `We want you to love every {storeName} purchase.

## Eligibility
You can request a return within **{returnDays} days of delivery** if:
- the product arrived **damaged or defective**,
- you received the **wrong item**, or
- a **custom-fit product doesn't fit** the vehicle (brand, model, year) selected at purchase.

Products must be unused and returned with original packaging, tags and accessories.

## Non-returnable items
- Opened or used liquids and car care chemicals (polish, shampoo, perfume) unless damaged on arrival
- Products damaged due to misuse or improper installation
- Gift cards and services

## How to request a return
1. Go to **My Account → My Orders** and open the delivered order.
2. Click **Request return**, choose a reason and share details (photos help — you can send them on WhatsApp).
3. We'll review within 24 hours and arrange a reverse pickup.

## Refunds
- Once the returned item passes a quality check, refunds are issued within **5–7 business days**.
- Online payments are refunded to the original payment method. COD orders are refunded by bank transfer / UPI.
- Shipping and COD charges are non-refundable unless the return is due to our error.

Need help? Write to {contact}.`,
  },
  "cancellation-policy": {
    title: "Cancellation Policy",
    body: `## Cancelling an order
You can cancel an order yourself from **My Account → My Orders** (or from the order link in your confirmation email) until it's packed.

Once an order is packed or shipped it can't be cancelled, but you can refuse delivery or request a return as per our [Return Policy](/policies/return-policy).

## Refunds on cancellation
Prepaid orders cancelled before dispatch are refunded in full to the original payment method within 5–7 business days.

## Cancellations by {legalName}
We may cancel an order if a product is out of stock, the delivery pincode isn't serviceable, or we suspect fraudulent activity. You'll receive a full refund in such cases.

## Daily car cleaning subscriptions
Monthly cleaning plans can be paused or cancelled with **3 days' notice** before the next billing date. One-time services can be rescheduled or cancelled free of charge up to 12 hours before the slot.`,
  },
  "privacy-policy": {
    title: "Privacy Policy",
    body: `{legalName} ("we", "us") respects your privacy. This policy explains what we collect and how we use it, in line with the Digital Personal Data Protection Act, 2023.

## Information we collect
- **Account & order details:** name, email, phone number, shipping and billing addresses, GSTIN (if provided).
- **Vehicle details** you choose to share (make, model, year, fuel type) to show compatible products.
- **Payment information** is processed securely by Razorpay — we never store your card or UPI details.
- **Usage data:** pages visited, device and browser information, collected via cookies and analytics tools (Google Analytics, Google Tag Manager, Meta Pixel).

## How we use it
- To process and deliver orders, generate GST invoices and provide customer support.
- To schedule and deliver car cleaning services.
- To send order updates and, if you opt in, offers and newsletters (you can unsubscribe anytime).
- To improve our website, prevent fraud and meet legal obligations.

## Sharing
We share only what's necessary with service providers: payment gateway (Razorpay), courier partners (via Shiprocket), email providers and analytics/advertising platforms. We never sell your personal data.

## Your rights
You can access, correct or request deletion of your data by writing to {email}. Some data (such as invoices) must be retained to comply with tax laws.

## Cookies
We use essential cookies to keep you signed in and remember your cart, and analytics/advertising cookies to understand and improve our marketing.

## Contact
Grievance officer: {grievanceOfficer}. Email: {email}.`,
  },
  "terms-and-conditions": {
    title: "Terms & Conditions",
    body: `{website} is operated by {registeredEntity}. By using the website you agree to these terms.

## Products & pricing
- All prices are in Indian Rupees and **inclusive of GST**.
- We try to display products accurately; colours may vary slightly due to screen settings.
- Prices and availability may change without notice. If an item is mispriced, we may cancel the order and refund you.

## Vehicle compatibility
Compatibility information is provided to help you choose. Please select your vehicle carefully; for custom-fit products we rely on the vehicle details you provide.

## Orders
An order is confirmed when you receive an order confirmation. We reserve the right to refuse or cancel orders (e.g. stock issues, suspected fraud).

## Payments
Online payments are processed by Razorpay. Cash on Delivery may be limited by order value and pincode.

## Services
Daily car cleaning is available only in our service area: {serviceArea} Service schedules may change due to weather or unforeseen circumstances; missed days are compensated.

## Liability
Our liability for any claim is limited to the value of the product or service purchased.

## Governing law
These terms are governed by the laws of India. Courts at Gautam Buddh Nagar, Uttar Pradesh shall have exclusive jurisdiction.

## Grievance officer
{grievanceOfficer}. Email: {email}. We acknowledge complaints within 48 hours and resolve them within one month.

Contact: {contact}.`,
  },
};

/** Built-in policies, in footer order. */
export const BUILT_IN_POLICY_SLUGS = ["shipping-policy", "return-policy", "privacy-policy", "terms-and-conditions", "cancellation-policy"];
