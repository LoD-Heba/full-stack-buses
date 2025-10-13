import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  LessThan,
} from 'typeorm';
import { CreatePaymentDto, PaymentStatus } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponse } from 'src/modules/auth/interfaces/auth.interfaces';
import { SearchPaymentDto } from './dto/search-payment.dto';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { amount, method, ...paymentData } = createPaymentDto;

    // Validar monto mínimo según método de pago
    const minAmounts = {
      CASH: 1,
      CARD: 5,
      QR: 1,
      TRANSFER: 10,
    };

    if (amount < minAmounts[method]) {
      throw new BadRequestException(
        `El monto mínimo para ${method} es ${minAmounts[method]}`,
      );
    }

    // Generar referencia automática si no se proporciona
    const transaction_reference =
      paymentData.transaction_reference ||
      this.generateTransactionReference(method);

    const payment = this.paymentRepository.create({
      ...paymentData,
      amount,
      method,
      transaction_reference,
      payment_date: new Date(),
    });

    return this.paymentRepository.save(payment);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Payment>> {
    const { page = 1, limit = 10 } = paginationDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const total = await this.paymentRepository.count({
      where: { is_active: true },
    });

    const lastPage = Math.ceil(total / take);
    const hasNextPage = page < lastPage;
    const hasPrevPage = page > 1;

    const data = await this.paymentRepository.find({
      where: { is_active: true },
      relations: {
        tickets: {
          user: {
            profile: true,
          },
          trip: {
            route: {
              originCity: true,
              destinationCity: true,
            },
          },
          seat: true,
        },
      },
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage,
        limit: take,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, is_active: true },
      relations: {
        tickets: {
          user: {
            profile: true,
          },
          trip: {
            route: {
              originCity: true,
              destinationCity: true,
            },
            bus: true,
          },
          seat: true,
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`El pago con ID ${id} no existe`);
    }

    return payment;
  }

  async search(searchDto: SearchPaymentDto, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const {
      method,
      status,
      category,
      minAmount,
      maxAmount,
      fromDate,
      toDate,
      searchTerm,
    } = searchDto;

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.tickets', 'tickets')
      .leftJoinAndSelect('tickets.user', 'user')
      .where('payment.is_active = :active', { active: true });

    // Filtros opcionales
    if (method) {
      queryBuilder.andWhere('payment.method = :method', { method });
    }

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (category) {
      queryBuilder.andWhere('payment.category = :category', { category });
    }

    if (minAmount !== undefined) {
      queryBuilder.andWhere('payment.amount >= :minAmount', { minAmount });
    }

    if (maxAmount !== undefined) {
      queryBuilder.andWhere('payment.amount <= :maxAmount', { maxAmount });
    }

    if (fromDate) {
      queryBuilder.andWhere('payment.payment_date >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('payment.payment_date <= :toDate', { toDate });
    }

    if (searchTerm) {
      queryBuilder.andWhere(
        '(payment.transaction_reference ILIKE :searchTerm OR payment.notes ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` },
      );
    }

    const total = await queryBuilder.getCount();

    const data = await queryBuilder
      .orderBy('payment.created_at', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    const lastPage = Math.ceil(total / take);
    const hasNextPage = page < lastPage;
    const hasPrevPage = page > 1;

    return {
      data,
      meta: {
        total,
        page,
        lastPage,
        limit: take,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: {
        status,
        is_active: true,
      },
      relations: { tickets: true },
      order: { created_at: 'DESC' },
    });
  }

  async findByMethod(method: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: {
        method,
        is_active: true,
      },
      relations: { tickets: true },
      order: { created_at: 'DESC' },
    });
  }

  async findByDateRange(fromDate: Date, toDate: Date): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: {
        payment_date: Between(fromDate, toDate),
        is_active: true,
      },
      relations: { tickets: true },
      order: { payment_date: 'DESC' },
    });
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    // Verificar que el pago exists
    const existingPayment = await this.findOne(id);

    // Validaciones según el estado actual
    if (existingPayment.status === PaymentStatus.COMPLETED) {
      // Solo permitir ciertos cambios en pagos completados
      const allowedFields = ['notes', 'transaction_reference'];
      const hasRestrictedChanges = Object.keys(updatePaymentDto).some(
        (field) => !allowedFields.includes(field),
      );

      if (hasRestrictedChanges) {
        throw new BadRequestException(
          'Solo se pueden modificar notas y referencia en pagos completados',
        );
      }
    }

    if (existingPayment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException(
        'No se pueden modificar pagos reembolsados',
      );
    }

    // Validar cambio de monto si se proporciona
    if (updatePaymentDto.amount && existingPayment.tickets.length > 0) {
      throw new BadRequestException(
        'No se puede cambiar el monto de un pago que tiene tickets asociados',
      );
    }

    await this.paymentRepository.update(id, updatePaymentDto);

    return this.findOne(id);
  }

  async remove(id: string): Promise<Payment> {
    const payment = await this.findOne(id);

    // Verificar si tiene tickets asociados
    if (payment.tickets && payment.tickets.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar un pago que tiene tickets asociados',
      );
    }

    // Soft delete
    await this.paymentRepository.update(id, { is_active: false });

    return { ...payment, is_active: false };
  }

  async processPayment(id: string): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Solo se pueden procesar pagos pendientes');
    }

    // ====== SIMPLIFICADO PARA COMPRENSIÓN ======
    // Simulación BÁSICA: todos los pagos se aprueban automáticamente
    // En producción real, aquí irían las integraciones con pasarelas de pago

    let newStatus = PaymentStatus.COMPLETED;
    let notes = `Pago procesado exitosamente vía ${payment.method}`;

    // Simulación opcional: 5% de fallos aleatorios para pruebas
    const randomFail = Math.random() < 0.05; // 5% de probabilidad
    if (randomFail) {
      newStatus = PaymentStatus.FAILED;
      notes = `Fallo simulado en procesamiento de ${payment.method}`;
    }

    await this.paymentRepository.update(id, {
      status: newStatus,
      notes: payment.notes ? `${payment.notes}\n${notes}` : notes,
    });
    // ====================================

    return this.findOne(id);
  }

  async refundPayment(id: string, reason?: string): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Solo se pueden reembolsar pagos completados',
      );
    }

    // Calcular monto de reembolso según política
    let refundPercentage = 100;
    let refundAmount = payment.amount;

    //Validar tiempo de reserva de ticket
    if (payment.tickets && payment.tickets.length > 0) {
      const ticket = payment.tickets[0]; // Asumir un ticket por pago
      const hoursUntilDeparture =
        (new Date(ticket.trip.departure_time).getTime() -
          new Date().getTime()) /
        (1000 * 60 * 60);

      if (hoursUntilDeparture < 2) {
        throw new BadRequestException(
          'No se permiten reembolsos con menos de 2 horas de anticipación',
        );
      } else if (hoursUntilDeparture < 24) {
        refundPercentage = 50;
        refundAmount = payment.amount * 0.5;
      } else if (hoursUntilDeparture < 48) {
        refundPercentage = 80;
        refundAmount = payment.amount * 0.8;
      }
    }

    const refundNotes = reason
      ? `Reembolso (${refundPercentage}%): ${reason}. Monto: $${refundAmount.toFixed(2)}`
      : `Reembolso procesado (${refundPercentage}%). Monto: $${refundAmount.toFixed(2)}`;

    await this.paymentRepository.update(id, {
      status: PaymentStatus.REFUNDED,
      notes: payment.notes ? `${payment.notes}\n${refundNotes}` : refundNotes,
    });

    return this.findOne(id);
  }

  async getPaymentStatistics(fromDate?: Date, toDate?: Date) {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.is_active = :active', { active: true });

    if (fromDate) {
      queryBuilder.andWhere('payment.payment_date >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('payment.payment_date <= :toDate', { toDate });
    }

    const stats = await queryBuilder
      .select([
        'COUNT(*) as total_payments',
        `COUNT(CASE WHEN payment.status = '${PaymentStatus.COMPLETED}' THEN 1 END) as completed_payments`,
        `COUNT(CASE WHEN payment.status = '${PaymentStatus.PENDING}' THEN 1 END) as pending_payments`,
        `COUNT(CASE WHEN payment.status = '${PaymentStatus.FAILED}' THEN 1 END) as failed_payments`,
        `COUNT(CASE WHEN payment.status = '${PaymentStatus.REFUNDED}' THEN 1 END) as refunded_payments`,
        `SUM(CASE WHEN payment.status = '${PaymentStatus.COMPLETED}' THEN payment.amount ELSE 0 END) as total_revenue`,
        `AVG(CASE WHEN payment.status = '${PaymentStatus.COMPLETED}' THEN payment.amount END) as average_payment`,
      ])
      .getRawOne();

    const methodStats = await queryBuilder
      .select([
        'payment.method',
        'COUNT(*) as count',
        'SUM(payment.amount) as total',
      ])
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .groupBy('payment.method')
      .getRawMany();

    return {
      overview: {
        totalPayments: parseInt(stats.total_payments) || 0,
        completedPayments: parseInt(stats.completed_payments) || 0,
        pendingPayments: parseInt(stats.pending_payments) || 0,
        failedPayments: parseInt(stats.failed_payments) || 0,
        refundedPayments: parseInt(stats.refunded_payments) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        averagePayment: parseFloat(stats.average_payment) || 0,
      },
      byMethod: methodStats.map((stat) => ({
        method: stat.payment_method,
        count: parseInt(stat.count),
        total: parseFloat(stat.total),
      })),
    };
  }

  // Métodos auxiliares privados
  private generateTransactionReference(method: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${method}-${timestamp}-${random}`;
  }

  //Para evitar que un pago esté pendiente para siempre
  @Cron('0 * * * *') // Cada hora
  async expirePendingPayments() {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() - 24); // 24 horas

    const expiredPayments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.PENDING,
        created_at: LessThan(expirationTime),
        is_active: true,
      },
    });

    for (const payment of expiredPayments) {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
        notes: payment.notes
          ? `${payment.notes}\nPago expirado automáticamente por tiempo`
          : 'Pago expirado automáticamente por tiempo',
      });
    }
  }
}
