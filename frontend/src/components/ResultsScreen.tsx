import { Category } from '../types/survey';

// Import provided result images for future detailed category reports
// import overviewImage from 'figma:asset/377bde54d27f4d2155315fbe79dd6692447581cd.png';
// import productDetailImage from 'figma:asset/92ec9ef352cb634fd5182d4531053edc641ac241.png';
// import marketingDetailImage from 'figma:asset/4b24005a624fcd06dcc5b1ed5475992476cd04df.png';

interface ResultsScreenProps {
  categories: (Category & { completedQuestions: number; questions: any[] })[];
  surveyVariant: string;
  responses: Record<string, number>;
  onBackToMain: () => void;
}

interface CategoryResult {
  id: string;
  title: string;
  score: number;
  color: string;
}

export function ResultsScreen({ categories, responses, onBackToMain }: ResultsScreenProps) {
  // Calculate scores for each category
  const calculateCategoryScore = (category: any): number => {
    if (!category || !category.questions) return 0;
    
    const categoryResponses = category.questions
      .map((q: any) => responses[q.id])
      .filter((r: any) => r !== undefined);
    
    if (categoryResponses.length === 0) return 0;
    
    const sum = categoryResponses.reduce((acc: number, score: number) => acc + score, 0);
    return Math.round((sum / (categoryResponses.length * 10)) * 100);
  };

  // Calculate overall score
  const calculateOverallScore = (): number => {
    if (!categories || categories.length === 0) return 0;
    
    const allScores = categories
      .filter(category => category && category.questions)
      .map(calculateCategoryScore);
    
    if (allScores.length === 0) return 0;
    
    const sum = allScores.reduce((acc, score) => acc + score, 0);
    return Math.round(sum / allScores.length);
  };

  const overallScore = calculateOverallScore();

  // Create category results based on actual categories data
  const categoryResults: CategoryResult[] = [];
  
  // Define category mappings with colors
  const categoryMappings = [
    { titlePattern: 'ПРОДУКТ', color: '#22c55e' },
    { titlePattern: 'МАРКЕТИНГ', color: '#84cc16' },
    { titlePattern: 'HR', color: '#eab308' },
    { titlePattern: 'ПРОДАЖИ', color: '#f97316' },
    { titlePattern: 'АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ', color: '#ef4444' },
    { titlePattern: 'КАРТА КОМПЕТЕНЦИЙ', color: '#8b5cf6' },
    { titlePattern: 'МЕТРИКИ И АНАЛИТИКА', color: '#06b6d4' }
  ];

  // Build results based on actual categories
  categories.forEach(category => {
    const mapping = categoryMappings.find(m => category.name.includes(m.titlePattern));
    if (mapping) {
      categoryResults.push({
        id: category.id,
        title: category.name,
        score: calculateCategoryScore(category),
        color: mapping.color
      });
    }
  });

  const getBusinessStatusText = (score: number): string => {
    if (score >= 80) return 'Устойчивый бизнес, готовый к масштабированию.';
    if (score >= 60) return 'Развивающийся бизнес с хорошим потенциалом.';
    if (score >= 40) return 'Бизнес в стадии становления с потенциалом роста.';
    return 'Бизнес требует системной проработки основных процессов.';
  };

  const getBusinessDescription = (score: number): string => {
    if (score >= 80) {
      return 'Компания стабильно работает, маркетинг, продажи и клиентский сервис взаимосвязаны, хотя требуют регулярной корректировки. Продуктовая линейка проработана и соответствует рыночным запросам. Личный бренд развивается и работает на привлечение клиентов. Аналитика на базовом уровне, необходима более детальная интеграция данных в ключевые бизнес-процессы.';
    }
    if (score >= 60) {
      return 'Основные бизнес-процессы настроены, но требуют оптимизации. Маркетинговые и продажные воронки работают с переменной эффективностью. Команда формируется, делегирование развивается. Продуктовая стратегия требует доработки.';
    }
    if (score >= 40) {
      return 'Бизнес находится в активной фазе развития. Основные процессы частично настроены, но требуют системного подхода. Необходима работа над продуктовой стратегией, маркетингом и автоматизацией процессов.';
    }
    return 'Бизнес требует комплексной проработки всех ключевых направлений. Необходимо сосредоточиться на создании базовых процессов, продуктовой стратегии и системном подходе к развитию.';
  };

  const getGrowthConstraints = (categoryResults: CategoryResult[]): string[] => {
    const constraints: string[] = [];
    
    categoryResults.forEach(cat => {
      if (cat.score < 50) {
        if (cat.title.includes('ПРОДУКТ')) {
          constraints.push('Недостаточная проработка продуктовой линейки и позиционирования.');
        } else if (cat.title.includes('МАРКЕТИНГ')) {
          constraints.push('Слабые маркетинговые процессы и недостаточная работа с целевой аудиторией.');
        } else if (cat.title.includes('HR')) {
          constraints.push('Неэффективное делегирование и управление человеческими ресурсами.');
        } else if (cat.title.includes('ПРОДАЖИ')) {
          constraints.push('Неоптимизированные процессы продаж и воронка конверсии.');
        } else if (cat.title.includes('АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ')) {
          constraints.push('Низкий уровень автоматизации и использования современных технологий.');
        } else if (cat.title.includes('КАРТА КОМПЕТЕНЦИЙ')) {
          constraints.push('Недостаточное развитие ключевых компетенций и навыков.');
        } else if (cat.title.includes('МЕТРИКИ И АНАЛИТИКА')) {
          constraints.push('Отсутствие системной аналитики и контроля метрик.');
        }
      }
    });

    if (constraints.length === 0) {
      constraints.push('Ограниченные возможности разработки новых продуктовых направлений и выхода на новые рыночные сегменты.');
    }

    return constraints;
  };

  const getKeyTask = (score: number): string => {
    if (score >= 80) {
      return 'Ключевая задача - подготовка к масштабированию, через усиление маркетинговых и технологических решений, более эффективное использование аналитики в принятии управленческих и бизнес решений.';
    }
    if (score >= 60) {
      return 'Фокус на улучшении операционной эффективности и автоматизации ключевых процессов. Развитие аналитических компетенций и систем контроля.';
    }
    if (score >= 40) {
      return 'Приоритет - создание устойчивых бизнес-процессов и развитие ключевых компетенций команды.';
    }
    return 'Основная задача - формирование базовой структуры бизнеса и ключевых процессов.';
  };

  const getFocusAreas = (score: number): string => {
    if (score >= 80) {
      return 'Фокус на внедрении AI-технологий для создания новых продуктов и оптимизации бизнес процессов.';
    }
    if (score >= 60) {
      return 'Внедрение систем автоматизации и улучшение клиентского опыта.';
    }
    if (score >= 40) {
      return 'Развитие маркетинговых стратегий и оптимизация процессов продаж.';
    }
    return 'Создание базовых бизнес-процессов и продуктовой стратегии.';
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-slate-400 text-white p-4 text-center">
        <h1 className="font-medium text-sm">ЭКСПЕРТНАЯ МАСТЕРСКАЯ АРТУРА БОГДАНОВА. ЧЕК АП "Экспертный Бизнес".</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Introduction */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-medium mb-2 text-sm">Ваши персональные результаты по итогам комплексной оценки ответов на вопросы ЧЕК АПА:</h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            Эти данные либо откроют вам глаза на самые большие области для роста и развития вашего бизнеса, либо подтвердят то, что вы уже давно 
            подозревали, но «стеснялись» признать и начать исправлять. Обычно то, и другое😉
          </p>
        </div>

        {/* Summary Report */}
        <div className="bg-slate-200 rounded-lg p-4">
          <h3 className="text-center font-medium text-slate-700 mb-4 text-sm">
            Сводный отчет по результатам чек-апа "Экспертный бизнес"
          </h3>

          <div className="flex items-start gap-4">
            {/* Chart */}
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32">
                {/* Circular chart */}
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                  />
                  {/* Progress segments */}
                  {categoryResults.map((category, index) => {
                    const circumference = 2 * Math.PI * 45;
                    const segmentLength = circumference / categoryResults.length;
                    const progress = (category.score / 100) * segmentLength;
                    const offset = -(segmentLength * index);
                    
                    return (
                      <circle
                        key={category.id}
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke={category.color}
                        strokeWidth="12"
                        strokeDasharray={`${progress} ${circumference - progress}`}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-medium text-slate-800">{overallScore}%</div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-2 space-y-1">
                {categoryResults.map((category) => (
                  <div key={category.id} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-slate-600">
                      {category.title} {category.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Text content */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-medium text-sm mb-1">{getBusinessStatusText(overallScore)}</p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {getBusinessDescription(overallScore)}
                </p>
              </div>

              <div>
                <p className="font-medium text-xs mb-1">Что сдерживает рост:</p>
                <ul className="text-xs text-slate-700 space-y-1">
                  {getGrowthConstraints(categoryResults).map((constraint, index) => (
                    <li key={index}>• {constraint}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {getKeyTask(overallScore)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {getFocusAreas(overallScore)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={() => alert('Функция скачивания PDF будет доступна после интеграции с бэкендом')}
            className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-600 transition-colors"
          >
            📄 Скачать PDF отчет
          </button>
          
          <button 
            onClick={() => alert('Функция покупки будет доступна после интеграции с платежной системой')}
            className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-600 transition-colors"
          >
            💎 Купить полную версию с детализацией
          </button>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">Детализация по категориям:</h4>
            <div className="space-y-2">
              {categoryResults.map((category) => (
                <button
                  key={category.id}
                  onClick={() => alert(`Детализация по категории "${category.title}" будет доступна в полной версии`)}
                  className="w-full text-left bg-slate-50 hover:bg-slate-100 p-3 rounded border transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{category.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{category.score}%</span>
                      <span className="text-xs text-slate-500">→</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onBackToMain}
          className="w-full bg-slate-200 text-slate-600 py-3 rounded-lg font-medium hover:bg-slate-300 transition-colors"
        >
          Назад к опросу
        </button>
      </div>
    </div>
  );
}