"use client";
import { useState } from "react";
import Image from "next/image";
import { 
  Award, 
  Users, 
  Target, 
  Heart, 
  TrendingUp,
  Shield,
  Clock,
  Star,
  Bus,
  MapPin
} from "lucide-react";

export default function NosotrosPage() {
  const [imagenActiva, setImagenActiva] = useState(0);

  // EDITABLE: Información de la empresa
  const infoEmpresa = {
    añoFundacion: "2010",
    experiencia: "15 años",
    flotas: "25+",
    destinos: "9 departamentos",
    pasajerosAnuales: "500,000+"
  };

  // EDITABLE: Historia de la empresa
  const historia = {
    titulo: "Nuestra Historia",
    parrafo1: "Trans Sacaba nace en 2010 con la visión de conectar los 9 departamentos de Bolivia, ofreciendo un servicio de transporte terrestre de calidad, seguro y accesible para todos los bolivianos.",
    parrafo2: "Desde nuestros inicios en Sacaba, Cochabamba, hemos crecido constantemente, expandiendo nuestras rutas y modernizando nuestra flota. Hoy somos una de las empresas de transporte más confiables del país.",
    parrafo3: "Nuestro compromiso con la excelencia nos ha permitido ganar la confianza de miles de familias bolivianas que nos eligen para sus viajes."
  };

  // EDITABLE: Misión y Visión
  const misionVision = [
    {
      icon: Target,
      titulo: "Misión",
      descripcion: "Brindar servicios de transporte terrestre seguros, cómodos y puntuales, conectando a las familias bolivianas con sus destinos, contribuyendo al desarrollo económico y social del país."
    },
    {
      icon: TrendingUp,
      titulo: "Visión",
      descripcion: "Ser la empresa líder en transporte interprovincial en Bolivia, reconocida por su excelencia en el servicio, innovación tecnológica y compromiso con la seguridad de nuestros pasajeros."
    }
  ];

  // EDITABLE: Valores
  const valores = [
    {
      icon: Shield,
      titulo: "Seguridad",
      descripcion: "La seguridad de nuestros pasajeros es nuestra máxima prioridad en cada viaje."
    },
    {
      icon: Clock,
      titulo: "Puntualidad",
      descripcion: "Cumplimos con los horarios establecidos, respetando el tiempo de nuestros clientes."
    },
    {
      icon: Heart,
      titulo: "Compromiso",
      descripcion: "Comprometidos con brindar el mejor servicio y experiencia de viaje."
    },
    {
      icon: Star,
      titulo: "Calidad",
      descripcion: "Mantenemos altos estándares de calidad en todos nuestros servicios."
    }
  ];

  // EDITABLE: Galería de imágenes (coloca tus imágenes en public/images/nosotros/)
  const galeria = [
    {
      src: "/images/nosotros/bus1.jpg", // Cambia estas rutas por tus imágenes reales
      alt: "Nuestra flota moderna"
    },
    {
      src: "/images/nosotros/terminal.jpg",
      alt: "Terminal Trans Sacaba"
    },
    {
      src: "/images/nosotros/equipo.jpg",
      alt: "Nuestro equipo"
    },
    {
      src: "/images/nosotros/interior.jpg",
      alt: "Interior de nuestros buses"
    }
  ];

  // EDITABLE: Línea de tiempo
  const lineaTiempo = [
    {
      año: "1995",
      titulo: "Fundación",
      descripcion: "Inicio de operaciones en Sacaba, Cochabamba con 5 buses."
    },
    {
      año: "2000",
      titulo: "Expansión Regional",
      descripcion: "Ampliación de rutas a La Paz, Santa Cruz y Oruro."
    },
    {
      año: "2010",
      titulo: "Modernización",
      descripcion: "Renovación completa de la flota con buses de última generación."
    },
    {
      año: "2015",
      titulo: "Cobertura Nacional",
      descripcion: "Llegamos a los 9 departamentos de Bolivia."
    },
    {
      año: "2020",
      titulo: "Transformación Digital",
      descripcion: "Implementación de sistema de reservas en línea y tracking en tiempo real."
    },
    {
      año: "2025",
      titulo: "Líderes del Sector",
      descripcion: "Reconocidos como una de las mejores empresas de transporte del país."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[500px] bg-gradient-to-r from-green-600 to-green-500">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="text-white">
            <Bus className="w-20 h-20 mx-auto mb-6" />
            <h1 className="text-6xl font-bold mb-4">Sobre Trans Sacaba</h1>
            <p className="text-2xl text-green-100 max-w-3xl mx-auto">
              {infoEmpresa.experiencia} conectando Bolivia con seguridad, confianza y calidad
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{infoEmpresa.añoFundacion}</div>
              <div className="text-gray-600">Año de Fundación</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{infoEmpresa.experiencia}</div>
              <div className="text-gray-600">de Experiencia</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{infoEmpresa.flotas}</div>
              <div className="text-gray-600">Buses en Flota</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{infoEmpresa.destinos}</div>
              <div className="text-gray-600">Cubiertos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{infoEmpresa.pasajerosAnuales}</div>
              <div className="text-gray-600">Pasajeros al Año</div>
            </div>
          </div>
        </div>
      </div>

      {/* Historia */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">{historia.titulo}</h2>
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
              <p>{historia.parrafo1}</p>
              <p>{historia.parrafo2}</p>
              <p>{historia.parrafo3}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Misión y Visión */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {misionVision.map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-2xl p-8 hover:shadow-xl transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-green-600 p-4 rounded-full">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800">{item.titulo}</h3>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">{item.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Valores */}
      <div className="bg-gradient-to-br from-green-600 to-green-500 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-white">Nuestros Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valores.map((valor, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all text-white">
                <valor.icon className="w-12 h-12 mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-3 text-center">{valor.titulo}</h3>
                <p className="text-green-50 text-center">{valor.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Línea de Tiempo */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Nuestra Trayectoria</h2>
          <div className="max-w-5xl mx-auto">
            {lineaTiempo.map((evento, index) => (
              <div key={index} className="flex gap-6 mb-12 relative">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold z-10 shadow-lg">
                    {evento.año}
                  </div>
                  {index !== lineaTiempo.length - 1 && (
                    <div className="w-1 h-full bg-green-300 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{evento.titulo}</h3>
                  <p className="text-gray-600">{evento.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Galería */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Nuestra Empresa en Imágenes</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative h-96 bg-gray-200 rounded-2xl overflow-hidden shadow-2xl mb-6">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MapPin className="w-20 h-20 mx-auto mb-4 opacity-30" />
                  <p className="text-xl">Imagen {imagenActiva + 1}</p>
                  <p className="text-sm">{galeria[imagenActiva].alt}</p>
                  <p className="text-xs mt-2">Agrega tus imágenes en: public/images/nosotros/</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {galeria.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setImagenActiva(index)}
                  className={`relative h-24 bg-gray-300 rounded-lg overflow-hidden transition-all ${
                    imagenActiva === index ? 'ring-4 ring-green-500' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <span className="text-xs text-center px-2">{img.alt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">¿Listo para tu próximo viaje?</h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Únete a miles de pasajeros que confían en Trans Sacaba para sus viajes por Bolivia
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/salidas" className="bg-white text-green-600 hover:bg-green-50 font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105">
              Ver Salidas
            </a>
            <a href="/contacto" className="bg-green-700 text-white hover:bg-green-800 font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105">
              Contáctanos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}