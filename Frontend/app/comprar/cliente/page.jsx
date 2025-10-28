"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { 
  User, 
  Phone, 
  MapPin, 
  AlertCircle, 
  ArrowLeft,
  ArrowRight,
  Clock,
  Search,
  CheckCircle,
  Mail,
  CreditCard
} from "lucide-react";

const API_BASE = "http://localhost:3001/api/v1";

export default function ClienteRegistroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId");

  const [backendError, setBackendError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [trip, setTrip] = useState(null);
  
  const [step, setStep] = useState("search");
  const [searchIdentifier, setSearchIdentifier] = useState("");
  const [foundProfile, setFoundProfile] = useState(null);
  const [useExisting, setUseExisting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm();

  useEffect(() => {
    if (!tripId) {
      toast.error("No se seleccionó ningún viaje");
      router.push("/salidas");
      return;
    }

    const loadTrip = async () => {
      try {
        const res = await fetch(`${API_BASE}/trips/${tripId}`);
        if (!res.ok) throw new Error("Viaje no encontrado");
        const data = await res.json();
        setTrip(data);
      } catch (error) {
        toast.error("Error al cargar información del viaje");
        router.push("/salidas");
      }
    };

    loadTrip();
  }, [tripId, router]);

  const handleSearch = async () => {
    if (!searchIdentifier.trim()) {
      toast.error("Ingresa tu documento o teléfono");
      return;
    }

    try {
      setSearching(true);
      setBackendError(null);

      const res = await fetch(
        `${API_BASE}/clients/search?identifier=${encodeURIComponent(searchIdentifier.trim())}`
      );

      if (!res.ok) {
        throw new Error("Error al buscar perfil");
      }

      const data = await res.json();

      if (data.exists && data.profile) {
        setFoundProfile(data.profile);
        setUseExisting(true);
        
        setValue("firstName", data.profile.firstName || "");
        setValue("lastName", data.profile.lastName || "");
        setValue("documentNumber", data.profile.documentNumber || "");
        setValue("phone", data.profile.phone || "");
        setValue("email", data.profile.email || "");
        setValue("address", data.profile.address || "");
        
        toast.success("¡Encontramos tu información!");
        setStep("form");
      } else {
        setFoundProfile(null);
        setUseExisting(false);
        
        const isPhone = /^(\+\d{1,4})?[\s\-]?\d{6,15}$/.test(searchIdentifier);
        const isDocument = /^\d{7,10}(-[0-9A-Za-z]{1,3})?$/.test(searchIdentifier);
        
        if (isDocument) {
          setValue("documentNumber", searchIdentifier.trim().toUpperCase());
        } else if (isPhone) {
          setValue("phone", searchIdentifier.trim());
        }
        
        toast.info("No encontramos tu información. Por favor completa el formulario.");
        setStep("form");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error al buscar. Intenta nuevamente.");
    } finally {
      setSearching(false);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);
      setBackendError(null);

      const endpoint = useExisting 
        ? `${API_BASE}/clients/create-or-update`
        : `${API_BASE}/clients`;

      const clientRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const clientData = await clientRes.json();

      if (!clientRes.ok) {
        throw new Error(clientData.message || "Error al registrar cliente");
      }

      sessionStorage.setItem("purchaseClient", JSON.stringify(clientData));

      toast.success(
        useExisting 
          ? "Datos actualizados correctamente" 
          : "Datos registrados correctamente"
      );

      router.push(`/comprar/asientos?tripId=${tripId}&clientId=${clientData.id}`);
    } catch (err) {
      console.error("Error:", err);
      setBackendError(err.message || "Error al procesar los datos");
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  });

  const handleBackToSearch = () => {
    setStep("search");
    setFoundProfile(null);
    setUseExisting(false);
    setSearchIdentifier("");
    reset();
  };

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/salidas")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a salidas
          </Button>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    {trip.route.name}
                  </h2>
                  <div className="flex items-center gap-4 text-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Salida: {new Date(trip.departure_time).toLocaleString("es-ES")}
                    </span>
                    <span>Bus: {trip.bus?.plate}</span>
                    <span className="font-bold text-white">
                      Bs. {parseFloat(trip.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {step === "search" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Search className="h-6 w-6 text-green-600" />
                ¿Ya compraste con nosotros?
              </CardTitle>
              <CardDescription>
                Ingresa tu documento o teléfono para buscar tu información guardada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">
                    Documento de Identidad o Teléfono
                  </Label>
                  <div className="flex gap-3 mt-2">
                    <Input
                      value={searchIdentifier}
                      onChange={(e) => setSearchIdentifier(e.target.value)}
                      placeholder="Ej: 12345678 o +59170123456"
                      className="text-lg"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={searching || !searchIdentifier.trim()}
                      className="bg-green-600 hover:bg-green-700 px-8"
                      size="lg"
                    >
                      {searching ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="h-5 w-5 mr-2" />
                          Buscar
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Si no tienes cuenta, no te preocupes, podrás crear una nueva.
                  </p>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>¿Por qué pedimos esto?</strong> Para hacer tu compra más rápida 
                  y evitar que ingreses tus datos cada vez.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {step === "form" && (
          <Card>
            <CardHeader>
              {foundProfile ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <CardTitle className="text-2xl">¡Bienvenido de nuevo!</CardTitle>
                  </div>
                  <CardDescription>
                    Encontramos tu información. Puedes editarla si es necesario antes de continuar.
                  </CardDescription>
                  <Alert className="bg-green-50 border-green-200 mt-4">
                    <User className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>{foundProfile.firstName} {foundProfile.lastName}</strong>
                      <br />
                      CI: {foundProfile.documentNumber} | Tel: {foundProfile.phone}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Completa tus Datos</CardTitle>
                  <CardDescription>
                    No encontramos tu información. Por favor completa el formulario para continuar.
                  </CardDescription>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                    <User className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Información Personal</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nombres *
                      </Label>
                      <Input
                        {...register("firstName", {
                          required: "Los nombres son obligatorios",
                          minLength: { value: 2, message: "Mínimo 2 caracteres" },
                          maxLength: { value: 100, message: "Máximo 100 caracteres" },
                        })}
                        placeholder="Juan Carlos"
                        className="mt-1"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Apellidos *
                      </Label>
                      <Input
                        {...register("lastName", {
                          required: "Los apellidos son obligatorios",
                          minLength: { value: 3, message: "Mínimo 3 caracteres" },
                          maxLength: { value: 100, message: "Máximo 100 caracteres" },
                        })}
                        placeholder="Pérez López"
                        className="mt-1"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        CI *
                      </Label>
                      <Input
                        {...register("documentNumber", {
                          required: "El C.I. es obligatorio",
                          pattern: {
                            value: /^\d{7,10}(-[0-9A-Za-z]{1,3})?$/,
                            message: "Ejemplo: 8502732 o 8502732-1A",
                          },
                        })}
                        placeholder="12345678"
                        className="mt-1"
                        disabled={useExisting}
                      />
                      {errors.documentNumber && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.documentNumber.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Teléfono *
                      </Label>
                      <Input
                        type="tel"
                        {...register("phone", {
                          required: "El teléfono es obligatorio",
                          pattern: {
                            value: /^(\+\d{1,4})?[\s\-]?\d{6,15}$/,
                            message: "Ejemplo: +59170123456 o 70123456",
                          },
                        })}
                        placeholder="+59170123456"
                        className="mt-1"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email 
                      </Label>
                      <Input
                        type="email"
                        {...register("email", {
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Email inválido",
                          },
                        })}
                        placeholder="ejemplo@email.com"
                        className="mt-1"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Dirección (opcional)
                      </Label>
                      <Input
                        {...register("address", {
                          maxLength: { value: 200, message: "Máximo 200 caracteres" },
                        })}
                        placeholder="Av. Principal #123"
                        className="mt-1"
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.address.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {backendError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{backendError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToSearch}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Buscar
                  </Button>
                  <Button
                    onClick={onSubmit}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      "Procesando..."
                    ) : (
                      <>
                        {useExisting ? "Actualizar y Continuar" : "Continuar"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}