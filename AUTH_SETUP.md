# Authentication Setup Guide

## Overview
The mobile app now has complete authentication flow with Login, Signup, Logout, and Profile screens.

## Features Implemented

### 1. **Authentication Context** (`src/contexts/AuthContext.tsx`)
- Manages user authentication state
- Handles login, registration, logout
- Persists auth state using AsyncStorage
- Auto-loads stored credentials on app start

### 2. **API Service** (`src/services/api.ts`)
- Axios-based HTTP client
- Automatic token injection in requests
- Token refresh handling
- Error handling

### 3. **Screens**
- **Login** (`src/screens/auth/Login.tsx`) - Email/password login
- **Signup** (`src/screens/auth/Signup.tsx`) - User registration
- **Profile** (`src/screens/Profile.tsx`) - User profile and logout

### 4. **UI Components**
- **Button** (`src/components/ui/Button.tsx`) - Reusable button component
- **Input** (`src/components/ui/Input.tsx`) - Form input with validation
- **AppLayout** (`src/components/AppLayout.tsx`) - App layout wrapper

### 5. **Navigation**
- Auth-aware navigation
- Shows Login/Signup when not authenticated
- Shows main app (Home, Explore, Profile tabs) when authenticated
- Loading state while checking auth

## Configuration

### API URL Setup
Update the API URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api' // Android emulator
    : 'http://localhost:8000/api' // iOS simulator
  : 'https://your-api-domain.com/api'; // Production
```

**For physical devices**, use your computer's local IP address:
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Use: `http://YOUR_IP:8000/api`

## Usage

### Login Flow
1. User opens app
2. If not authenticated → Shows Login screen
3. User enters email/password
4. On success → Navigates to main app
5. Token stored in AsyncStorage

### Signup Flow
1. User taps "Sign Up" on Login screen
2. Enters name, email, password, confirm password
3. On success → Auto-login and navigate to main app

### Logout Flow
1. User goes to Profile tab
2. Taps "Logout" button
3. Confirms logout
4. Token cleared, navigates back to Login

## API Endpoints Used

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/me` - Get current user
- `POST /api/refresh` - Refresh JWT token

## Next Steps

1. **Update API URL** in `src/services/api.ts` for your environment
2. **Test the flow**:
   - Run the Laravel API server: `php artisan serve`
   - Run the mobile app: `npm start`
   - Test login/signup/logout
3. **Customize** the UI colors and styling as needed

## Notes

- Tokens are stored securely in AsyncStorage
- Auth state persists across app restarts
- Automatic token refresh on 401 errors
- Form validation on client side
- Error messages displayed via Alert
