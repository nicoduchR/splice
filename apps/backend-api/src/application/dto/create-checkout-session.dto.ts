import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for creating a Stripe checkout session
 */
export class CreateCheckoutSessionDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  priceId!: string;
}

/**
 * Result of creating a checkout session
 */
export interface CreateCheckoutSessionResult {
  checkoutUrl: string;
  sessionId: string;
}
