# Smart Wallet Agent Mobile App

A digital wallet management app built with Expo Router and React Native.

This project provides a mobile wallet experience with PIN-based authentication, QR code scanning, secure storage, transaction history, and profile management.

## Key features

- PIN creation, verification, reset, and forgot PIN flows
- QR code scanner for sending or receiving wallet details
- Cash in / cash out screens for wallet operations
- Transaction history and profile tabs
- Secure storage using `expo-secure-store`
- NativeWind + Tailwind CSS styling
- Cross-platform support for Android, iOS, and web via Expo

## Project structure

- `app/` — Expo Router screens and routes
  - `auth/` — authentication flows: create PIN, verify OTP, reset PIN, verify PIN
  - `(tabs)/` — main authenticated tabs: home, transactions, profile
  - `cash-in.tsx`, `cash-out.tsx`, `qr-code.tsx` — core wallet flows
- `src/components/` — reusable UI components
- `src/lib/api.ts` — API helper functions
- `src/services/` — app services such as auth, notification store, and settings store
- `src/providers/ThemeProvider.tsx` — theme context provider

## Getting started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the Metro bundler

   ```bash
   npm start
   ```

3. Run on a platform

   ```bash
   npm run android
   npm run ios
   npm run web
   ```

## Available scripts

- `npm start` — launch Expo Metro bundler
- `npm run android` — open the app on an Android device or emulator
- `npm run ios` — open the app on an iOS simulator
- `npm run web` — open the app in the browser
- `npm run lint` — run Expo linting
- `npm run reset-project` — reset starter project structure via `scripts/reset-project.js`

## Dependencies

This app uses Expo SDK 57 with React 19 and includes several Expo modules, such as:

- `expo-router`
- `expo-camera`
- `expo-barcode-scanner`
- `expo-secure-store`
- `expo-splash-screen`
- `react-native-svg`
- `react-native-toast-message`
- `nativewind`

## Notes

- Update the `app.json` Expo configuration before building production versions.
- Use the `app/` directory for new screens and route files.
- Keep UI logic inside `src/components` and app state in `src/services`.

## Learn more

- Expo docs: https://docs.expo.dev/
- Expo Router: https://expo.github.io/router/docs
- Tailwind with Expo: https://www.nativewind.dev/
