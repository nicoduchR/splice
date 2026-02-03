import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IUserRepository } from '@domain/ports/user.repository.port';
import { User } from '@domain/entities/user.entity';
import { Email } from '@domain/value-objects/email.vo';
import { User as PrismaUser } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { stripeCustomerId },
    });

    return data ? this.toDomain(data) : null;
  }

  async save(user: User): Promise<User> {
    const data = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email.getValue(),
        stripeCustomerId: user.stripeCustomerId,
        createdAt: user.createdAt,
      },
    });

    return this.toDomain(data);
  }

  async update(user: User): Promise<User> {
    const data = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email.getValue(),
        stripeCustomerId: user.stripeCustomerId,
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  private toDomain(data: PrismaUser): User {
    return User.create({
      id: data.id,
      email: Email.create(data.email),
      stripeCustomerId: data.stripeCustomerId,
      createdAt: data.createdAt,
    });
  }
}
