import React from 'react';
import { DollarSign, Calendar, CheckCircle, TrendingUp } from 'lucide-react';

interface Shoot {
  id: string;
  price: number;
  status: 'planned' | 'completed' | 'cancelled';
  [key: string]: any;
}

interface ReportsPageProps {
  shoots: Shoot[];
}

export default function ReportsPage({ shoots }: ReportsPageProps) {
  const totalEarnings = shoots
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => acc + (s.price || 0), 0);

  const plannedCount = shoots.filter(s => s.status === 'planned').length;
  const completedCount = shoots.filter(s => s.status === 'completed').length;
  const cancelledCount = shoots.filter(s => s.status === 'cancelled').length;

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex items-center space-x-2">
        <TrendingUp className="w-6 h-6 text-indigo-400" />
        <h2 className="text-lg font-bold">Performance & Earnings Reports</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Total Earnings</span>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">₺{totalEarnings}</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Planned Shoots</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400">{plannedCount}</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Completed Shoots</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{completedCount}</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Cancelled Shoots</span>
            <span className="text-red-400 font-bold">✕</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{cancelledCount}</p>
        </div>
      </div>
    </div>
  );
}
