import { IsString, Matches } from 'class-validator';

export class VerifyLicenseDto {
  @IsString()
  @Matches(/^SPLICE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, {
    message: 'License key must match format: SPLICE-XXXX-XXXX-XXXX',
  })
  licenseKey!: string;
}
