const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  

export const fetchBuses = async () => {
  try {
    const response = await fetch(`${API_URL}/buses?limit=100`);
    const data = await response.json();
    setBuses(data.data || []);
  } catch (error) {
    console.error("Error al cargar buses:", error);
  }
};

export const fetchRoutes = async () => {
  try {
    const response = await fetch(`${API_URL}/routes?limit=100`);
    const data = await response.json();
    setRoutes(data.data || []);
  } catch (error) {
    console.error("Error al cargar rutas:", error);
  }
};

export const handleSubmit = async () => {
  try {
    const url =
      modalMode === "create"
        ? `${API_URL}/trips`
        : `${API_URL}/trips/${selectedTrip.id}`;

    const method = modalMode === "create" ? "POST" : "PATCH";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al guardar");
    }

    showAlert(
      modalMode === "create"
        ? "Viaje creado exitosamente"
        : "Viaje actualizado exitosamente"
    );

    setIsModalOpen(false);
    fetchTrips();
  } catch (error) {
    showAlert(error.message, "error");
  }
};

export const handleDelete = async (id) => {
  if (!confirm("¿Estás seguro de eliminar este viaje?")) return;

  try {
    const response = await fetch(`${API_URL}/trips/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al eliminar");
    }

    showAlert("Viaje eliminado exitosamente");
    fetchTrips();
  } catch (error) {
    showAlert(error.message, "error");
  }
};

export const handleStatusChange = async (id, action) => {
  try {
    const response = await fetch(`${API_URL}/trips/${id}/${action}`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al actualizar estado");
    }

    showAlert(
      `Viaje ${
        action === "start"
          ? "iniciado"
          : action === "complete"
          ? "completado"
          : "cancelado"
      } exitosamente`
    );
    fetchTrips();
  } catch (error) {
    showAlert(error.message, "error");
  }
};

export const fetchTrips = async () => {
  try {
    setLoading(true);
    const response = await fetch(
      `${API_URL}/trips?page=${pagination.page}&limit=${pagination.limit}`
    );
    const data = await response.json();
    setTrips(data.data || []);
    setPagination((prev) => ({ ...prev, total: data.meta?.total || 0 }));
  } catch (error) {
    showAlert("Error al cargar los viajes", "error");
  } finally {
    setLoading(false);
  }
};
