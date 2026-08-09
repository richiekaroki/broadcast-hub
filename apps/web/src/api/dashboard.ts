import { req } from './http';
import { DashboardStats } from './types';

export const fetchDashboardStats = () => req<DashboardStats>('/dashboard');
