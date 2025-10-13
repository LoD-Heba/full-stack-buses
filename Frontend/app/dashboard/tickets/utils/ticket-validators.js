/**
 * Validadores para tickets
 */

export function canConfirmTicket(ticket) {
  if (!ticket) return { valid: false, reason: "Ticket no válido" };
  
  if (ticket.status === "CONFIRMADO") {
    return { valid: false, reason: "El ticket ya está confirmado" };
  }
  
  if (ticket.status === "CANCELADO") {
    return { valid: false, reason: "No se puede confirmar un ticket cancelado" };
  }
  
  return { valid: true };
}

export function canCancelTicket(ticket) {
  if (!ticket) return { valid: false, reason: "Ticket no válido" };
  
  if (ticket.status === "CANCELADO") {
    return { valid: false, reason: "El ticket ya está cancelado" };
  }
  
  // Verificar si el viaje ya comenzó
  const departureTime = new Date(ticket.departure_time);
  if (departureTime <= new Date()) {
    return { 
      valid: false, 
      reason: "No se puede cancelar un ticket de un viaje que ya comenzó" 
    };
  }
  
  return { valid: true };
}

export function canDeleteTicket(ticket) {
  if (!ticket) return { valid: false, reason: "Ticket no válido" };
  
  if (ticket.status === "CONFIRMADO") {
    return { 
      valid: false, 
      reason: "No se puede eliminar un ticket confirmado. Use la opción de cancelar." 
    };
  }
  
  return { valid: true };
}

export function getTicketStatusColor(status) {
  const colors = {
    PENDIENTE: "yellow",
    CONFIRMADO: "green",
    CANCELADO: "red",
  };
  return colors[status] || "gray";
}

export function getTicketStatusLabel(status) {
  const labels = {
    PENDIENTE: "Pendiente",
    CONFIRMADO: "Confirmado",
    CANCELADO: "Cancelado",
  };
  return labels[status] || status;
}