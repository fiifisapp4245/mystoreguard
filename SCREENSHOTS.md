# Screenshots to capture

Every `<Screenshot name="..." />` placeholder on the site is listed below. Capture
each from the dashboard prototype using the **Adwoa's Provisions** demo data
(cedi amounts, local product names — e.g. Ideal Milk 380g), then drop the file
into `/public/screenshots/{name}.png` and swap the placeholder for a real
`<Image src="/screenshots/{name}.png" ... />` (or update `<Screenshot />` to
render it once files exist).

Aspect ratios matter — the placeholder frames are already sized correctly, so
crop captures to match:

- **wide** = 16:10 (landscape, full dashboard screen)
- **standard** = 4:3 (tighter crop, one panel or module view)

## Home (`/`)

| Name | Aspect | Capture |
|---|---|---|
| ~~`dashboard-home`~~ | wide | **Replaced** — the hero now renders `/public/hero_image.png` directly (see the Hero section in `app/(marketing)/page.tsx`), not the `<Screenshot />` placeholder. That image is a decorative illustration, not a product screenshot — it breaks the "no stock photography" rule below on purpose, as a deliberate call for this one slot. Swap in a real dashboard capture here if that's reconsidered. |
| `flow-receive` | standard | Inventory / Store & Warehouse screen showing a delivery being logged or stock being split into sellable units. |
| `flow-sell` | standard | Sales or Invoice screen mid-transaction — a daily sale or an invoice being created. |
| `flow-track` | standard | A screen showing a sale or expense attributed to a specific staff member, or the audit log in Settings. |
| `flow-reports` | standard | Reports screen — a chart or summary table showing revenue/profit. |

## Features (`/features`)

One per module group, matching the dashboard sidebar groups exactly:

| Name | Aspect | Capture |
|---|---|---|
| `group-home` | wide | Dashboard overview. |
| `group-sell` | wide | Sales, Invoice, Deliveries, or Estimator — whichever best represents the group. |
| `group-stock` | wide | Inventory or Store & Warehouse. |
| `group-people` | wide | Users (customers/suppliers/staff list). |
| `group-grow` | wide | Loyalty, Offers & Rewards, or Appointments. |
| `group-money` | wide | Expenses or Reports. |
| `group-system` | wide | Settings, ideally showing the audit log — this is a selling point on the Pricing page too. |

## Notes

- 11 `<Screenshot />` placeholders remain (`dashboard-home` is now a real
  image, not a placeholder — see above).
- Every remaining placeholder renders `data-screenshot="{name}"` in the DOM,
  so they're easy to find with a browser search once real images are wired
  in.
- No stock photography anywhere else on the site — every other image slot is
  a real product screenshot.
