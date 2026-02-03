import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * DTO for redeeming an early adopter code
 */
export class RedeemEarlyAdopterCodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^SPLICE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, {
    message: 'Code must match format SPLICE-XXXX-XXXX-XXXX',
  })
  code!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

/**
 * Result of redeeming an early adopter code
 */
export interface RedeemEarlyAdopterCodeResult {
  success: boolean;
  data?: {
    licenseKey: string;
    plan: 'pro';
    expiresAt: null;
  };
  error?: {
    code: string;
    message: string;
  };
}
