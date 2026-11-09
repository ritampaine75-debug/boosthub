# BoostHub — Pure HTML / CSS / JavaScript Multi-Page Starter

An original, mobile-first social media services storefront built **100% in pure HTML, CSS, and vanilla JavaScript** (zero PHP, zero external CDNs, zero copied branding).

## Folder-Based Clean URL Structure

Every route lives in its own `index.html` folder so clean URLs work automatically on GitHub Pages, Netlify, Vercel, Cloudflare Pages, Nginx, or Apache:

| Clean URL | File | Purpose |
| :--- | :--- | :--- |
| `/` | `index.html` | Home ("Our Services"), trust badges, sample ticker, theme switcher, daily spin wheel |
| `/instagram/` | `instagram/index.html` | Instagram services list |
| `/facebook/` | `facebook/index.html` | Facebook services list |
| `/youtube/` | `youtube/index.html` | YouTube services list |
| `/order/?serviceid=101` | `order/index.html` | Dynamic pure-JS order form & live INR price calculator |
| `/orders/` | `orders/index.html` | Order history, status filters, search, and demo status progression |
| `/addfunds/` | `addfunds/index.html` | Demo INR wallet deposit UI & transaction ledger |
| `/menu/` | `menu/index.html` | Account ID, navigation hub, theme controls, and demo data reset |
| `/chat/` | `chat/index.html` | Interactive frontend support chat demo |
| `/share/` | `share/index.html` | Referral link copy page |
| `/install/` | `install/index.html` | PWA home-screen installation guide |
| `/terms/` | `terms/index.html` | Terms of Service |
| `/privacy-policy/` | `privacy-policy/index.html` | Privacy Policy |

## Included Interactive Features (Pure Browser JS)

- **6 Color & Dark Mode Themes:** Blue, Green, Red, Yellow, Purple, and Dark Mode saved in `localStorage`.
- **Daily Spin Reward Wheel:** Animated SVG prize wheel that credits demo `₹` bonus funds to your local wallet.
- **End-to-End Demo Wallet & Orders:** Add demo funds on `/addfunds/`, place orders on `/order/`, and filter or advance order statuses on `/orders/` (persisted in `localStorage` and mirrored in `IndexedDB`).

## Running Locally or Deploying

- **Static Hosting:** Upload the `boosthub/` folder directly to GitHub Pages, Netlify, Vercel, or Cloudflare Pages.
- **Note for Production:** Static HTML cannot verify real payments or process real orders securely. Before going live, connect `/addfunds/`, `/order/`, and `/orders/` to a backend API and database.
