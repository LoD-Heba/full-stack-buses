"use client";
import { useState } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  MessageSquare,
  Facebook,
  Instagram,
  Twitter
} from "lucide-react";

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    mensaje: ""
  });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    
    // Simular envío
    setTimeout(() => {
      setMensaje("¡Mensaje enviado con éxito! Nos contactaremos contigo pronto.");
      setEnviando(false);
      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        asunto: "",
        mensaje: ""
      });
      
      setTimeout(() => setMensaje(""), 5000);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: Phone,
      titulo: "Teléfono",
      contenido: "+591 62984081",
      enlace: "tel:+59162984081"
    },
    {
      icon: Mail,
      titulo: "Email",
      contenido: "info@transsacaba.com",
      enlace: "mailto:info@transsacaba.com"
    },
    {
      icon: MapPin,
      titulo: "Dirección",
      contenido: "Av. Principal Km 5, Sacaba, Cochabamba",
      enlace: "https://maps.google.com"
    },
    {
      icon: Clock,
      titulo: "Horario",
      contenido: "Lunes a Domingo, 24 horas",
      enlace: null
    }
  ];

  const redesSociales = [
    { icon: Facebook, nombre: "Facebook", enlace: "#", color: "hover:text-blue-600" },
    { icon: Instagram, nombre: "Instagram", enlace: "#", color: "hover:text-pink-600" },
    { icon: Twitter, nombre: "Twitter", enlace: "#", color: "hover:text-blue-400" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-5xl font-bold mb-4">Contáctanos</h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Estamos aquí para ayudarte. Envíanos tu consulta y te responderemos lo antes posible.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Formulario de Contacto */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Envíanos un Mensaje</h2>
            
            {mensaje && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {mensaje}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="Tu nombre"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="+591 00000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Asunto *
                </label>
                <input
                  type="text"
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="¿En qué podemos ayudarte?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mensaje *
                </label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Mensaje
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Información de Contacto</h2>
              
              <div className="space-y-6">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">{item.titulo}</h3>
                      {item.enlace ? (
                        <a
                          href={item.enlace}
                          className="text-gray-600 hover:text-green-600 transition"
                        >
                          {item.contenido}
                        </a>
                      ) : (
                        <p className="text-gray-600">{item.contenido}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="bg-gradient-to-br from-green-600 to-green-500 rounded-2xl shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Síguenos en Redes Sociales</h3>
              <p className="text-green-100 mb-6">
                Mantente actualizado con nuestras últimas noticias, promociones y destinos.
              </p>
              <div className="flex gap-4">
                {redesSociales.map((red, index) => (
                  <a
                    key={index}
                    href={red.enlace}
                    className="bg-white/20 backdrop-blur-sm p-4 rounded-full hover:bg-white/30 transition-all transform hover:scale-110"
                    title={red.nombre}
                  >
                    <red.icon className="w-6 h-6" />
                  </a>
                ))}
              </div>
            </div>

            {/* Mapa (placeholder) */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Encuéntranos</h3>
              <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">Mapa interactivo</p>
                  <p className="text-sm text-gray-500">Av. Principal Km 5, Sacaba</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}