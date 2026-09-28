import axios from 'axios';
import { MESSAGES } from '@/constants/messages';

interface ApiErrorBody {
  message?: string;
  error?: string;
}

export function getErrorMessage(error: unknown, fallback: string = MESSAGES.GENERIC_ERROR): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return MESSAGES.NETWORK_ERROR;
    const { message, error: err } = error.response.data ?? {};
    return message ?? err ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
