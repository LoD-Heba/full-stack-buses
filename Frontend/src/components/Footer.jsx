import { Bus, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Bus className="w-8 h-8 text-orange-400" />
              <div>
                <h3 className="font-bold text-white text-lg">Trans Sacaba</h3>
                <p className="text-xs text-orange-400">Viajamos por Bolivia</p>
              </div>
            </div>
            <p className="text-sm">
              Conectando los 9 departamentos de Bolivia con seguridad, comodidad y puntualidad desde 1995.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/rutas" className="hover:text-orange-400 transition-colors">Rutas</Link></li>
              <li><Link href="/ciudades" className="hover:text-orange-400 transition-colors">Ciudades</Link></li>
              <li><Link href="/salidas" className="hover:text-orange-400 transition-colors">Salidas Hoy</Link></li>
              <li><Link href="/comprar" className="hover:text-orange-400 transition-colors">Comprar Pasaje</Link></li>
              <li><Link href="/reglas" className="hover:text-orange-400 transition-colors">Reglas y Políticas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-orange-400" />
                <span>+591 4 123-4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-orange-400" />
                <span>info@transsacaba.com</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-orange-400 mt-1" />
                <span>Av. Principal Km 5<br />Sacaba, Cochabamba</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Síguenos</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-orange-400 transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-orange-400 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-orange-400 transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
            <p className="text-sm mt-4">
              Horario de atención:<br />
              Lunes a Domingo<br />
              24 horas
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Trans Sacaba. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
