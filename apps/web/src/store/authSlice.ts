import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'super_admin' | 'editor' | 'presenter' | 'advertiser' | 'viewer' | string;

interface AuthState {
  isAuthenticated: boolean;
  userName:        string;
  userRole:        UserRole;
  userEmail:       string;
}

function decodeToken(t: string | null): Partial<AuthState> {
  if (!t) return {};
  try {
    const p = JSON.parse(atob(t.split('.')[1]));
    const email = p.email ?? '';
    const name = email ? email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'User';
    return { userEmail: email, userRole: p.role ?? 'viewer', userName: name };
  } catch { return {}; }
}

const LS_VERSION = 'v1';
const token = localStorage.getItem(`accessToken:${LS_VERSION}`);

const initialState: AuthState = {
  isAuthenticated: !!token,
  userName:        'User',
  userRole:        'viewer',
  userEmail:       '',
  ...decodeToken(token),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated(state, action: PayloadAction<boolean>) {
      state.isAuthenticated = action.payload;
      if (!action.payload) {
        const v = 'v1';
        localStorage.removeItem(`accessToken:${v}`);
        localStorage.removeItem(`refreshToken:${v}`);
      }
    },
    setUser(state, action: PayloadAction<{ name: string; role: UserRole; email: string }>) {
      state.userName  = action.payload.name;
      state.userRole  = action.payload.role;
      state.userEmail = action.payload.email;
    },
  },
});

export const { setAuthenticated, setUser } = authSlice.actions;
export default authSlice.reducer;
