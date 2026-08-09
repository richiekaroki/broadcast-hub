import { req } from './http';
import { ProgramsResponse } from './types';

export const fetchPrograms = (page = 1, limit = 20) => req<ProgramsResponse>(`/programs?page=${page}&limit=${limit}`);
