import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Payment } from '../payment/entities/payment.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Trip } from '../trip/entities/trip.entity';
import { UserProfile } from 'src/modules/admin/user-profile/entities/user-profile.entity';
import { PaymentStatus, PaymentMethod, TicketStatus } from 'src/common/enums/status.enum';

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
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      { apiVersion: '2024-11-20.acacia' }
    );
  }

  /**
   * Crear sesión de pago para tickets
   */
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

    // Validar usuario
    const userProfile = await this.userProfileRepository.findOne({
      where: { id: userProfileId, isActive: true }
    });

    if (!userProfile) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar que los viajes y asientos existan
    for (const ticket of tickets) {
      const trip = await this.tripRepository.findOne({
        where: { id: ticket.tripId, is_active: true },
        relations: ['route', 'bus']
      });

      if (!trip) {
        throw new NotFoundException(`Viaje ${ticket.tripId} no encontrado`);
      }

      if (trip.available_seats <= 0) {
        throw new BadRequestException(`El viaje ${trip.route.name} no tiene asientos disponibles`);
      }
    }

    // Calcular total
    const totalAmount = tickets.reduce((sum, t) => sum + t.price, 0);

    // Crear line items para Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = tickets.map((ticket, index) => ({
      price_data: {
        currency: 'bob', // Bolivianos (o 'usd' si prefieres)
        product_data: {
          name: `Boleto de Bus - Asiento ${ticket.seatId}`,
          description: `Categoría: ${ticket.category}`,
        },
        unit_amount: Math.round(ticket.price * 100), // Stripe usa centavos
      },
      quantity: 1,
    }));

    // Crear metadata para recuperar info después
    const metadata = {
      userProfileId,
      ticketData: JSON.stringify(tickets),
    };

    // Crear sesión de Stripe
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata,
      customer_email: userProfile.email,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // Expira en 30 minutos
    });

    return {
      sessionId: session.id,
      url: session.url,
      expiresAt: new Date(session.expires_at * 1000),
    };
  }

  /**
   * Verificar pago completado y crear tickets
   */
  async handleSuccessfulPayment(sessionId: string) {
    // Obtener sesión de Stripe
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('El pago no ha sido completado');
    }

    // Verificar que no se haya procesado antes
    const existingPayment = await this.paymentRepository.findOne({
      where: { transaction_id: sessionId }
    });

    if (existingPayment) {
      throw new BadRequestException('Este pago ya fue procesado');
    }

    const metadata = session.metadata;
    const userProfileId = metadata.userProfileId;
    const ticketData = JSON.parse(metadata.ticketData);

    const userProfile = await this.userProfileRepository.findOne({
      where: { id: userProfileId }
    });

    // Crear registro de pago
    const payment = this.paymentRepository.create({
      amount: session.amount_total / 100, // Convertir de centavos
      method: PaymentMethod.CARD,
      status: PaymentStatus.COMPLETED,
      transaction_id: sessionId,
      payment_date: new Date(),
      userProfile,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Crear tickets
    const createdTickets = [];
    for (const ticketInfo of ticketData) {
      const trip = await this.tripRepository.findOne({
        where: { id: ticketInfo.tripId },
        relations: ['bus', 'route']
      });

      // Generar código único de ticket
      const ticketCode = await this.generateTicketCode();

      const ticket = this.ticketRepository.create({
        code: ticketCode,
        price: ticketInfo.price,
        status: TicketStatus.CONFIRMED, // Confirmado inmediatamente
        trip: trip,
        seat: { id: ticketInfo.seatId },
        userProfile: userProfile,
        payment: savedPayment,
        booking_date: new Date(),
        is_active: true,
      });

      const savedTicket = await this.ticketRepository.save(ticket);
      createdTickets.push(savedTicket);

      // Actualizar asientos disponibles del viaje
      await this.tripRepository.decrement(
        { id: ticketInfo.tripId },
        'available_seats',
        1
      );
    }

    return {
      payment: savedPayment,
      tickets: createdTickets,
    };
  }

  /**
   * Webhook para procesar eventos de Stripe
   */
  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
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
        // Liberar asientos reservados si es necesario
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
      relations: ['tickets']
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Solo se pueden reembolsar pagos completados');
    }

    // Crear reembolso en Stripe
    const refund = await this.stripe.refunds.create({
      payment_intent: payment.transaction_id,
      reason: reason || 'requested_by_customer',
    });

    // Actualizar estado del pago
    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.REFUNDED
    });

    // Cancelar tickets asociados
    for (const ticket of payment.tickets) {
      await this.ticketRepository.update(ticket.ticket_id, {
        status: TicketStatus.CANCELLED,
        is_active: false
      });
    }

    return {
      refund,
      payment,
    };
  }

  /**
   * Generar código único de ticket
   */
  private async generateTicketCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.ticketRepository.count() + 1;
    return `TCK-${year}-${count.toString().padStart(6, '0')}`;
  }
}