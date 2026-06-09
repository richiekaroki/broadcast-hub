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
    return { userEmail: p.email ?? '', userRole: p.role ?? 'viewer' };
  } catch { return {}; }
}

const token = localStorage.getItem('accessToken');

const initialState: AuthState = {
  isAuthenticated: !!token,
  userName:        'Richard Karoki',
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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
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
