import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IReleaseRepository } from '@domain/ports/release.repository.port';
import {
  AppRelease,
  AppReleaseProps,
  Platform,
  PlatformRelease,
  PlatformReleaseProps,
} from '@domain/entities/app-release.entity';
import { SemVer } from '@domain/value-objects/semver.vo';
import { AppRelease as PrismaAppRelease, PlatformRelease as PrismaPlatformRelease } from '@prisma/client';

type PrismaAppReleaseWithPlatforms = PrismaAppRelease & {
  platformReleases: PrismaPlatformRelease[];
};

@Injectable()
export class PrismaReleaseRepository implements IReleaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AppRelease | null> {
    const data = await this.prisma.appRelease.findUnique({
      where: { id },
      include: { platformReleases: true },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByVersion(version: string): Promise<AppRelease | null> {
    const data = await this.prisma.appRelease.findUnique({
      where: { version },
      include: { platformReleases: true },
    });

    return data ? this.toDomain(data) : null;
  }

  async findLatestForPlatform(platform: Platform): Promise<AppRelease | null> {
    // Find all releases that have a platform release for this platform
    const releases = await this.prisma.appRelease.findMany({
      where: {
        platformReleases: {
          some: { platform },
        },
      },
      include: { platformReleases: true },
      orderBy: { releaseDate: 'desc' },
    });

    if (releases.length === 0) {
      return null;
    }

    // Sort by semver to get the actual latest (not just by date)
    const domainReleases = releases.map((r) => this.toDomain(r));
    domainReleases.sort((a, b) => b.version.compare(a.version));

    return domainReleases[0];
  }

  async findAll(): Promise<AppRelease[]> {
    const data = await this.prisma.appRelease.findMany({
      include: { platformReleases: true },
      orderBy: { releaseDate: 'desc' },
    });

    // Sort by semver (newest first)
    const releases = data.map((d) => this.toDomain(d));
    releases.sort((a, b) => b.version.compare(a.version));

    return releases;
  }

  async save(release: AppRelease): Promise<AppRelease> {
    const data = await this.prisma.appRelease.create({
      data: {
        id: release.id,
        version: release.version.toString(),
        releaseDate: release.releaseDate,
        releaseNotes: release.releaseNotes,
        isMandatory: release.isMandatory,
        createdAt: release.createdAt,
        platformReleases: {
          create: release.platformReleases.map((pr) => ({
            id: pr.id,
            platform: pr.platform,
            downloadUrl: pr.downloadUrl,
            signature: pr.signature,
            createdAt: pr.createdAt,
          })),
        },
      },
      include: { platformReleases: true },
    });

    return this.toDomain(data);
  }

  async update(release: AppRelease): Promise<AppRelease> {
    // Delete existing platform releases and recreate them
    await this.prisma.platformRelease.deleteMany({
      where: { releaseId: release.id },
    });

    const data = await this.prisma.appRelease.update({
      where: { id: release.id },
      data: {
        version: release.version.toString(),
        releaseDate: release.releaseDate,
        releaseNotes: release.releaseNotes,
        isMandatory: release.isMandatory,
        platformReleases: {
          create: release.platformReleases.map((pr) => ({
            id: pr.id,
            platform: pr.platform,
            downloadUrl: pr.downloadUrl,
            signature: pr.signature,
            createdAt: pr.createdAt,
          })),
        },
      },
      include: { platformReleases: true },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appRelease.delete({
      where: { id },
    });
  }

  private toDomain(data: PrismaAppReleaseWithPlatforms): AppRelease {
    const platformReleases = data.platformReleases.map((pr) =>
      PlatformRelease.create({
        id: pr.id,
        releaseId: pr.releaseId,
        platform: pr.platform as Platform,
        downloadUrl: pr.downloadUrl,
        signature: pr.signature,
        createdAt: pr.createdAt,
      }),
    );

    return AppRelease.create({
      id: data.id,
      version: SemVer.parse(data.version),
      releaseDate: data.releaseDate,
      releaseNotes: data.releaseNotes,
      isMandatory: data.isMandatory,
      platformReleases,
      createdAt: data.createdAt,
    });
  }
}
