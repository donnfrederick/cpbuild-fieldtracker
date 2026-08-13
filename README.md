# 🛠️ CPB Tools Dashboard

This is the internal web platform for **CP Build’s field operations and project management**. It enables workflows like unit tracking, task assignment, labor submissions, inspection reviews, and more — supporting in-house installers and team leads across multiple project scopes.

---

## ⚙️ Tech Stack

- **Frontend:** Vue 3 + Vite + TypeScript
- **UI Frameworks:** Bootstrap 5, Tabulator 6
- **State Management:** Pinia
- **Routing:** Vue Router
- **Validation:** Vee-Validate + Yup
- **Testing:** Vitest (unit)
- **Backend:** Azure Functions (JavaScript/TypeScript)
- **Database:** Azure SQL (with db-migrate)
- **Queueing:** Azure Redis + BullMQ
- **Authentication:** Azure AD via EasyAuth
- **CI/CD:** GitHub Actions (Dev, Staging, Prod)

---

## 🧠 Project Overview

This dashboard powers tools used by:

- 🧱 **Field Worker (installer, assemblers, etc.):** Submitting hours, marking tasks complete, reviewing assignments
- 👷 **Team Leads / Install Managers:** Reviewing submissions, performing inspections
- 🛠️ **Internal Admins:** Managing project/task structures, worker assignments

Each tool enforces task and unit phase rules, role-based access, and offline functionality where needed.

---

## 📦 Feature Flags

Feature flags are defined at **build time** using environment variables (e.g., `.env.dev`):

```ts
// vite-env.d.ts
VITE_FEATURE_OFFLINE_MODE = true;
```

A helper file exposes these flags:

```ts
// src/utils/featureFlags.ts
export const featureFlags = {
  offlineMode: import.meta.env.VITE_FEATURE_OFFLINE_MODE === 'true',
};
```

Use them in components or services:

```ts
if (featureFlags.offlineMode) {
  // Show offline-enabled logic or views
}
```

> ✅ Once a feature is complete, remove the old code and the flag.

---

## 🧪 Development Setup

```bash
# Install dependencies
npm install

# Start local dev server
npm run start
```

---

## 🔧 Build & Type Check

```bash
# Type check
npm run type-check

# Build for production
npm run build
```

---

## 🧪 Testing

### ✅ Unit Tests (Vitest)

```bash
npm run test

---

## 📦 Deployment

- **Dev:** Branch `dev` → Azure Static Web App (Dev)
- **Staging:** Branch `staging` → Azure SWA (Staging)
- **Production:** Branch `main` → Azure SWA (Prod)

Each uses its own `.env` file and GitHub/Actions secrets.

---

## 🗂️ Environment Files

Environment-specific config live in the .env file locally and as environment variables in each Azure SWA

These manage:
- Azure endpoints
- Blob storage keys
- Feature flags
- App URLs

---

## 🛡️ Authentication

Authentication is handled via **Azure Active Directory** using **EasyAuth**. User roles and info are retrieved from:

```

GET /.auth/me

```

Role-based access is enforced throughout the app and used to determine visible tools and actions.

---

## 🧰 Local Tooling

Recommended VS Code extensions:
- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)
- Disable `Vetur` for best results

For faster dev experience, consider enabling [Volar Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669).

---

## 🔍 Notes

- Redis is used for job queues and bulk row creation.
- Feature flagging is a temporary scaffolding tool; clean up flags after full rollout.

---

👷‍♀️ Built with care for CP Build's field team. Questions? Ask the internal dev team.
```
