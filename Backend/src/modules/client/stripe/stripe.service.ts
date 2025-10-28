import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Payment } from '../payment/entities/payment.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Trip } from '../trip/entities/trip.entity';
import { UserProfile } from 'src/modules/admin/user-profile/entities/user-profile.entity';
import {
  PaymentStatus,
  PaymentMethod,
  TicketStatus,
  SeatStatus,
} from 'src/common/enums/status.enum';
import { Seat } from '../seat/entities/seat.entity';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY no está configurada en .env');
    }

    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-09-30.clover',
    });
  }

  /**
   * Crear sesión de pago para tickets
   */
  // REEMPLAZAR desde la línea 52 hasta la 88:

  async createCheckoutSession(data: {
    tickets: Array<{
      tripId: string;
      seatId: string;
      price: number;
      category: string;
    }>;
    userProfileId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const { tickets, userProfileId, successUrl, cancelUrl } = data;

    // ✅ CORRECCIÓN: Validar usuario CON relación User
    const userProfile = await this.userProfileRepository.findOne({
      where: { id: userProfileId, isActive: true },
      // NO necesitas relación 'user' aquí, solo accedes a campos del profile
    });

    if (!userProfile) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // ✅ CORRECCIÓN: Validar que tenga al menos UN dato de contacto
    if (
      !userProfile.email &&
      !userProfile.phone &&
      !userProfile.documentNumber
    ) {
      throw new BadRequestException(
        'El perfil debe tener al menos email, teléfono o documento para procesar el pago',
      );
    }

    // Validar que los viajes y asientos existan
    for (const ticket of tickets) {
      const trip = await this.tripRepository.findOne({
        where: { id: ticket.tripId, is_active: true },
        relations: ['route', 'bus'],
      });

      if (!trip) {
        throw new NotFoundException(`Viaje ${ticket.tripId} no encontrado`);
      }

      if (trip.available_seats <= 0) {
        throw new BadRequestException(`El viaje no tiene asientos disponibles`);
      }
    }

    // Crear line items para Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      tickets.map((ticket) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Boleto de Bus`,
            description: `Pasajero: ${userProfile.firstName || 'Invitado'} ${userProfile.lastName || ''} - Categoría: ${ticket.category}`,
          },
          unit_amount: Math.round(ticket.price * 100),
        },
        quantity: 1,
      }));

    // Crear metadata para recuperar info después
    const metadata = {
      userProfileId,
      ticketData: JSON.stringify(tickets),
    };

    // ✅ CORRECCIÓN: Generar email para Stripe
    let customerEmail: string | undefined = undefined;

    if (userProfile.email) {
      // Usar email del perfil directamente
      customerEmail = userProfile.email;
    } else if (userProfile.phone) {
      // Si solo tiene teléfono, generar email temporal
      customerEmail = `guest.${userProfile.phone.replace(/[^0-9]/g, '')}@transarka.local`;
    } else if (userProfile.documentNumber) {
      // Si solo tiene documento, usar eso
      customerEmail = `guest.${userProfile.documentNumber.replace(/[^0-9A-Za-z]/g, '')}@transarka.local`;
    }

    // Crear sesión de Stripe
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata,
      customer_email: customerEmail, // Puede ser undefined si no hay datos
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    return {
      sessionId: session.id,
      url: session.url,
      expiresAt: new Date(session.expires_at * 1000),
    };
  }

  /**
   * Crear Payment Intent para formulario embebido
   */
  async createPaymentIntent(data: {
    tickets: Array<{
      tripId: string;
      seatId: string;
      price: number;
      category: string;
    }>;
    userProfileId: string;
  }) {
    const { tickets, userProfileId } = data;

    // Validar usuario
    const userProfile = await this.userProfileRepository.findOne({
      where: { id: userProfileId, isActive: true },
    });

    if (!userProfile) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Calcular monto total
    const totalAmount = tickets.reduce((sum, ticket) => sum + ticket.price, 0);

    // Crear Payment Intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convertir a centavos
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userProfileId,
        ticketData: JSON.stringify(tickets),
      },
      description: `Compra de ${tickets.length} ticket(s) de bus`,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
    };
  }

  /**
   * ✅ CORREGIDO: Confirmar pago y crear tickets después de Payment Intent exitoso
   */
  async confirmPaymentIntent(paymentIntentId: string) {
    try {
      console.log('🔍 Confirmando Payment Intent:', paymentIntentId);

      // 1. Obtener Payment Intent de Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
      );

      console.log('📄 Payment Intent status:', paymentIntent.status);

      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException(
          `El pago no ha sido completado. Estado: ${paymentIntent.status}`,
        );
      }

      // 2. Verificar que no se haya procesado antes
      const existingPayment = await this.paymentRepository.findOne({
        where: { transaction_id: paymentIntentId },
        relations: ['tickets'],
      });

      if (existingPayment) {
        console.log('⚠️ Pago ya procesado anteriormente');
        return {
          payment: existingPayment,
          tickets: existingPayment.tickets || [],
          message: 'Este pago ya fue procesado anteriormente',
        };
      }

      // 3. Validar metadata
      const metadata = paymentIntent.metadata;
      
      if (!metadata || !metadata.userProfileId || !metadata.ticketData) {
        console.error('❌ Metadata inválida:', metadata);
        throw new BadRequestException(
          'Información de pago incompleta. Por favor contacta soporte.',
        );
      }

      const userProfileId = metadata.userProfileId;
      let ticketData;

      try {
        ticketData = JSON.parse(metadata.ticketData);
      } catch (err) {
        console.error('❌ Error al parsear ticketData:', err);
        throw new BadRequestException('Datos de tickets inválidos');
      }

      console.log('👤 User Profile ID:', userProfileId);
      console.log('🎫 Tickets a crear:', ticketData.length);

      // 4. Obtener usuario
      const userProfile = await this.userProfileRepository.findOne({
        where: { id: userProfileId, isActive: true },
      });

      if (!userProfile) {
        throw new NotFoundException(`Usuario ${userProfileId} no encontrado`);
      }

      // 5. Transacción para garantizar atomicidad
      const queryRunner =
        this.paymentRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 6. Crear registro de pago
        const payment = queryRunner.manager.create(Payment, {
          amount: paymentIntent.amount / 100, // Convertir de centavos
          method: PaymentMethod.CARD,
          status: PaymentStatus.COMPLETED,
          transaction_id: paymentIntentId,
          payment_date: new Date(),
          userProfile,
          category: 'adulto',
        });

        const savedPayment = await queryRunner.manager.save(Payment, payment);
        console.log('✅ Pago guardado:', savedPayment.id);

        // 7. Crear tickets
        const createdTickets: Ticket[] = [];

        for (const ticketInfo of ticketData) {
          console.log('🎫 Procesando ticket para asiento:', ticketInfo.seatId);

          // ✅ SOLUCIÓN: Primero hacer el lock SIN relaciones
          const trip = await queryRunner.manager.findOne(Trip, {
            where: { id: ticketInfo.tripId, is_active: true },
            lock: { mode: 'pessimistic_write' },
          });

          if (!trip) {
            throw new NotFoundException(
              `Viaje ${ticketInfo.tripId} no encontrado`,
            );
          }

          // ✅ DESPUÉS cargar las relaciones (sin lock)
          const tripWithRelations = await queryRunner.manager.findOne(Trip, {
            where: { id: ticketInfo.tripId },
            relations: ['bus', 'route'],
          });

          if (trip.available_seats <= 0) {
            throw new BadRequestException(
              `El viaje no tiene asientos disponibles`,
            );
          }

          // Verificar que el asiento existe y está disponible
          const seat = await queryRunner.manager.findOne(Seat, {
            where: { id: ticketInfo.seatId },
          });

          if (!seat) {
            throw new NotFoundException(
              `Asiento ${ticketInfo.seatId} no encontrado`,
            );
          }

          if (seat.status !== SeatStatus.AVAILABLE) {
            throw new BadRequestException(
              `El asiento ${seat.seat_code} ya no está disponible`,
            );
          }

          // Generar código único de ticket
          const ticketCode = await this.generateTicketCode(queryRunner.manager);

          // Crear ticket
          const ticket = queryRunner.manager.create(Ticket, {
            code: ticketCode,
            price: ticketInfo.price,
            status: TicketStatus.CONFIRMED,
            trip: trip,
            seat: seat,
            userProfile: userProfile,
            payment: savedPayment,
            booking_date: new Date(),
            is_active: true,
          });

          const savedTicket = await queryRunner.manager.save(Ticket, ticket);
          console.log('✅ Ticket creado:', savedTicket.code);
          createdTickets.push(savedTicket);

          // Actualizar estado del asiento
          await queryRunner.manager.update(
            Seat,
            { id: ticketInfo.seatId },
            { status: SeatStatus.OCCUPIED },
          );

          // Actualizar asientos disponibles del viaje
          await queryRunner.manager.decrement(
            Trip,
            { id: ticketInfo.tripId },
            'available_seats',
            1,
          );
        }

        await queryRunner.commitTransaction();
        console.log('✅ Transacción completada. Tickets creados:', createdTickets.length);

        return {
          payment: savedPayment,
          tickets: createdTickets,
          message: 'Pago confirmado exitosamente',
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error('❌ Error en transacción:', error);
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      console.error('❌ Error en confirmPaymentIntent:', error);
      
      // Proporcionar mensajes de error más específicos
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        `Error al confirmar el pago: ${error.message || 'Error desconocido'}`,
      );
    }
  }

  /**
   * Verificar pago completado y crear tickets
   */
  async handleSuccessfulPayment(sessionId: string) {
    // Obtener sesión de Stripe
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('El pago no ha sido completado');
    }

    // Verificar que no se haya procesado antes
    const existingPayment = await this.paymentRepository.findOne({
      where: { transaction_id: sessionId },
      relations: ['tickets'],
    });

    if (existingPayment) {
      return {
        payment: existingPayment,
        tickets: existingPayment.tickets || [],
        message: 'Este pago ya fue procesado anteriormente',
      };
    }

    // ✅ FIX: Validar metadata
    if (!session.metadata) {
      throw new BadRequestException('Metadata de sesión no encontrada');
    }

    const metadata = session.metadata;
    const userProfileId = metadata.userProfileId;
    const ticketData = JSON.parse(metadata.ticketData);

    // ✅ FIX: Validar amount_total
    if (!session.amount_total) {
      throw new BadRequestException('Monto de pago no encontrado');
    }

    const userProfile = await this.userProfileRepository.findOne({
      where: { id: userProfileId },
    });

    if (!userProfile) {
      throw new NotFoundException(`Usuario ${userProfileId} no encontrado`);
    }

    // Transacción para garantizar atomicidad
    const queryRunner =
      this.paymentRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear registro de pago
      const payment = queryRunner.manager.create(Payment, {
        amount: session.amount_total / 100,
        method: PaymentMethod.CARD,
        status: PaymentStatus.COMPLETED,
        transaction_id: sessionId,
        payment_date: new Date(),
        userProfile,
      });

      const savedPayment = await queryRunner.manager.save(Payment, payment);

      // Crear tickets
      const createdTickets: Ticket[] = []; // ✅ FIX: Tipar el array

      for (const ticketInfo of ticketData) {
        const trip = await queryRunner.manager.findOne(Trip, {
          where: { id: ticketInfo.tripId },
          relations: ['bus', 'route'],
          lock: { mode: 'pessimistic_write' },
        });

        if (!trip) {
          throw new NotFoundException(
            `Viaje ${ticketInfo.tripId} no encontrado`,
          );
        }

        if (trip.available_seats <= 0) {
          throw new BadRequestException(
            `El viaje no tiene asientos disponibles`,
          );
        }

        // Generar código único de ticket
        const ticketCode = await this.generateTicketCode(queryRunner.manager);

        const ticket = queryRunner.manager.create(Ticket, {
          code: ticketCode,
          price: ticketInfo.price,
          status: TicketStatus.CONFIRMED,
          trip: trip,
          seat: { id: ticketInfo.seatId } as any,
          userProfile: userProfile,
          payment: savedPayment,
          booking_date: new Date(),
          is_active: true,
        });

        const savedTicket = await queryRunner.manager.save(Ticket, ticket);
        createdTickets.push(savedTicket); // ✅ FIX: Ahora funciona

        // Actualizar estado del asiento
        await queryRunner.manager.update(
          Seat,
          { id: ticketInfo.seatId },
          { status: SeatStatus.OCCUPIED },
        );

        // Actualizar asientos disponibles del viaje
        await queryRunner.manager.decrement(
          Trip,
          { id: ticketInfo.tripId },
          'available_seats',
          1,
        );
      }

      await queryRunner.commitTransaction();

      return {
        payment: savedPayment,
        tickets: createdTickets,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Webhook para procesar eventos de Stripe
   */
  async handleWebhook(signature: string, rawBody: Buffer) {
    // ✅ FIX: Validar que el webhook secret existe
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      console.warn(
        '⚠️ STRIPE_WEBHOOK_SECRET no configurado. En desarrollo, procesando sin validación.',
      );

      // ✅ En desarrollo, parsear el body directamente
      // NOTA: Esto NO es seguro para producción
      try {
        const event = JSON.parse(rawBody.toString());

        // Procesar el evento sin validar firma
        switch (event.type) {
          case 'checkout.session.completed':
            const session = event.data.object;
            await this.handleSuccessfulPayment(session.id);
            break;

          case 'checkout.session.expired':
            console.log(`❌ Sesión expirada: ${event.data.object.id}`);
            break;

          default:
            console.log(`⚠️ Evento no manejado: ${event.type}`);
        }

        return {
          received: true,
          warning: 'Webhook sin validación (desarrollo)',
        };
      } catch (err) {
        throw new BadRequestException(
          `Error al procesar webhook: ${err.message}`,
        );
      }
    }

    // Flujo normal con validación (para producción)
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${err.message}`,
      );
    }

    // Manejar diferentes eventos
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleSuccessfulPayment(session.id);
        break;

      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session;
        console.log(`❌ Sesión expirada: ${expiredSession.id}`);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log(`❌ Pago fallido: ${failedPayment.id}`);
        break;

      default:
        console.log(`⚠️ Evento no manejado: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Crear reembolso
   */
  async createRefund(paymentId: string, reason?: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['tickets'],
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Solo se pueden reembolsar pagos completados',
      );
    }

    if (!payment.transaction_id) {
      throw new BadRequestException(
        'El pago no tiene un ID de transacción de Stripe',
      );
    }

    // ✅ FIX: Usar refund correcto
    const refund = await this.stripe.refunds.create({
      payment_intent: payment.transaction_id,
    });

    // Actualizar estado del pago
    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.REFUNDED,
    });

    // Cancelar tickets asociados
    if (payment.tickets) {
      for (const ticket of payment.tickets) {
        await this.ticketRepository.update(ticket.ticket_id, {
          status: TicketStatus.CANCELLED,
          is_active: false,
        });
      }
    }

    return {
      refund,
      payment,
    };
  }

  /**
   * Generar código único de ticket
   */
  private async generateTicketCode(manager: any): Promise<string> {
    const year = new Date().getFullYear();

    const count = await manager
      .createQueryBuilder(Ticket, 'ticket')
      .where('EXTRACT(YEAR FROM ticket.created_at) = :year', { year })
      .getCount();

    const nextNumber = count + 1;
    const code = `TCK-${year}-${nextNumber.toString().padStart(6, '0')}`;

    // Verificar que no exista
    const existing = await manager.findOne(Ticket, {
      where: { code },
    });

    if (existing) {
      // Si existe, obtener el último y sumar 1
      const lastTicket = await manager
        .createQueryBuilder(Ticket, 'ticket')
        .where('EXTRACT(YEAR FROM ticket.created_at) = :year', { year })
        .orderBy('ticket.created_at', 'DESC')
        .getOne();

      if (lastTicket) {
        const lastNumber = parseInt(lastTicket.code.split('-')[2]);
        return `TCK-${year}-${(lastNumber + 1).toString().padStart(6, '0')}`;
      }
    }

    return code;
  }
}
