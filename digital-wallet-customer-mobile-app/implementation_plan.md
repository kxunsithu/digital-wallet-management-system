# Implementation Plan - Toggle Language Feature (Myanmar & English)

Implement full internationalization (i18n) support with a language toggle feature (Myanmar 🇲🇲 & English 🇬🇧) for `digital-wallet-customer-mobile-app`. Persist the user's chosen language using `expo-secure-store` and integrate translations across all app screens, components, and headers.

## User Review Required

> [!NOTE]
> The language preference will be persisted locally on the device using `expo-secure-store` under the key `'app_language'`. The default language will be set to English (`'en'`), but users can easily switch to Myanmar (`'my'`) from the Profile screen settings or Auth screen header.

## Proposed Changes

### Internationalization Infrastructure

#### [NEW] [translations.ts](file:///home/khun-si-thu/Desktop/digital-wallet-management-system/digital-wallet-customer-mobile-app/src/i18n/translations.ts)
- Create comprehensive translation dictionary for English (`en`) and Myanmar (`my`).
- Cover all UI strings:
  - Common actions & navigation labels
  - Auth screens (Login, OTP, Create PIN, Forgot PIN)
  - Home / Dashboard (Balance, Quick Actions, KYC status banners, Notifications)
  - Transfer & Cash-in / Cash-out (Recipient phone, Amount, Fee, Security PIN modal)
  - Profile & Account Settings (Personal info, Change PIN, Auto-Save Receipt, Dark Mode, Language Selector)
  - Transaction History (Filters, empty states, transaction types)
  - Receipt Modal (Transfer Successful, Sender/Receiver Details, Save/Share actions)

#### [NEW] [LanguageProvider.tsx](file:///home/khun-si-thu/Desktop/digital-wallet-management-system/digital-wallet-customer-mobile-app/src/providers/LanguageProvider.tsx)
- Create `LanguageContext` and `LanguageProvider` component.
- Provide `useLanguage()` custom hook returning:
  - `language`: `'en' | 'my'`
  - `setLanguage(lang: 'en' | 'my'): Promise<void>`
  - `toggleLanguage(): Promise<void>`
  - `t(key: string, params?: Record<string, string | number>): string` translation function.
- Load stored language from `expo-secure-store` (`'app_language'`) on mount.

#### [MODIFY] [_layout.tsx](file:///home/khun-si-thu/Desktop/digital-wallet-management-system/digital-wallet-customer-mobile-app/src/app/_layout.tsx)
- Wrap root application layout with `<LanguageProvider>` so all nested components have access to i18n state.

---

### App Screen & Component Updates

#### [MODIFY] [profile.tsx](file:///home/khun-si-thu/Desktop/digital-wallet-management-system/digital-wallet-customer-mobile-app/src/app/(tabs)/profile.tsx)
- Add "Language / ဘာသာစကား" setting item under Account Settings section showing current language (English / မြန်မာ).
- Add Language Switcher Modal / Action Sheet allowing user to toggle between English and Myanmar.
- Update profile headers, info cards, modal labels, and notifications to use `t(...)`.

#### [MODIFY] [index.tsx](file:///home/khun-si-thu/Desktop/digital-wallet-management-system/digital-wallet-customer-mobile-app/src/app/(tabs)/index.tsx)
- Replace static strings with `t(...)` for greeting, balance labels, quick actions (Send Money, My QR Code, Scan QR), notification list modal, and sign out confirmation modal.

#### [MODIFY] [transactions.tsx](file:///home/khun-si-thu/Desktop/digital-wallet-management-system/digital-wallet-customer-mobile-app/src/app/(tabs)/transactions.tsx)
- Update transaction history title, search placeholder, type filter chips, date labels, and empty state strings with `t(...)`.

#### [MODIFY] [cash-in.tsx](file:///home/khun-si-thu/Desktop/digital-wallet-management-system/digital-wallet-customer-mobile-app/src/app/cash-in.tsx)
- Translate form fields (Recipient Phone Number, Amount, Description), PIN verification modal, error/success toasts, and scanner titles.

#### [MODIFY] [qr-code.tsx](file:///home/khun-si-thu/Desktop/digital-wallet-management-system/digital-wallet-customer-mobile-app/src/app/qr-code.tsx)
- Translate QR code screen title, instructions, and save/share buttons.

#### [MODIFY] [auth/index.tsx](file:///home/khun-si-thu/Desktop/digital-wallet-management-system/digital-wallet-customer-mobile-app/src/app/auth/index.tsx)
- Add language toggle button on top right of the Auth header so users can change language before logging in.
- Translate form inputs, labels, and action buttons.

#### [MODIFY] [TransferReceiptModal.tsx](file:///home/khun-si-thu/Desktop/digital-wallet-management-system/digital-wallet-customer-mobile-app/src/components/TransferReceiptModal.tsx)
- Update receipt modal text (Transfer Successful, Transaction Receipt, Amount Transferred, Sender/Receiver Details, Save/Share buttons) using `t(...)`.

---

## Verification Plan

### Automated Verification
- Verify code compilation and TypeScript type checking by running `npx tsc --noEmit` or `npm run lint` inside `digital-wallet-customer-mobile-app`.

### Manual Verification
- Test toggling language in Profile Screen from English to Myanmar and vice versa.
- Verify persistence: restart app state / reload to ensure selected language is preserved via `expo-secure-store`.
- Verify Auth screen top-right language toggle button.
- Check translated UI rendering on Dashboard, Profile, Transactions, Cash-In, QR Code, and Receipt Modal to ensure text fits cleanly without truncation or overflow.

---

### Implementation Tasks
1. Setup i18n foundation
   - Add `src/i18n/translations.ts` with `en` and `my` dictionaries.
   - Add `src/providers/LanguageProvider.tsx` and export `useLanguage()`.
   - Ensure `LanguageProvider` loads stored preference and exposes translation helper `t()`.
2. Integrate provider into app root
   - Wrap `src/app/_layout.tsx` with `LanguageProvider`.
   - Confirm context is available in both auth and authenticated app stacks.
3. Update screens and components
   - Replace static labels in `src/app/(tabs)/index.tsx`, `profile.tsx`, `transactions.tsx`, `cash-in.tsx`, `qr-code.tsx`, and `auth/index.tsx`.
   - Add language selector UI on Profile screen and Auth header.
   - Update `src/components/TransferReceiptModal.tsx` for translated receipt strings.
4. Persist language selection
   - Use `expo-secure-store` with key `app_language`.
   - Add fallback to `'en'` for initial load.
5. Validate implementation
   - Run TypeScript check and lint.
   - Execute manual language switching flows.

### Acceptance Criteria
- User can switch between English and Myanmar from Profile settings.
- User can switch language before authentication on Auth screen.
- Selected language persists after app restart.
- All targeted screens render translated text immediately after selection.
- No UI crashes or undefined translation keys occur.
- App compiles cleanly with no type errors from the new provider or translation function.

### Dependencies
- `expo-secure-store`
- existing navigation and layout structure in `src/app`
- current UI component patterns for Profile, Auth, and modal screens

### Rollout Notes
- Implement incremental changes in a feature branch.
- First verify on a simulator/device in both English and Myanmar.
- If needed, add a small fallback logging helper for missing translation keys before production.
- Keep language dictionary updates centralized in `src/i18n/translations.ts` for future expansion.
