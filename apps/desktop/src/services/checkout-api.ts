/**
 * Checkout API Service
 *
 * Handles communication with backend API for Stripe checkout session creation.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_KEY = import.meta.env.VITE_API_KEY || '';

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class CheckoutApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'CheckoutApiError';
  }
}

/**
 * Create a Stripe checkout session for subscription upgrade
 *
 * @param email - Customer email for checkout
 * @param priceId - Stripe price ID for the subscription
 * @returns Checkout session URL and session ID
 * @throws CheckoutApiError on API failure or network error
 */
export async function createCheckoutSession(
  email: string,
  priceId: string
): Promise<CheckoutSessionResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/api/v1/stripe/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ email, priceId }),
    });
  } catch (error) {
    throw new CheckoutApiError(
      'NETWORK_ERROR',
      'Impossible de contacter le serveur. Vérifiez votre connexion internet.'
    );
  }

  let data: ApiResponse<CheckoutSessionResponse>;

  try {
    data = await response.json();
  } catch {
    throw new CheckoutApiError(
      'INVALID_RESPONSE',
      'Réponse invalide du serveur. Veuillez réessayer.'
    );
  }

  if (!data.success) {
    throw new CheckoutApiError(
      data.error.code,
      data.error.message
    );
  }

  return data.data;
}
