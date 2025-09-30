# ПРАВИЛА ПОСТРОЕНИЯ ОТЧЕТОВ

## 1. ОБЩИЕ ПРИНЦИПЫ

### 1.1. Типы отчетов
- **Сводный отчет**: рассчитывается только по категориям
- **Аналитический отчет**: формируется как сводный + по подкатегориям

### 1.2. Источники данных
- **express_report.csv**: правила расчета для экспресс отчета
- **full_report.csv**: правила расчета для полного отчета

### 1.3. Формула расчета
Каждый ответ имеет вес от 1 до 10. Математическое среднее вычисляется как:
```
P = (R̄ - 1) / 9 × 100%
```
где:
- R̄ - среднее арифметическое ответов (1-10)
- P - финальный процент (0-100%)

## 2. ГРАДАЦИИ РЕЗУЛЬТАТОВ

### 2.1. Диапазоны оценки
| Диапазон | Цвет | HEX |
|----------|------|-----|
| 0% - 20% | Красный | #eb2f06 |
| 21% - 35% | Оранжевый | #f6b93b |
| 36% - 49% | Желтый | #fad390 |
| 50% - 74% | Светло-зеленый | #b8e994 |
| 75% - 89% | Зеленый | #78e08f |
| 90% - 100% | Темно-зеленый | #6ab04c |

### 2.2. Структура данных в CSV
```csv
category,subcategory,title_summary,result,result_description,min,max,color
```

## 3. ТЕХНИЧЕСКАЯ РЕАЛИЗАЦИЯ

### 3.1. Загрузка данных
**Рекомендуемый подход**: Загрузка CSV при старте приложения
```typescript
// Backend: загрузка при инициализации модуля
@Injectable()
export class ReportDataService {
  private reportData: Map<string, ReportEntry[]> = new Map();

  async onModuleInit() {
    await this.loadReportData();
  }

  private async loadReportData() {
    const expressData = await this.parseCSV('express_report.csv');
    const fullData = await this.parseCSV('full_report.csv');

    this.reportData.set('express', expressData);
    this.reportData.set('full', fullData);
  }
}
```

### 3.2. Поиск подходящего контента
```typescript
interface ReportEntry {
  category: string;
  subcategory: string;
  titleSummary: string;
  result: string;
  resultDescription: string;
  min: number;
  max: number;
  color: string;
}

findReportContent(
  reportType: 'express' | 'full',
  category: string,
  percentage: number,
  subcategory?: string
): ReportEntry | null {
  const data = this.reportData.get(reportType);
  return data.find(entry =>
    entry.category === category &&
    entry.subcategory === (subcategory || '') &&
    percentage >= entry.min &&
    percentage <= entry.max
  );
}
```

### 3.3. API Endpoints
```typescript
// Получение результатов опроса
GET /api/survey/results/:sessionId
Response: {
  overallScore: number,
  categories: CategoryResult[],
  subcategories: SubcategoryResult[]
}

// Получение детального отчета по категории
GET /api/reports/category/:category/:sessionId
Response: {
  category: string,
  score: number,
  content: ReportEntry,
  subcategories: SubcategoryResult[]
}
```

## 4. АРХИТЕКТУРА СТРАНИЦ

### 4.1. Главная страница результатов (`/results/:sessionId`)
**Компоненты:**
- Круговая диаграмма общего результата
- Список категорий с процентами и цветами
- Сводный отчет с заголовком и описанием из CSV

**Структура:**
```
┌─────────────────────────────────────┐
│ Результаты чекапа                   │
├─────────────────────────────────────┤
│ [Круговая диаграмма] [Общий %]      │
├─────────────────────────────────────┤
│ Сводный отчет:                      │
│ [Заголовок из CSV]                  │
│ [Описание из CSV]                   │
├─────────────────────────────────────┤
│ Детализация по категориям:          │
│ ► ПРОДУКТ           [75%] [цвет]    │
│ ► МАРКЕТИНГ         [60%] [цвет]    │
│ ► ПРОДАЖИ           [85%] [цвет]    │
│ ► HR                [45%] [цвет]    │
│ ► РАЗВИТИЕ          [70%] [цвет]    │
│ ► АНАЛИТИКА         [55%] [цвет]    │
└─────────────────────────────────────┘
```

