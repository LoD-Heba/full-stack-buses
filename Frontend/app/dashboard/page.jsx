'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bus, DollarSign, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
 
  return (
    <ProtectedRoute requireRole="admin">
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel Principal</h1>
       
      </div>
    </div>
     </ProtectedRoute>
  );
}
