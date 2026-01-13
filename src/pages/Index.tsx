import { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Filter, Info, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ScheduleItem {
  date: string;
  time_start: string;
  time_end: string;
  subject: string;
  teacher: string;
  room: string;
  group: string;
  type: string;
}

const BACKEND_URL = 'https://functions.poehali.dev/abadd336-a345-4cc8-ae34-7d389f29e917';

const SHEETS = [
  { value: 'расписание для 2-4 курса на 1-6', label: '2-4 курс (1-6 недели)' },
  { value: 'Расписание 3-4 курсы', label: '3-4 курсы' },
  { value: 'расписание преподавателей', label: 'Преподаватели' },
];

const Index = () => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedSheet, setSelectedSheet] = useState<string>('расписание для 2-4 курса на 1-6');
  const [activeTab, setActiveTab] = useState<string>('schedule');
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSchedule = async (sheetName?: string) => {
    setIsLoading(true);
    setError(null);
    
    const sheet = sheetName || selectedSheet;
    
    try {
      const url = `${BACKEND_URL}?sheet=${encodeURIComponent(sheet)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить расписание');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setScheduleData(data.schedule || []);
      
      if (data.schedule && data.schedule.length > 0) {
        toast({
          title: 'Расписание обновлено',
          description: `Загружено ${data.schedule.length} занятий`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      setScheduleData(mockScheduleData);
      
      toast({
        title: 'Ошибка загрузки',
        description: 'Показаны тестовые данные',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedSheet]);

  const mockScheduleData: ScheduleItem[] = [
    {
      date: '2026-01-13',
      time_start: '09:00',
      time_end: '10:30',
      subject: 'Математический анализ',
      teacher: 'Иванов И.И.',
      room: 'Ауд. 201',
      group: 'МТ-101',
      type: 'Лекция',
    },
    {
      date: '2026-01-13',
      time_start: '10:45',
      time_end: '12:15',
      subject: 'Линейная алгебра',
      teacher: 'Петрова А.С.',
      room: 'Ауд. 305',
      group: 'МТ-101',
      type: 'Практика',
    },
    {
      date: '2026-01-13',
      time_start: '12:30',
      time_end: '14:00',
      subject: 'Программирование',
      teacher: 'Сидоров В.П.',
      room: 'Комп. класс 12',
      group: 'ИТ-102',
      type: 'Лабораторная',
    },
    {
      date: '2026-01-13',
      time_start: '14:15',
      time_end: '15:45',
      subject: 'Английский язык',
      teacher: 'Смирнова Е.А.',
      room: 'Ауд. 108',
      group: 'МТ-101',
      type: 'Практика',
    },
    {
      date: '2026-01-14',
      time_start: '09:00',
      time_end: '10:30',
      subject: 'Физика',
      teacher: 'Кузнецов Д.М.',
      room: 'Ауд. 412',
      group: 'ИТ-102',
      type: 'Лекция',
    },
    {
      date: '2026-01-14',
      time_start: '10:45',
      time_end: '12:15',
      subject: 'Базы данных',
      teacher: 'Николаева О.В.',
      room: 'Комп. класс 15',
      group: 'ИТ-102',
      type: 'Практика',
    },
  ];

  const groups = useMemo(() => {
    const uniqueGroups = Array.from(
      new Set(scheduleData.map((item) => item.group).filter(Boolean))
    );
    return ['all', ...uniqueGroups];
  }, [scheduleData]);

  const filteredSchedule = useMemo(() => {
    if (selectedGroup === 'all') return scheduleData;
    return scheduleData.filter((item) => item.group === selectedGroup);
  }, [selectedGroup, scheduleData]);

  const getCurrentAndNextClass = () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    const todayClasses = filteredSchedule.filter(
      (item) => item.date === currentDate
    );

    const currentClass = todayClasses.find((item) => {
      return item.time_start <= currentTime && item.time_end >= currentTime;
    });

    const nextClass = todayClasses.find((item) => {
      return item.time_start > currentTime;
    });

    return { currentClass, nextClass };
  };

  const { currentClass, nextClass } = getCurrentAndNextClass();

  const groupedByDate = useMemo(() => {
    const grouped: { [key: string]: ScheduleItem[] } = {};
    filteredSchedule.forEach((item) => {
      if (!grouped[item.date]) {
        grouped[item.date] = [];
      }
      grouped[item.date].push(item);
    });

    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.time_start.localeCompare(b.time_start));
    });

    return grouped;
  }, [filteredSchedule]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Лекция: 'bg-blue-100 text-blue-700 border-blue-200',
      Практика: 'bg-green-100 text-green-700 border-green-200',
      Лабораторная: 'bg-purple-100 text-purple-700 border-purple-200',
      Онлайн: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Расписание</h1>
          <p className="text-gray-600">Актуальное расписание занятий</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="w-4 h-4" />
              Расписание
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <Info className="w-4 h-4" />
              О приложении
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            {error && (
              <Card className="p-4 border-orange-200 bg-orange-50">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900">
                      Google Sheets API ключ не настроен
                    </p>
                    <p className="text-sm text-orange-700">
                      Показаны тестовые данные. Добавьте ключ для загрузки реального расписания.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                    <SelectTrigger className="w-60">
                      <SelectValue placeholder="Выберите расписание" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHEETS.map((sheet) => (
                        <SelectItem key={sheet.value} value={sheet.value}>
                          {sheet.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Выберите группу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все группы</SelectItem>
                      {groups.slice(1).map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => fetchSchedule()}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Обновить
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <p className="text-gray-600">Загрузка расписания...</p>
                </div>
              </div>
            )}

            {!isLoading && filteredSchedule.length === 0 && (
              <Card className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Расписание пусто</p>
              </Card>
            )}

            {!isLoading && filteredSchedule.length > 0 && (currentClass || nextClass) && (
              <div className="grid md:grid-cols-2 gap-4">
                {currentClass && (
                  <Card className="p-5 border-2 border-primary bg-primary/5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                        Сейчас идёт
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {currentClass.subject}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {currentClass.time_start} — {currentClass.time_end}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        {currentClass.teacher}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {currentClass.room}
                      </div>
                    </div>
                  </Card>
                )}

                {nextClass && (
                  <Card className="p-5 border border-gray-200 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Следующее занятие
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {nextClass.subject}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {nextClass.time_start} — {nextClass.time_end}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        {nextClass.teacher}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {nextClass.room}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {!isLoading && filteredSchedule.length > 0 && (
              <div className="space-y-8">
                {Object.entries(groupedByDate).map(([date, classes]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <h2 className="text-lg font-semibold text-gray-700 capitalize">
                      {formatDate(date)}
                    </h2>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  <div className="grid gap-3">
                    {classes.map((item, index) => (
                      <Card
                        key={`${date}-${index}`}
                        className="p-5 hover:shadow-md transition-shadow duration-200 animate-fade-in"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.subject}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`${getTypeColor(item.type)} shrink-0`}
                              >
                                {item.type}
                              </Badge>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>
                                  {item.time_start} — {item.time_end}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-gray-600">
                                <User className="w-4 h-4 shrink-0" />
                                <span>{item.teacher}</span>
                              </div>

                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span>{item.room}</span>
                              </div>

                              {item.group && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Badge variant="secondary">{item.group}</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <Card className="p-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                О приложении
              </h2>

              <div className="space-y-6 text-gray-700">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    📚 Источник данных
                  </h3>
                  <p className="text-gray-600">
                    Расписание синхронизируется с Google Sheets в реальном
                    времени. Все изменения в таблице автоматически отображаются
                    в приложении.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">✨ Возможности</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Просмотр расписания занятий по дням</li>
                    <li>• Фильтрация по учебным группам</li>
                    <li>• Отображение текущего и ближайшего занятия</li>
                    <li>• Минималистичный дизайн для комфортного чтения</li>
                    <li>• Адаптивная вёрстка для всех устройств</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    🎨 Дизайн-принципы
                  </h3>
                  <p className="text-gray-600">
                    Чистые линии, просторные карточки и продуманная типографика
                    обеспечивают максимальную читаемость расписания.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Создано с помощью poehali.dev 🚀
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;