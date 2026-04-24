import { useState } from 'react';
import { 
  Network, 
  Search, 
  RefreshCw, 
  Monitor, 
  Globe, 
  Shield, 
  Activity,
  CheckCircle2,
  XCircle,
  ChevronRight,
  X
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useParserStore } from '@/stores/parserStore';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ParserScreen() {
  const { devices, scanHistory, isScanning, lastScanTime, startScan, getStats } = useParserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const stats = getStats();

  const handleStartScan = async () => {
    toast.promise(startScan(), {
      loading: 'Сканирование локальной сети...',
      success: 'Сканирование завершено',
      error: 'Ошибка при сканировании',
    });
  };

  const filteredDevices = (devices || []).filter(d => 
    d.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.ipAddress.includes(searchQuery) ||
    d.os.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = (scanHistory || []).map(h => ({
    time: format(new Date(h.timestamp), 'HH:mm'),
    online: h.onlineDevices,
    withApp: h.devicesWithApp,
  }));

  const pieData = Object.entries(stats.osDist).map(([name, value]) => ({ name, value }));

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-4 md:p-8 max-w-[1600px] mx-auto pb-24">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <Network className="w-8 h-8 text-white" />
                </div>
                Сетевой парсер
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Мониторинг локальной сети и статуса рабочих мест
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-400">Последнее сканирование:</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {lastScanTime ? format(new Date(lastScanTime), 'HH:mm:ss', { locale: ru }) : 'Никогда'}
                </p>
              </div>
              <Button 
                onClick={handleStartScan} 
                disabled={isScanning}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl h-11 px-6 shadow-lg shadow-blue-500/20"
              >
                <RefreshCw className={cn("w-4 h-4", isScanning && "animate-spin")} />
                {isScanning ? 'Сканирование...' : 'Сканировать сеть'}
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">Всего</Badge>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</h3>
                  <p className="text-sm text-slate-500">Устройств обнаружено</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">Online</Badge>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.online}</h3>
                  <p className="text-sm text-slate-500">Сейчас в сети</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <Globe className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-200">HelpDesk</Badge>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.withApp}</h3>
                  <p className="text-sm text-slate-500">Приложение запущено</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-200">Offline</Badge>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total - stats.online}</h3>
                  <p className="text-sm text-slate-500">Не в сети</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Активность сети (24ч)</CardTitle>
                <CardDescription>Динамика онлайн-устройств и активных сессий</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="online" name="Онлайн" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOnline)" strokeWidth={2} />
                    <Area type="monotone" dataKey="withApp" name="С приложением" stroke="#10b981" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Распределение ОС</CardTitle>
                <CardDescription>Популярные операционные системы</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{stats.total}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Всего ОС</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device List */}
          <Card className="border-none shadow-sm bg-white dark:bg-slate-800 overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Обнаруженные устройства</CardTitle>
                  <CardDescription>Подробный список всех узлов локальной сети</CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Поиск по IP, имени, ОС..." 
                    className="pl-9 pr-9 bg-slate-50 dark:bg-slate-700 border-0 h-10 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 font-bold">Статус</th>
                      <th className="px-6 py-4 font-bold">Устройство</th>
                      <th className="px-6 py-4 font-bold">IP Адрес</th>
                      <th className="px-6 py-4 font-bold">MAC Адрес</th>
                      <th className="px-6 py-4 font-bold">Система</th>
                      <th className="px-6 py-4 font-bold text-center">HelpDesk</th>
                      <th className="px-6 py-4 font-bold text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {filteredDevices.map((device) => (
                      <tr key={device.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                        <td className="px-6 py-4">
                          {device.status === 'online' ? (
                            <div className="flex items-center gap-2 text-green-600 font-medium">
                              <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                              Online
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400">
                              <div className="w-2 h-2 rounded-full bg-slate-400" />
                              Offline
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                              <Monitor className="w-4 h-4 text-slate-500" />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{device.hostname}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{device.ipAddress}</td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{device.macAddress}</td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className="font-normal text-xs">{device.os}</Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {device.hasAppRunning ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-slate-200 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
