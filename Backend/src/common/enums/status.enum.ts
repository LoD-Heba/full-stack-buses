export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TicketStatus {
  CONFIRMED = 'CONFIRMADO',
  PENDING = 'PENDIENTE',
  CANCELLED = 'CANCELADO',
}
// ====== PAYMENT ======
export enum PaymentStatus {
  PENDING = 'PENDIENTE',
  COMPLETED = 'COMPLETO',
  FAILED = 'FALLIDO',
  REFUNDED = 'REEMBOLZO',
}

export enum PaymentMethod {
  CASH = 'EFECTIVO',
  CARD = 'TARJETA',
  QR = 'QR',
  TRANSFER = 'TRANSFERENCIA',
}

export enum PaymentCategory {
  CHILD = 'niño',
  ADULT = 'adulto',
  SENIOR = 'adulto_mayor',
  STUDENT = 'estudiante',
}

export enum SeatStatus {
  AVAILABLE = 'disponible',
  RESERVED = 'reservado',
  OCCUPIED = 'ocupado',
  BLOCKED = 'bloqueado',
}
