# My Water Account — Customer App

> React Native customer-facing app for the Smart Water Meter & Payment System.  
> Part of a three-repo full-stack portfolio project.

**Related repos:**
- [WaterMeterSystem](https://github.com/Nelson254-PNG/WaterMeterSystem) — C++ REST API backend
- [WaterMeterApp](https://github.com/Nelson254-PNG/WaterMeterApp) — Admin mobile app

---

## What This Does

A self-service mobile application for **water utility customers** to view their account, check bills, and make payments — without needing to visit an office.

### Screens

Screen           Purpose 
 Sign Up         Create a new account; meter number assigned automatically 
 Log In          Secure login with email and password 
 My Account      Live balance, usage history, bill status, payment history 
 Make Payment    M-Pesa Paybill, M-Pesa Till 

## Tech Stack

Component       Technology
 Framework      React Native + Expo SDK 56 
 Language       TypeScript 
 Navigation     React Navigation (native stack) 
 State          React Context + AsyncStorage (persistent login) 
 API            Fetch API with JWT Bearer tokens 

## Project Structure

```
CustomerApp/
├── App.tsx                    ← Root; auth-gated navigation
├── theme.ts                   ← Green brand colors, spacing, typography
├── api/
│   └── client.ts              ← Self-scoped API calls (always myId)
├── context/
│   └── AuthContext.tsx        ← Login state (token + userId)
├── types/
│   └── index.ts               ← TypeScript interfaces
└── screens/
    ├── LoginScreen.tsx
    ├── SignupScreen.tsx
    ├── MyAccountScreen.tsx
    └── MakePaymentScreen.tsx

```
## Setup
In the terminal

### 1. Install dependencies
``` in the bash terminal run
npm install
```
### 2. Configure API URL
Edit `api/client.ts`:
```typescript
const BASE_URL = "http://YOUR_IP:8090";
// or your ngrok URL for remote access
```

### 3. Run
``` in the bash terminal run
npx expo start --host lan
```

### 4. Build APK
``` in the bash terminal run
npx eas build -p android --profile preview
```

## Security Design

**Customers can only access their own data.** The server's `requireOwnerOrAdmin()` middleware compares the JWT's `userId` claim against the `customerId` in every URL — a customer cannot view, pay, or interact with another customer's account even if they know their UUID.

**Self-service signup** creates a full customer record with a meter number assigned automatically. A password hash (SHA-256 + random salt) is stored — the plain password is never saved anywhere.

**Signup immediately issues a token** — customers don't need to log in separately right after signing up.

**Token persisted via AsyncStorage** — customers stay logged in across app restarts. Tokens expire after 7 days.


## Key Difference From the Admin App

The customer app's `api/client.ts` functions always use the **logged-in user's own `userId`** as the customer identifier — there's no customer selection step. A customer sees exactly one account: their own.

This is enforced at two levels:
1. **App level** — the API client always passes `userId` from `AuthContext`
2. **Server level** — `requireOwnerOrAdmin()` rejects any token whose `userId` doesn't match the URL's `:id` parameter