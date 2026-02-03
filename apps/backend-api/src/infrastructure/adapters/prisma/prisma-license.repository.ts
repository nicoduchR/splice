import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ILicenseRepository } from '@domain/ports/license.repository.port';
import { License, LicenseStatus } from '@domain/entities/license.entity';
import { LicenseKey } from '@domain/value-objects/license-key.vo';
import { Plan } from '@domain/value-objects/plan.vo';
import { License as PrismaLicense } from '@prisma/client';

@Injectable()
export class PrismaLicenseRepository implements ILicenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(licenseKey: string): Promise<License | null> {
    const data = await this.prisma.license.findUnique({
      where: { licenseKey },
    });

    return data ? this.toDomain(data) : null;
  }

  async findById(id: string): Promise<License | null> {
    const data = await this.prisma.license.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByUserId(userId: string): Promise<License[]> {
    const data = await this.prisma.license.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return data.map((d) => this.toDomain(d));
  }

  async save(license: License): Promise<License> {
    const data = await this.prisma.license.create({
      data: {
        id: license.id,
        userId: license.userId,
        licenseKey: license.licenseKey.getValue(),
        plan: license.plan.getValue(),
        status: license.status,
        activatedAt: license.activatedAt,
        expiresAt: license.expiresAt,
        createdAt: license.createdAt,
      },
    });

    return this.toDomain(data);
  }

  async update(license: License): Promise<License> {
    const data = await this.prisma.license.update({
      where: { id: license.id },
      data: {
        plan: license.plan.getValue(),
        status: license.status,
        activatedAt: license.activatedAt,
        expiresAt: license.expiresAt,
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.license.delete({
      where: { id },
    });
  }

  private toDomain(data: PrismaLicense): License {
    return License.create({
      id: data.id,
      userId: data.userId,
      licenseKey: LicenseKey.create(data.licenseKey),
      plan: Plan.create(data.plan),
      status: data.status as LicenseStatus,
      activatedAt: data.activatedAt,
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
    });
  }
}
