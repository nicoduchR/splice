import { Injectable } from '@nestjs/common';
import { LicenseKey } from '@domain/value-objects/license-key.vo';

@Injectable()
export class LicenseKeyGeneratorService {
  generate(): LicenseKey {
    return LicenseKey.generate();
  }

  generateMultiple(count: number): LicenseKey[] {
    return Array.from({ length: count }, () => this.generate());
  }

  validate(key: string): boolean {
    return LicenseKey.isValid(key);
  }
}
