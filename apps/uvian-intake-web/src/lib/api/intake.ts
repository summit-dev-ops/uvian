import axios from 'axios';
import type { IntakeSchema, IntakeStatus } from './types';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_INTAKE_API_URL || 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export async function getIntakeSchema(tokenId: string): Promise<IntakeSchema> {
  const response = await apiClient.get<IntakeSchema>(
    `/api/public/intakes/${tokenId}`
  );
  return response.data;
}

export async function getIntakeStatus(tokenId: string): Promise<IntakeStatus> {
  const response = await apiClient.get<IntakeStatus>(
    `/api/public/intakes/${tokenId}/status`
  );
  return response.data;
}

export async function submitIntake(
  tokenId: string,
  payload: Record<string, unknown>,
  accessToken?: string
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  await apiClient.post(`/api/public/intakes/${tokenId}/submit`, payload, {
    headers,
  });
}