### 4.2. Страница категории (`/results/:sessionId/category/:categoryName`)
**Компоненты:**
- Детальная информация по категории
- Подкатегории с их результатами (только для полного отчета)
- Навигация назад к общим результатам

**Структура:**
```
┌─────────────────────────────────────┐
│ ← Назад к результатам               │
├─────────────────────────────────────┤
│ Категория: ПРОДУКТ                  │
│ Результат: 75%                      │
├─────────────────────────────────────┤
│ [Заголовок из CSV для 75%]          │
│ [Описание из CSV для 75%]           │
├─────────────────────────────────────┤
│ Подкатегории: (если полный отчет)   │
│ • Продуктовая линейка    [80%]      │
│ • Личный бренд          [70%]       │
│ • Монетизация           [75%]       │
└─────────────────────────────────────┘
```

### 4.3. Роутинг
```typescript
// Frontend routing
const routes = [
  {
    path: '/results/:sessionId',
    component: ResultsPage
  },
  {
    path: '/results/:sessionId/category/:categoryName',
    component: CategoryDetailPage
  }
];
```

## 5. ВИЗУАЛЬНЫЕ ТРЕБОВАНИЯ

### 5.1. Цветовая схема
Использовать цвета из CSV файлов для:
- Круговых диаграмм
- Индикаторов процентов
- Фоновых цветов категорий
- Прогресс-баров

### 5.2. Компоненты UI
```typescript
// Цветовой индикатор
interface ScoreIndicator {
  percentage: number;
  color: string; // из CSV
  category: string;
}

// Круговая диаграмма
interface CircularChart {
  score: number;
  color: string;
  size: 'large' | 'medium' | 'small';
}
```

## 6. СТРУКТУРА ДАННЫХ

### 6.1. Backend Response Types
```typescript
interface SurveyResults {
  sessionId: string;
  surveyType: 'express' | 'full';
  overallScore: number;
  overallContent: ReportEntry;
  categories: CategoryResult[];
}

interface CategoryResult {
  name: string;
  score: number;
  content: ReportEntry;
  subcategories?: SubcategoryResult[];
}

interface SubcategoryResult {
  name: string;
  score: number;
  content: ReportEntry;
}
```

### 6.2. Frontend State Management
```typescript
// Zustand store для результатов
interface ResultsStore {
  results: SurveyResults | null;
  loading: boolean;
  selectedCategory: string | null;

  fetchResults: (sessionId: string) => Promise<void>;
  selectCategory: (categoryName: string) => void;
  clearResults: () => void;
}
```

## 7. ПОСЛЕДОВАТЕЛЬНОСТЬ РЕАЛИЗАЦИИ

### 7.1. Backend
1. Создать ReportDataService для загрузки CSV
2. Обновить AnalyticsCalculator для расчета по категориям/подкатегориям
3. Создать API endpoints для получения результатов
4. Интегрировать CSV данные в ответы API

### 7.2. Frontend
1. Создать компоненты для отображения результатов
2. Настроить роутинг между страницами
3. Подключить к API для получения данных
4. Применить цветовую схему из CSV

### 7.3. Интеграция
1. Подключить ResultsScreen к реальному API
2. Создать CategoryDetailPage
3. Настроить навигацию между страницами
4. Протестировать все градации процентов

## 8. ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### 8.1. Получение общих результатов
```typescript
// Frontend
const { data } = await api.get(`/survey/results/${sessionId}`);
// data содержит общий процент и контент из CSV для соответствующего диапазона
```

### 8.2. Переход к детализации категории
```typescript
// Frontend navigation
const navigateToCategory = (categoryName: string) => {
  navigate(`/results/${sessionId}/category/${categoryName}`);
};
```

### 8.3. Отображение с правильными цветами
```typescript
// Компонент ScoreIndicator
const getColorForScore = (score: number): string => {
  if (score <= 20) return '#eb2f06';
  if (score <= 35) return '#f6b93b';
  if (score <= 49) return '#fad390';
  if (score <= 74) return '#b8e994';
  if (score <= 89) return '#78e08f';
  return '#6ab04c';
};
```