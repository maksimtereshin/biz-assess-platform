import { Category, SurveyVariant, Question } from '../types/survey';


// Common answer options for standardization
// const commonAnswers: AnswerOption[] = [
//   { text: 'Слабо', color: '#eb2f06', range: '1-3' },
//   { text: 'Частично', color: '#FFA500', range: '4-7' },
//   { text: 'Полностью', color: '#16a085', range: '8-10' }
// ];

// const yesNoAnswers: AnswerOption[] = [
//   { text: 'Нет', color: '#eb2f06', range: '1-3' },
//   { text: 'Частично', color: '#FFA500', range: '4-7' },
//   { text: 'Да', color: '#16a085', range: '8-10' }
// ];

// const minimalPartialMaximal: AnswerOption[] = [
//   { text: 'Минимально', color: '#eb2f06', range: '1-3' },
//   { text: 'Частично', color: '#FFA500', range: '4-7' },
//   { text: 'Максимально', color: '#16a085', range: '8-10' }
// ];

// const lowMediumHighAnswers: AnswerOption[] = [
//   { text: 'Низкий', color: '#eb2f06', range: '1-3' },
//   { text: 'Средний', color: '#FFA500', range: '4-7' },
//   { text: 'Высокий', color: '#16a085', range: '8-10' }
// ];

// const rarelyPeriodicRegular: AnswerOption[] = [
//   { text: 'Редко', color: '#eb2f06', range: '1-3' },
//   { text: 'Периодически', color: '#FFA500', range: '4-7' },
//   { text: 'Регулярно', color: '#16a085', range: '8-10' }
// ];

// // Full survey data with all questions and answer options based on provided JSON
// const fullSurveyData: Category[] = [
//   {
//     id: 'product',
//     title: 'ПРОДУКТ',
//     subtitle: 'Оценка продуктовой линейки, личного бренда и модели монетизации',
//     totalQuestions: 17,
//     completedQuestions: 0,
//     questions: [
//       // Продуктовая линейка (5 questions)
//       {
//         id: 'product_line_1',
//         text: 'Насколько детально проработана структура вашей продуктовой линейки (консультации, групповые программы, курсы, корпоративные решения)?',
//         categoryId: 'product',
//         subcategory: 'Продуктовая линейка',
//         answers: commonAnswers
//       },
//       {
//         id: 'product_line_2',
//         text: 'Прописана ли ролевая модель каждого продукта согласно стратегии вовлечения клиентов (лид -магнит, трипвайер, основной продукт, бандлы, максимизаторы прибыли и т. д.)?',
//         categoryId: 'product',
//         subcategory: 'Продуктовая линейка',
//         answers: commonAnswers
//       },
//       {
//         id: 'product_line_3',
//         text: 'Прописаны ли конкурентоспособные УТП для каждого продукта (услуги) в вашей линейке?',
//         categoryId: 'product',
//         subcategory: 'Продуктовая линейка',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'product_line_4',
//         text: 'Ведется ли регулярный анализ продуктовой линейки и вносятся ли корректировки с учетом обратной связи клиентов и рыночной конъюнктуры?',
//         categoryId: 'product',
//         subcategory: 'Продуктовая линейка',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'product_line_5',
//         text: 'Какой, по-вашему, потенциал масштабируемости бизнеса у текущей продуктовой линейки?',
//         categoryId: 'product',
//         subcategory: 'Продуктовая линейка',
//         answers: lowMediumHighAnswers
//       },
//       // Личный бренд (7 questions)
//       {
//         id: 'personal_brand_1',
//         text: 'Есть ли у вас описаная концепция вашего экспертного позиционирования и понимание того, чем вы отличаетесь от других специалистов в вашей нише?',
//         categoryId: 'product',
//         subcategory: 'Личный бренд',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'personal_brand_2',
//         text: 'Ваша целевая аудитория понимает, какую ценность вы предлагаете и почему именно к вам стоит обратиться?',
//         categoryId: 'product',
//         subcategory: 'Личный бренд',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'personal_brand_3',
//         text: 'Как вы оцениваете свое присутствие в ключевых медиаканалах (соцсети, статьи, видео, книги, выступления)?',
//         categoryId: 'product',
//         subcategory: 'Личный бренд',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'personal_brand_4',
//         text: 'Состоите ли вы в профессиональных сообществах, ассоциациях и присутствуете ли на профессиональных платформах?',
//         categoryId: 'product',
//         subcategory: 'Личный бренд',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'personal_brand_5',
//         text: 'Выстроена ли стратегия контент -маркетинга для продвижения личного бренда?',
//         categoryId: 'product',
//         subcategory: 'Личный бренд',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'personal_brand_6',
//         text: 'Работаете ли вы с PR-специалистами или медиа -экспертами для усиления узнаваемости?',
//         categoryId: 'product',
//         subcategory: 'Личный бренд',
//         answers: [
//           { text: 'Нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Периодически', color: '#FFA500', range: '4-7' },
//           { text: 'Регулярно', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'personal_brand_7',
//         text: 'Насколько ваш личный бренд помогает вам в продаже услуг и повышении доверия клиентов?',
//         categoryId: 'product',
//         subcategory: 'Личный бренд',
//         answers: minimalPartialMaximal
//       },
//       // Монетизация (5 questions)
//       {
//         id: 'monetization_1',
//         text: 'Есть ли у вас финансовая модель с расчетами планового дохода, прибыли и точек роста?',
//         categoryId: 'product',
//         subcategory: 'Монетизация',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'monetization_2',
//         text: 'Есть ли механизм A/B тестирования ценовых предложений для определения оптимальных стратегий (разовые продажи, подписки, пакеты, групповые программы)?',
//         categoryId: 'product',
//         subcategory: 'Монетизация',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'monetization_3',
//         text: 'Прописаны ли механизмы скидок, бонусов, программ лояльности?',
//         categoryId: 'product',
//         subcategory: 'Монетизация',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'monetization_4',
//         text: 'Есть ли у вас стратегия повышения среднего чека, включая персонализированные предложения и премиум -услуги?',
//         categoryId: 'product',
//         subcategory: 'Монетизация',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'monetization_5',
//         text: 'Рассчитывается ли себестоимость и прибыльность каждого продукта?',
//         categoryId: 'product',
//         subcategory: 'Монетизация',
//         answers: yesNoAnswers
//       }
//     ]
//   },
//   {
//     id: 'marketing',
//     title: 'МАРКЕТИНГ',
//     subtitle: 'Анализ клиентского пути, стратегий продвижения и маркетинговых инструментов',
//     totalQuestions: 23,
//     completedQuestions: 0,
//     questions: [
//       // Аватар клиента (5 questions)
//       {
//         id: 'customer_avatar_1',
//         text: 'Насколько глубоко сегментирована ваша клиентская база по ключевым параметрам (ценность, поведение, потребности)?',
//         categoryId: 'marketing',
//         subcategory: 'Аватар клиента',
//         answers: commonAnswers
//       },
//       {
//         id: 'customer_avatar_2',
//         text: 'Разработаны ли аватары клиентов (описание болей, потребностей, возражений) и сформирован ли детализированный портрет целевого клиента?',
//         categoryId: 'marketing',
//         subcategory: 'Аватар клиента',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'customer_avatar_3',
//         text: 'Используются ли аналитические методы исследования клиентов, с регулярной актуализацией данных (CustDev, опросы, тесты)?',
//         categoryId: 'marketing',
//         subcategory: 'Аватар клиента',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'customer_avatar_4',
//         text: 'Создана ли база с типовыми клиентскими запросами и решениями?',
//         categoryId: 'marketing',
//         subcategory: 'Аватар клиента',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'customer_avatar_5',
//         text: 'Есть ли персонализированные офферы для разных типов (сегментов) клиентов?',
//         categoryId: 'marketing',
//         subcategory: 'Аватар клиента',
//         answers: yesNoAnswers
//       },
//       // Карта пути клиента (4 questions)
//       {
//         id: 'customer_journey_1',
//         text: 'Вы используете принципы построения карты пути клиента в своем бизнесе?',
//         categoryId: 'marketing',
//         subcategory: 'Карта пути клиента',
//         answers: [
//           { text: 'Нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Полностью', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'customer_journey_2',
//         text: 'Вы анализируете количество и качество точек касания с клиентом до закрытия сделки?',
//         categoryId: 'marketing',
//         subcategory: 'Карта пути клиента',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'customer_journey_3',
//         text: 'Понятны ли критерии (триггеры), по которым клиент принимает решение о покупке?',
//         categoryId: 'marketing',
//         subcategory: 'Карта пути клиента',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'customer_journey_4',
//         text: 'Есть ли стратегия управления жизненным циклом клиента (LTV), за счет переходов между продуктами и повторных продаж (Upsell, Cross- sell)?',
//         categoryId: 'marketing',
//         subcategory: 'Карта пути клиента',
//         answers: yesNoAnswers
//       },
//       // Стратегия и связки (4 questions)
//       {
//         id: 'strategy_1',
//         text: 'Насколько у вас проработана комплексная маркетинговая стратегия с прописанной программой действий на 3/6/12 месяцев?',
//         categoryId: 'marketing',
//         subcategory: 'Стратегия и связки',
//         answers: commonAnswers
//       },
//       {
//         id: 'strategy_2',
//         text: 'Внедрены ли у вас маркетинговые связки и мультиканальные автоворонки (например : лид - магнит + чат-бот + рассылка + консультация)?',
//         categoryId: 'marketing',
//         subcategory: 'Стратегия и связки',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'strategy_3',
//         text: 'Насколько у вас систематизирован процесс тестирования и внедрения маркетинговых гипотез?',
//         categoryId: 'marketing',
//         subcategory: 'Стратегия и связки',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'strategy_4',
//         text: 'Насколько связаны между собой ваши маркетинговые, продуктовые и бизнес - стратегии?',
//         categoryId: 'marketing',
//         subcategory: 'Стратегия и связки',
//         answers: commonAnswers
//       },
//       // Каналы продвижения (6 questions)
//       {
//         id: 'promotion_channels_1',
//         text: 'Насколько предсказуем и стабилен поток клиентов из ваших текущих каналов?',
//         categoryId: 'marketing',
//         subcategory: 'Каналы продвижения',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'promotion_channels_2',
//         text: 'Используется ли омниканальный подход в маркетинге (ССМ, email- маркетинг, event- маркетинг, СРМ -маркетинг, партнерства)?',
//         categoryId: 'marketing',
//         subcategory: 'Каналы продвижения',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'promotion_channels_3',
//         text: 'Насколько ваша маркетинговая стратегия сбалансирована между органическим и платным трафиком?',
//         categoryId: 'marketing',
//         subcategory: 'Каналы продвижения',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'promotion_channels_4',
//         text: 'Применяете ли вы методы ретаргетинга и ремаркетинга?',
//         categoryId: 'marketing',
//         subcategory: 'Каналы продвижения',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'promotion_channels_5',
//         text: 'Достаточно ли у вас ресурсов и компетенций для ведения всех маркетинговых направлений?',
//         categoryId: 'marketing',
//         subcategory: 'Каналы продвижения',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'promotion_channels_6',
//         text: 'Работаете ли вы с внешними подрядчиками и специалистами?',
//         categoryId: 'marketing',
//         subcategory: 'Каналы продвижения',
//         answers: [
//           { text: 'Нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Периодически', color: '#FFA500', range: '4-7' },
//           { text: 'Регулярно', color: '#16a085', range: '8-10' }
//         ]
//       },
//       // Инструменты (4 questions)
//       {
//         id: 'tools_1',
//         text: 'Настроены ли у вас системы аналитики и отслеживания маркетинговых показателей?',
//         categoryId: 'marketing',
//         subcategory: 'Инструменты',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'tools_2',
//         text: 'Как вы оцениваете уровень внедрения инструментов и технологических решений в вашем маркетинге (СRМ, автоматизация сайта, контент -планирование, автопостинг и рассылки, чат-боты и т.д.)?',
//         categoryId: 'marketing',
//         subcategory: 'Инструменты',
//         answers: lowMediumHighAnswers
//       },
//       {
//         id: 'tools_3',
//         text: 'Насколько регулярно проводится аудит и конкурентный анализ используемых маркетинговых инструментов?',
//         categoryId: 'marketing',
//         subcategory: 'Инструменты',
//         answers: rarelyPeriodicRegular
//       },
//       {
//         id: 'tools_4',
//         text: 'Как вы оцениваете уровень интеграции AI- технологий в свою маркетинговую деятельность?',
//         categoryId: 'marketing',
//         subcategory: 'Инструменты',
//         answers: lowMediumHighAnswers
//       }
//     ]
//   },
//   {
//     id: 'hr',
//     title: 'HR',
//     subtitle: 'Оценка команды, процессов делегирования и HR-экономики',
//     totalQuestions: 13,
//     completedQuestions: 0,
//     questions: [
//       // Структура (4 questions)
//       {
//         id: 'hr_structure_1',
//         text: 'Соответствует ли текущая орг. структура и ваша команда задачам и масштабам бизнеса?',
//         categoryId: 'hr',
//         subcategory: 'Структура',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'hr_structure_2',
//         text: 'Насколько прописаны бизнес -процессы, распределены роли и зоны ответственности в команде?',
//         categoryId: 'hr',
//         subcategory: 'Структура',
//         answers: commonAnswers
//       },
//       {
//         id: 'hr_structure_3',
//         text: 'Стратегия масштабирования команды – насколько это для вас актуально?',
//         categoryId: 'hr',
//         subcategory: 'Структура',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'hr_structure_4',
//         text: 'Есть ли система подбора, адаптации и повышения квалификации кадров?',
//         categoryId: 'hr',
//         subcategory: 'Структура',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       // Делегирование (5 questions)
//       {
//         id: 'delegation_1',
//         text: 'Есть ли у вас ассистент или менеджер для делегирования задач?',
//         categoryId: 'hr',
//         subcategory: 'Делегирование',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'delegation_2',
//         text: 'Вы привлекаете внешних подрядчиков (аутсорсинг) для выполнения ваших бизнес - задач?',
//         categoryId: 'hr',
//         subcategory: 'Делегирование',
//         answers: rarelyPeriodicRegular
//       },
//       {
//         id: 'delegation_3',
//         text: 'Насколько эффективно формируются и распределяются задачи внутри команды?',
//         categoryId: 'hr',
//         subcategory: 'Делегирование',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'delegation_4',
//         text: 'Вы удовлетворены системой контроля качества и отчетностью выполнения делегируемых задач?',
//         categoryId: 'hr',
//         subcategory: 'Делегирование',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'delegation_5',
//         text: 'Позволяет ли текущий уровень делегирования масштабировать бизнес?',
//         categoryId: 'hr',
//         subcategory: 'Делегирование',
//         answers: yesNoAnswers
//       },
//       // Экономика (4 questions)
//       {
//         id: 'hr_economics_1',
//         text: 'Насколько детально прописана финансовая модель расходов на персонал?',
//         categoryId: 'hr',
//         subcategory: 'Экономика',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'hr_economics_2',
//         text: 'Можно ли назвать вашу систему мотивации сотрудников комплексной, с использованием всех ключевых инструментов (оклад / проценты / KPI / премии / опционы)?',
//         categoryId: 'hr',
//         subcategory: 'Экономика',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'hr_economics_3',
//         text: 'Регулярно ли проводится аудит эффективности (KPI) сотрудников?',
//         categoryId: 'hr',
//         subcategory: 'Экономика',
//         answers: rarelyPeriodicRegular
//       },
//       {
//         id: 'hr_economics_4',
//         text: 'Контролируются ли затраты на персонал так же детально как ключевые бизнес метрики (выручка, рентабельность и др.)?',
//         categoryId: 'hr',
//         subcategory: 'Экономика',
//         answers: yesNoAnswers
//       }
//     ]
//   },
//   {
//     id: 'sales',
//     title: 'ПРОДАЖИ',
//     subtitle: 'Анализ организации продаж, воронки и экономических показателей',
//     totalQuestions: 15,
//     completedQuestions: 0,
//     questions: [
//       // Организация продаж (5 questions)
//       {
//         id: 'sales_organization_1',
//         text: 'Проработана ли у вас схема организации продаж и насколько она соответствует текущим бизнес -целям?',
//         categoryId: 'sales',
//         subcategory: 'Организация продаж',
//         answers: commonAnswers
//       },
//       {
//         id: 'sales_organization_2',
//         text: 'Разработаны ли сценарии и стандарты общения с клиентами (скрипты) на разных этапах продаж?',
//         categoryId: 'sales',
//         subcategory: 'Организация продаж',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'sales_organization_3',
//         text: 'У вас реализованы стратегии и механики повторных касаний, прогрева и допродаж?',
//         categoryId: 'sales',
//         subcategory: 'Организация продаж',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'sales_organization_4',
//         text: 'Ведётся ли систематизированный анализ причин отказов и разработаны ли стратегии их минимизации?',
//         categoryId: 'sales',
//         subcategory: 'Организация продаж',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'sales_organization_5',
//         text: 'Насколько эффективно отдел продаж взаимодействует с маркетингом, сервисом и другими подразделениями?',
//         categoryId: 'sales',
//         subcategory: 'Организация продаж',
//         answers: minimalPartialMaximal
//       },
//       // Воронка продаж (6 questions)
//       {
//         id: 'sales_funnel_1',
//         text: 'Насколько детально у вас прописана структура воронки продаж для разных типов клиентов и сценариев сделок?',
//         categoryId: 'sales',
//         subcategory: 'Воронка продаж',
//         answers: [
//           { text: 'Слабо', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Максимально', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'sales_funnel_2',
//         text: 'Оптимизированы ли точки входа и конверсии на каждом этапе воронки продаж?',
//         categoryId: 'sales',
//         subcategory: 'Воронка продаж',
//         answers: [
//           { text: 'Скорее нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Да', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'sales_funnel_3',
//         text: 'Контролируете ли вы средний цикл сделки и КЭВ (ключевой этап воронки)?',
//         categoryId: 'sales',
//         subcategory: 'Воронка продаж',
//         answers: commonAnswers
//       },
//       {
//         id: 'sales_funnel_4',
//         text: 'Используется ли CRM- система для управления клиентской базой?',
//         categoryId: 'sales',
//         subcategory: 'Воронка продаж',
//         answers: [
//           { text: 'Нет', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Максимально', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'sales_funnel_5',
//         text: 'Насколько автоматизирован ваш процесс продаж и допродаж (авторассылки, боты - квалификаторы, уведомления и др.)?',
//         categoryId: 'sales',
//         subcategory: 'Воронка продаж',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'sales_funnel_6',
//         text: 'Как часто вы анализируете и перестраиваете воронку продаж?',
//         categoryId: 'sales',
//         subcategory: 'Воронка продаж',
//         answers: rarelyPeriodicRegular
//       },
//       // Экономика продаж (3 questions)
//       {
//         id: 'sales_economics_1',
//         text: 'Существует ли система планирования продаж и насколько предсказуем ваш объём продаж в месяц /квартал /год?',
//         categoryId: 'sales',
//         subcategory: 'Экономика продаж',
//         answers: [
//           { text: 'Слабо', color: '#eb2f06', range: '1-3' },
//           { text: 'Частично', color: '#FFA500', range: '4-7' },
//           { text: 'Максимально', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'sales_economics_2',
//         text: 'Ведется ли учет реальной экономики продаж, аналитика маржинальности продуктов и ключевых метрик (CAC, LTV, ROMI)?',
//         categoryId: 'sales',
//         subcategory: 'Экономика продаж',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'sales_economics_3',
//         text: 'Как часто вы проводите аудит и корректировку системы мотивации отдела продаж?',
//         categoryId: 'sales',
//         subcategory: 'Экономика продаж',
//         answers: rarelyPeriodicRegular
//       },
//       // Управленческие (1 question) - from the JSON this seems to belong to sales
//       {
//         id: 'management_task_control',
//         text: 'Насколько оптимизирован процесс постановки и контроля задач в вашем бизнесе?',
//         categoryId: 'sales',
//         subcategory: 'Управленческие',
//         answers: minimalPartialMaximal
//       }
//     ]
//   },
//   {
//     id: 'automation',
//     title: 'АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ',
//     subtitle: 'Оценка уровня автоматизации бизнес-процессов и внедрения AI',
//     totalQuestions: 8,
//     completedQuestions: 0,
//     questions: [
//       // Автоматизация (5 questions)
//       {
//         id: 'automation_1',
//         text: 'Насколько автоматизирован процесс взаимодействия с клиентами?',
//         categoryId: 'automation',
//         subcategory: 'Автоматизация',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'automation_2',
//         text: 'Насколько автоматизированы сервисы для внутренней работы?',
//         categoryId: 'automation',
//         subcategory: 'Автоматизация',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'automation_3',
//         text: 'Внедрена ли система защиты данных (кибербезопасность)?',
//         categoryId: 'automation',
//         subcategory: 'Автоматизация',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'automation_4',
//         text: 'Ведется ли учет и планирование затрат на автоматизацию?',
//         categoryId: 'automation',
//         subcategory: 'Автоматизация',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'automation_5',
//         text: 'Как оцениваете адаптацию к новым технологическим трендам?',
//         categoryId: 'automation',
//         subcategory: 'Автоматизация',
//         answers: lowMediumHighAnswers
//       },
//       // Внедрение AI (3 questions)
//       {
//         id: 'ai_implementation_1',
//         text: 'Как оцениваете внедрение AI в бизнес-процессы?',
//         categoryId: 'automation',
//         subcategory: 'Внедрение AI',
//         answers: lowMediumHighAnswers
//       },
//       {
//         id: 'ai_implementation_2',
//         text: 'Прогнозировался ли экономический эффект от внедрения AI?',
//         categoryId: 'automation',
//         subcategory: 'Внедрение AI',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'ai_implementation_3',
//         text: 'Используете ли AI для новых продуктов и направлений?',
//         categoryId: 'automation',
//         subcategory: 'Внедрение AI',
//         answers: yesNoAnswers
//       }
//     ]
//   },
//   {
//     id: 'metrics',
//     title: 'МЕТРИКИ И АНАЛИТИКА',
//     subtitle: 'Контроль ключевых показателей и аналитических систем',
//     totalQuestions: 6,
//     completedQuestions: 0,
//     questions: [
//       // Метрики (3 questions)
//       {
//         id: 'metrics_1',
//         text: 'Насколько регулярно замеряются ключевые бизнес-метрики?',
//         categoryId: 'metrics',
//         subcategory: 'Метрики',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'metrics_2',
//         text: 'Как оцениваете контроль маркетинга и продаж по метрикам?',
//         categoryId: 'metrics',
//         subcategory: 'Метрики',
//         answers: lowMediumHighAnswers
//       },
//       {
//         id: 'metrics_3',
//         text: 'Как часто пересматриваются KPI и система мотивации?',
//         categoryId: 'metrics',
//         subcategory: 'Метрики',
//         answers: rarelyPeriodicRegular
//       },
//       // Аналитика (3 questions)
//       {
//         id: 'analytics_1',
//         text: 'Насколько прозрачна и автоматизирована отчетность?',
//         categoryId: 'metrics',
//         subcategory: 'Аналитика',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'analytics_2',
//         text: 'Используется ли аналитика для прогнозирования финансовых показателей?',
//         categoryId: 'metrics',
//         subcategory: 'Аналитика',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'analytics_3',
//         text: 'Как оцениваете внедрение AI в аналитику данных?',
//         categoryId: 'metrics',
//         subcategory: 'Аналитика',
//         answers: lowMediumHighAnswers
//       }
//     ]
//   },
//   {
//     id: 'competencies',
//     title: 'КАРТА КОМПЕТЕНЦИЙ',
//     subtitle: 'Анализ профессиональных, социальных и управленческих навыков',
//     totalQuestions: 15,
//     completedQuestions: 0,
//     questions: [
//       // Профессиональные (4 questions)
//       {
//         id: 'professional_1',
//         text: 'Подтверждены ли компетенции дипломами и кейсами?',
//         categoryId: 'competencies',
//         subcategory: 'Профессиональные',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'professional_2',
//         text: 'Состоите ли в профессиональных сообществах и клубах?',
//         categoryId: 'competencies',
//         subcategory: 'Профессиональные',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'professional_3',
//         text: 'Выступаете ли как эксперт на мероприятиях?',
//         categoryId: 'competencies',
//         subcategory: 'Профессиональные',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'professional_4',
//         text: 'Как оцениваете инвестиции в обучение и новые навыки?',
//         categoryId: 'competencies',
//         subcategory: 'Профессиональные',
//         answers: lowMediumHighAnswers
//       },
//       // Социальные (4 questions)
//       {
//         id: 'social_1',
//         text: 'Насколько развиты навыки нетворкинга?',
//         categoryId: 'competencies',
//         subcategory: 'Социальные',
//         answers: minimalPartialMaximal
//       },
//       {
//         id: 'social_2',
//         text: 'Способствуют ли связи росту клиентской базы?',
//         categoryId: 'competencies',
//         subcategory: 'Социальные',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'social_3',
//         text: 'Есть ли стратегия расширения влияния через связи?',
//         categoryId: 'competencies',
//         subcategory: 'Социальные',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'social_4',
//         text: 'Достаточно ли отзывов и кейсов для доверия?',
//         categoryId: 'competencies',
//         subcategory: 'Социальные',
//         answers: yesNoAnswers
//       },
//       // Личностные (4 questions)
//       {
//         id: 'personal_1',
//         text: 'Как оцениваете развитие soft skills?',
//         categoryId: 'competencies',
//         subcategory: 'Личностные',
//         answers: lowMediumHighAnswers
//       },
//       {
//         id: 'personal_2',
//         text: 'Удается ли поддерживать work-life balance?',
//         categoryId: 'competencies',
//         subcategory: 'Личностные',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'personal_3',
//         text: 'Способны ли управлять стрессом?',
//         categoryId: 'competencies',
//         subcategory: 'Личностные',
//         answers: yesNoAnswers
//       },
//       {
//         id: 'personal_4',
//         text: 'Есть ли стратегия саморазвития?',
//         categoryId: 'competencies',
//         subcategory: 'Личностные',
//         answers: yesNoAnswers
//       },
//       // Управленческие (3 questions)
//       {
//         id: 'management_1',
//         text: 'Какая характеристика ближе — Стратег, Управленец, Созидатель?',
//         categoryId: 'competencies',
//         subcategory: 'Управленческие',
//         answers: [
//           { text: 'Созидатель', color: '#eb2f06', range: '1-3' },
//           { text: 'Управленец', color: '#FFA500', range: '4-7' },
//           { text: 'Стратег', color: '#16a085', range: '8-10' }
//         ]
//       },
//       {
//         id: 'management_2',
//         text: 'Как оцениваете навык управления ресурсами и процессами?',
//         categoryId: 'competencies',
//         subcategory: 'Управленческие',
//         answers: lowMediumHighAnswers
//       },
//       {
//         id: 'management_3',
//         text: 'Насколько оптимизирован процесс постановки и контроля задач?',
//         categoryId: 'competencies',
//         subcategory: 'Управленческие',
//         answers: minimalPartialMaximal
//       }
//     ]
//   }
// ];

// // Express survey with key questions (subset of full survey)
// const expressSurveyData: Category[] = fullSurveyData.map(category => ({
//   ...category,
//   totalQuestions: Math.ceil(category.totalQuestions / 2), // Roughly half the questions
//   questions: category.questions.filter((_, index) => index % 2 === 0) // Take every other question
// }));

// export function getSurveyData(variant: SurveyVariant): Category[] {
//   return variant === 'full' ? fullSurveyData : expressSurveyData;
// }

// Express survey questions (60 questions, 6 categories)
const expressSurveyQuestions = [
  {
    "category": "ПРОДУКТ",
    "subcategory": "Продуктовая линейка",
    "question": "Насколько детально проработана структура вашей продуктовой линейки (консультации , групповые программы , курсы , корпоративные решения )?Слабо",
    "answers": [
      {
        "text": "Слабо",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Продуктовая линейка",
    "question": "Прописаны ли конкурентоспособные УТП для каждого продукта (услуги ) в вашей линейке?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Продуктовая линейка",
    "question": "Какой , по-вашему , потенциал масштабируемости бизнеса у текущей продуктовой линейки?Низкий",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Средний",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Высокий",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Личный бренд",
    "question": "Есть ли у вас описаная концепция вашего экспертного позиционирования и понимание того , чем вы отличаетесь от других специалистов в вашей нише?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Личный бренд",
    "question": "Ваша целевая аудитория понимает , какую ценность вы предлагаете и почему именно к вам стоит обратиться?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Личный бренд",
    "question": "Как вы оцениваете свое присутствие в ключевых медиаканалах (соцсети , статьи , видео , книги , выступления )?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Личный бренд",
    "question": "Состоите ли вы в профессиональных сообществах , ассоциациях и присутствуете ли на профессиональных платформах?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Личный бренд",
    "question": "Насколько ваш личный бренд помогает вам в продаже услуг и повышении доверия клиентов?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Монетизация",
    "question": "Есть ли у вас финансовая модель с расчетами планового дохода , прибыли и точек роста?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Монетизация",
    "question": "Прописаны ли механизмы скидок , бонусов , программ лояльности?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Монетизация",
    "question": "Рассчитывается ли себестоимость и прибыльность каждого продукта?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Аватар клиента",
    "question": "Разработаны ли аватары клиентов (описание болей , потребностей , возражений ) и сформирован ли детализированный портрет целевого клиента?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Аватар клиента",
    "question": "Используются ли аналитические методы исследования клиентов , с регулярной актуализацией данных (CustDev, опросы , тесты )?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Аватар клиента",
    "question": "Создана ли база с типовыми клиентскими запросами и решениями?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Аватар клиента",
    "question": "Есть ли персонализированные офферы для разных типов (сегментов ) клиентов?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Стратегия и связки",
    "question": "Внедрены ли у вас маркетинговые связки и мультиканальные автоворонки (например : лид - магнит + чат-бот + рассылка + консультация )?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Стратегия и связки",
    "question": "Насколько у вас систематизирован процесс тестирования и внедрения маркетинговых гипотез?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Стратегия и связки",
    "question": "Насколько связаны между собой ваши маркетинговые , продуктовые и бизнес - стратегии?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Стратегия и связки",
    "question": "Как вы оцениваете уровень интеграции AI-технологий в свою маркетинговую деятельность?Низкий",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Средний",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Высокий",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Каналы продвижения",
    "question": "Насколько предсказуем и стабилен поток клиентов из ваших текущих каналов?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Каналы продвижения",
    "question": "Насколько ваша маркетинговая стратегия сбалансирована между органическим и платным трафиком?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Каналы продвижения",
    "question": "Достаточно ли у вас ресурсов и компетенций для ведения всех маркетинговых направлений?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Каналы продвижения",
    "question": "Работаете ли вы с внешними подрядчиками и специалистами?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "7 Да, регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Делегирование",
    "question": "Соответствует ли текущая орг. структура и ваша команда задачам и масштабам бизнеса?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Делегирование",
    "question": "Есть ли у вас ассистент или менеджер для делегирования задач?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Делегирование",
    "question": "Вы удовлетворены системой контроля качества и отчетностью выполнения делегируемых задач?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Делегирование",
    "question": "Позволяет ли текущий уровень делегирования масштабировать бизнес?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Экономика",
    "question": "Вы привлекаете внешних подрядчиков (аутсорсинг ) для выполнения ваших бизнес - задач?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Экономика",
    "question": "Регулярно ли проводится аудит эффективности (KPI) сотрудников или внешних подрядчиков?Редко",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Экономика",
    "question": "Контролируются ли затраты на персонал и внешних подрядчиков , так же деьально как ключевые бизнес метрики (выручка , рентабельность и др.)?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Организация продаж",
    "question": "Проработана ли у вас схема организации продаж и насколько она соответствует текущим бизнес -целям?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Организация продаж",
    "question": "Разработаны ли сценарии и стандарты общения с клиентами (скрипты ) на разных этапах продаж?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Организация продаж",
    "question": "У вас реализованы стратегии и механики повторных касаний , прогрева и допродаж?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Организация продаж",
    "question": "Существует ли система планирования продаж и насколько предсказуем ваш объём продаж в месяц /квартал /год?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Воронка продаж",
    "question": "Насколько детально у вас прописана структура воронки продаж для разных типов клиентов и сценариев сделок?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Воронка продаж",
    "question": "Контролируете ли вы средний цикл сделки и КЭВ (ключевой этап воронки )?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Воронка продаж",
    "question": "Используется ли CRM- система для управления клиентской базой?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Воронка продаж",
    "question": "Насколько автоматизирован ваш процесс продаж и допродаж (авторассылки , боты - квалификаторы , уведомления и др.)?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Автоматизация",
    "question": "Насколько у вас автоматизирован процесс взаимодействия с клиентами (CRM- система , платформы для автоматизации маркетинга и продаж )?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Автоматизация",
    "question": "Насколько оптимизированы и автоматизированы сервисы для внутренней работы (документооборот , планирование , командные коммуникации )?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Автоматизация",
    "question": "У вас внедрена система защиты ваших данных и интеллектуальной собственности (кибербезопасность )?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Внедрение AI-технологий",
    "question": "Как вы оцениваете уровень внедрения AI- инструментов в ваши бизнес-процессы?Низкий",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Средний",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Высокий",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Внедрение AI-технологий",
    "question": "Оцениваете ли вы возможности AI-технологий для создания новых продуктов и бизнес направлений?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Метрики",
    "question": "Насколько регулярно вы замеряете ключевые бизнес -метрики (Revenue, CAC, ARPPU, ROMI, LTV, NPS и др.)?Редко",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Метрики",
    "question": "Насколько у вас прозрачная и автоматизированная система отчетности (РНП , PnL, ДДС , дашборды )Слабая",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частичная",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Оптимальная",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Профессиональные",
    "question": "Подтверждены ли ваши профессиональные навыки и компетенции дипломами , сертификатами или отраслевыми кейсами?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Профессиональные",
    "question": "Состоите ли вы в профессиональных сообществах , клубах и ассоциациях?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Профессиональные",
    "question": "Вы выступаете в качестве спикера или эксперта на деловых и отраслевых мероприятиях (форумы , конференции )?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "7 Да, регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Профессиональные",
    "question": "Как вы оцениваете инвестиции в свое обучение , развитие компетенций и получение новых навыков?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Социальные",
    "question": "Насколько у вас развиты навыки нетворкинга и делового общения?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Социальные",
    "question": "Насколько социальные связи и ваш личный бренд способствуют росту клиентской базы?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Социальные",
    "question": "Есть ли у вас стратегия расширения влияния через выстраивание социальных связей?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Социальные",
    "question": "Достаточно ли отзывов и кейсов для повышения доверия? Насколько ваши клиенты и партнеры готовы рекомендовать вас?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Личностные",
    "question": "Как вы оцениваете себя с точки зрения развития своих «мягких навыков » (soft skills)?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Относительно",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Оптимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Личностные",
    "question": "Удается ли вам поддерживать баланс между работой и личной жизнью?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Личностные",
    "question": "Способны ли вы эффективно управлять стрессом и нагрузками?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Личностные",
    "question": "Есть ли у вас стратегия саморазвития и личностного роста?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Управленческие",
    "question": "Выберите свою характеристику - Стратег , Управленец , Созидатель?Стратег",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Управленец",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Созидатель",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Управленческие",
    "question": "Как вы оцениваете свой навык эффективного управления ресурсами и процессами?Низкий",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Средний",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Высокий",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Управленческие",
    "question": "Насколько оптимизирован процесс постановки и контроля задач в вашем бизнесе?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  }
];

// Full survey questions (96 questions, 7 categories)
const fullSurveyQuestions = [
  {
    "category": "ПРОДУКТ",
    "subcategory": "Продуктовая линейка",
    "question": "Насколько детально проработана структура вашей продуктовой линейки (консультации , групповые программы , курсы , корпоративные решения )?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Продуктовая линейка",
    "question": "Прописана ли ролевая модель каждого продукта согласно стратегии вовлечения клиентов (лид -магнит , трипвайер , основной продукт , бандлы , максимизаторы прибыли и т. д.)?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Продуктовая линейка",
    "question": "Прописаны ли конкурентоспособные УТП для каждого продукта (услуги ) в вашей линейке?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Продуктовая линейка",
    "question": "Ведется ли регулярный анализ продуктовой линейки и вносятся ли корректировки с учетом обратной связи клиентов и рыночной конъюнктуры?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Продуктовая линейка",
    "question": "Какой , по-вашему , потенциал масштабируемости бизнеса у текущей продуктовой линейки?Низкий",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Средний",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Высокий",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Личный бренд",
    "question": "Есть ли у вас описаная концепция вашего экспертного позиционирования и понимание того , чем вы отличаетесь от других специалистов в вашей нише?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Личный бренд",
    "question": "Ваша целевая аудитория понимает , какую ценность вы предлагаете и почему именно к вам стоит обратиться?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Личный бренд",
    "question": "Как вы оцениваете свое присутствие в ключевых медиаканалах (соцсети , статьи , видео , книги , выступления )?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Личный бренд",
    "question": "Состоите ли вы в профессиональных сообществах , ассоциациях и присутствуете ли на профессиональных платформах?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Личный бренд",
    "question": "Выстроена ли стратегия контент -маркетинга для продвижения личного бренда?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Личный бренд",
    "question": "Работаете ли вы с PR-специалистами или медиа -экспертами для усиления узнаваемости?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Личный бренд",
    "question": "Насколько ваш личный бренд помогает вам в продаже услуг и повышении доверия клиентов?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Монетизация",
    "question": "Есть ли у вас финансовая модель с расчетами планового дохода , прибыли и точек роста?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Монетизация",
    "question": "Есть ли механизм A/B тестирования ценовых предложений для определения оптимальных стратегий (разовые продажи , подписки , пакеты , групповые программы )?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Монетизация",
    "question": "Прописаны ли механизмы скидок , бонусов , программ лояльности?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Монетизация",
    "question": "Есть ли у вас стратегия повышения среднего чека , включая персонализированные предложения и премиум -услуги?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДУКТ",
    "subcategory": "Монетизация",
    "question": "Рассчитывается ли себестоимость и прибыльность каждого продукта?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Аватар клиента",
    "question": "Насколько глубоко сегментирована ваша клиентская база по ключевым параметрам (ценность , поведение , потребности )?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Аватар клиента",
    "question": "Разработаны ли аватары клиентов (описание болей , потребностей , возражений ) и сформирован ли детализированный портрет целевого клиента?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Аватар клиента",
    "question": "Используются ли аналитические методы исследования клиентов , с регулярной актуализацией данных (CustDev, опросы , тесты )?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Аватар клиента",
    "question": "Создана ли база с типовыми клиентскими запросами и решениями?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Аватар клиента",
    "question": "Есть ли персонализированные офферы для разных типов (сегментов ) клиентов?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Карта пути клиента",
    "question": "Вы используете принципы построения карты пути клиента в своем бизнесе?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Карта пути клиента",
    "question": "Вы анализируете количество и качество точек касания с клиентом до закрытия сделки?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Карта пути клиента",
    "question": "Понятны ли критерии (триггеры ), по которым клиент принимает решение о покупке?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Карта пути клиента",
    "question": "Есть ли стратегия управления жизненным циклом клиента (LTV), за счет переходов между продуктами и повторных продаж (Upsell, Cross- sell)? Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Стратегия и связки",
    "question": "Насколько у вас проработана комплексная маркетинговая стратегия с прописанной программой действий на 3/6/12 месяцев?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Стратегия и связки",
    "question": "Внедрены ли у вас маркетинговые связки и мультиканальные автоворонки (например : лид - магнит + чат-бот + рассылка + консультация )?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Стратегия и связки",
    "question": "Насколько у вас систематизирован процесс тестирования и внедрения маркетинговых гипотез?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Стратегия и связки",
    "question": "Насколько связаны между собой ваши маркетинговые , продуктовые и бизнес - стратегии?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Каналы продвижения",
    "question": "Насколько предсказуем и стабилен поток клиентов из ваших текущих каналов?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Каналы продвижения",
    "question": "Используется ли омниканальный подход в маркетинге (ССМ , email- маркетинг , event- маркетинг , СРМ -маркетинг , партнерства )?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Каналы продвижения",
    "question": "Насколько ваша маркетинговая стратегия сбалансирована между органическим и платным трафиком?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Каналы продвижения",
    "question": "Применяете ли вы методы ретаргетинга и ремаркетинга?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Каналы продвижения",
    "question": "Достаточно ли у вас ресурсов и компетенций для ведения всех маркетинговых направлений?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Каналы продвижения",
    "question": "Работаете ли вы с внешними подрядчиками и специалистами?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "7 Да, регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Инструменты",
    "question": "Настроены ли у вас системы аналитики и отслеживания маркетинговых показателей? Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Инструменты",
    "question": "Как вы оцениваете уровень внедрения инструментов и технологических решений в вашем маркетинге (СRМ, автоматизация сайта , контент -планирование , автопостинг и рассылки , чат-боты и т.д.)?Низкий",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Средний",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Высокий",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Инструменты",
    "question": "Насколько регулярно проводится аудит и конкурентный анализ используемых маркетинговых инструментов?Редко",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МАРКЕТИНГ",
    "subcategory": "Инструменты",
    "question": "Как вы оцениваете уровень интеграции AI-технологий в свою маркетинговую деятельность?Низкий",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Средний",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Высокий",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Структура",
    "question": "Соответствует ли текущая орг. структура и ваша команда задачам и масштабам бизнеса?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Структура",
    "question": "Насколько прописаны бизнес-процессы , распределены роли и зоны ответственности в команде?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Структура",
    "question": "Стратегия масштабирования команды – насколько это для вас актуально?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Структура",
    "question": "Есть ли система подбора , адаптации и повышения квалификации кадров?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Делегирование",
    "question": "Есть ли у вас ассистент или менеджер для делегирования задач?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Делегирование",
    "question": "Вы привлекаете внешних подрядчиков (аутсорсинг ) для выполнения ваших бизнес - задач?Редко",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Делегирование",
    "question": "Насколько эффективно формируются и распределяются задачи внутри команды?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Делегирование",
    "question": "Вы удовлетворены системой контроля качества и отчетностью выполнения делегируемых задач?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Делегирование",
    "question": "Позволяет ли текущий уровень делегирования масштабировать бизнес?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Экономика",
    "question": "Насколько детально прописана финансовая модель расходов на персонал?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Экономика",
    "question": "Можно ли назвать вашу систему мотивации сотрудников комплексной , с использованием всех ключевых инструментов (оклад / проценты / KPI / премии / опционы )?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Экономика",
    "question": "Регулярно ли проводится аудит эффективности (KPI) сотрудников?Редко",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "HR",
    "subcategory": "Экономика",
    "question": "Контролируются ли затраты на персонал так же деьально как ключевые бизнес метрики (выручка , рентабельность и др.)?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Организация продаж",
    "question": "Проработана ли у вас схема организации продаж и насколько она соответствует текущим бизнес -целям?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Организация продаж",
    "question": "Разработаны ли сценарии и стандарты общения с клиентами (скрипты ) на разных этапах продаж?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Организация продаж",
    "question": "У вас реализованы стратегии и механики повторных касаний , прогрева и допродаж?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Организация продаж",
    "question": "Ведётся ли систематизированный анализ причин отказов и разработаны ли стратегии их минимизации?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Организация продаж",
    "question": "Насколько эффективно отдел продаж взаимодействует с маркетингом , сервисом и другими подразделениями?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Воронка продаж",
    "question": "Насколько детально у вас прописана структура воронки продаж для разных типов клиентов и сценариев сделок?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Воронка продаж",
    "question": "Оптимизированы ли точки входа и конверсии на каждом этапе воронки продаж?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Воронка продаж",
    "question": "Контролируете ли вы средний цикл сделки и КЭВ (ключевой этап воронки )?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Полностью",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Воронка продаж",
    "question": "Используется ли CRM- система для управления клиентской базой?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Воронка продаж",
    "question": "Насколько автоматизирован ваш процесс продаж и допродаж (авторассылки , боты - квалификаторы , уведомления и др.)?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Воронка продаж",
    "question": "Как часто вы анализируете и перестраиваете воронку продаж?Редко",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Экономика",
    "question": "продажСуществует ли система планирования продаж и насколько предсказуем ваш объём продаж в месяц /квартал /год?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Экономика",
    "question": "продажВедется ли учет реальной экономики продаж , аналитика маржинальности продуктов и ключевых метрик (CAC, LTV, ROMI)?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "ПРОДАЖИ",
    "subcategory": "Экономика",
    "question": "продажКак часто вы проводите аудит и корректировку системы мотивации отдела продаж?Редко",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Автоматизация",
    "question": "Насколько у вас автоматизирован процесс взаимодействия с клиентами (CRM- система , платформы для автоматизации маркетинга и продаж )?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Автоматизация",
    "question": "Насколько оптимизированы и автоматизированы сервисы для внутренней работы (документооборот , планирование , командные коммуникации )?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Автоматизация",
    "question": "У вас внедрена система защиты ваших данных и интеллектуальной собственности (кибербезопасность )?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Автоматизация",
    "question": "Вы ведете учет и планирование затрат на автоматизацию бизнес -процессов?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Автоматизация",
    "question": "Как вы оцениваете уровень адаптации ваших сотрудников и бизнеса в целом к новым технологическим трендам?Низкий",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Средний",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Высокий",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Внедрение AI-технологий",
    "question": "Как вы оцениваете уровень внедрения AI- инструментов в ваши бизнес-процессы?Низкий",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Средний",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Высокий",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Внедрение AI-технологий",
    "question": "Вы прогнозировали или рассчитывали экономические эффекты от внедрения AI-технологий?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "АВТОМАТИЗАЦИЯ И ТЕХНОЛОГИИ",
    "subcategory": "Внедрение AI-технологий",
    "question": "Оцениваете ли вы возможности AI-технологий для создания новых продуктов и бизнес направлений?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МЕТРИКИ И АНАЛИТИКА",
    "subcategory": "Метрики",
    "question": "Насколько регулярно вы замеряете ключевые бизнес -метрики (Revenue, CAC, ARPPU, ROMI, LTV, NPS и др.)?Редко",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МЕТРИКИ И АНАЛИТИКА",
    "subcategory": "Метрики",
    "question": "Как вы оцениваете свой уровень контроля эфф��ктивности маркетинга и продаж по ключевым метрикам (Revenue, CAC, ROMI, LTV, NPS и др.)?Низкий",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Средний",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Высокий",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МЕТРИКИ И АНАЛИТИКА",
    "subcategory": "Метрики",
    "question": "Как часто вы пересматриваете KPI и систему мотивации сотрудников?Редко",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МЕТРИКИ И АНАЛИТИКА",
    "subcategory": "Аналитика",
    "question": "Насколько у вас прозрачная и автоматизированная система отчетности (РНП , PnL, ДДС , дашборды )Слабая",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частичная",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Оптимальная",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МЕТРИКИ И АНАЛИТИКА",
    "subcategory": "Аналитика",
    "question": "Используется ли аналитика данных для планирования и создания прогнозной модели финансовых показателей бизнеса?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "МЕТРИКИ И АНАЛИТИКА",
    "subcategory": "Аналитика",
    "question": "Как вы оцениваете уровень внедрения AI- инструментов для обработки и аналитики ваших данных?Низкий",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Средний",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Высокий",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Профессиональные",
    "question": "Подтверждены ли ваши профессиональные навыки и компетенции дипломами , сертификатами или отраслевыми кейсами?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Профессиональные",
    "question": "Состоите ли вы в профессиональных сообществах , клубах и ассоциациях?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Профессиональные",
    "question": "Вы выступаете в качестве спикера или эксперта на деловых и отраслевых мероприятиях (форумы , конференции )?Нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Периодически",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "7 Да, регулярно",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Профессиональные",
    "question": "Как вы оцениваете инвестиции в свое обучение , развитие компетенций и получение новых навыков?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Социальные",
    "question": "Насколько у вас развиты навыки нетворкинга и делового общения?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Социальные",
    "question": "Насколько социальные связи и ваш личный бренд способствуют росту клиентской базы?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Социальные",
    "question": "Есть ли у вас стратегия расширения влияния через выстраивание социальных связей?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Социальные",
    "question": "Достаточно ли отзывов и кейсов для повышения доверия? Насколько ваши клиенты и партнеры готовы рекомендовать вас?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Личностные",
    "question": "Как вы оцениваете себя с точки зрения развития своих «мягких навыков » (soft skills)?Слабо",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Относительно",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Оптимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Личностные",
    "question": "Удается ли вам поддерживать баланс между работой и личной жизнью?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Личностные",
    "question": "Способны ли вы эффективно управлять стрессом и нагрузками?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Личностные",
    "question": "Есть ли у вас стратегия саморазвития и личностного роста?Скорее нет",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Да",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Управленческие",
    "question": "Выберите свою характеристику - Стратег , Управленец , Созидатель?Стратег",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Управленец",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Созидатель",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Управленческие",
    "question": "Как вы оцениваете свой навык эффективного управления ресурсами и процессами?Низкий",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Средний",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Высокий",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  },
  {
    "category": "КАРТА КОМПЕТЕНЦИЙ",
    "subcategory": "Управленческие",
    "question": "Насколько оптимизирован процесс постановки и контроля задач в вашем бизнесе?Минимально",
    "answers": [
      {
        "text": "—",
        "color": "#eb2f06",
        "range": "1-3"
      },
      {
        "text": "- 3 Частично",
        "color": "#FFA500",
        "range": "4-7"
      },
      {
        "text": "- 7 Максимально",
        "color": "#16a085",
        "range": "8-10"
      }
    ]
  }
];

// Process raw questions into proper format
function processRawQuestions(rawQuestions: any[], variant: SurveyVariant): Question[] {
  return rawQuestions.map((item, index) => {
    // Extract the question text and hint (if any)
    const parts = item.question.split('?');
    const questionText = parts[0] + '?';
    const hint = parts[1] || '';

    return {
      id: `${variant}_q${index + 1}`,
      text: questionText,
      category: item.category,
      subcategory: item.subcategory,
      hint: hint,
      answers: item.answers.map((answer: any, answerIndex: number) => ({
        id: answerIndex + 1,
        text: answer.text,
        value: answerIndex + 1,
        color: answer.color,
        range: answer.range
      }))
    };
  });
}

const expressQuestions = processRawQuestions(expressSurveyQuestions, 'express');
const fullQuestions = processRawQuestions(fullSurveyQuestions, 'full');

// Define survey variants
export const surveyVariants: Record<SurveyVariant, {
  name: string;
  description: string;
  questions: Question[];
}> = {
  express: {
    name: 'Экспресс',
    description: '60 вопросов в 6 категориях',
    questions: expressQuestions
  },
  full: {
    name: 'Полная',
    description: '96 вопросов в 7 категориях',
    questions: fullQuestions
  }
};

// Generate categories from questions
function generateCategories(questions: Question[]): Category[] {
  const categoryMap = new Map<string, {
    subcategories: Set<string>;
    questionCount: number;
  }>();

  // Count questions by category and collect subcategories
  questions.forEach(question => {
    if (!categoryMap.has(question.category)) {
      categoryMap.set(question.category, {
        subcategories: new Set(),
        questionCount: 0
      });
    }
    
    const categoryData = categoryMap.get(question.category)!;
    categoryData.subcategories.add(question.subcategory);
    categoryData.questionCount++;
  });

  // Convert to Category objects
  return Array.from(categoryMap.entries()).map(([categoryName, data]) => ({
    id: categoryName.toLowerCase().replace(/\s+/g, '_'),
    name: categoryName,
    subcategories: Array.from(data.subcategories),
    totalQuestions: data.questionCount,
    completedQuestions: 0
  }));
}

export const expressCategories = generateCategories(expressQuestions);
export const fullCategories = generateCategories(fullQuestions);

// Export questions for each variant
export const getQuestionsForVariant = (variant: SurveyVariant): Question[] => {
  return surveyVariants[variant].questions;
};

export const getCategoriesForVariant = (variant: SurveyVariant): Category[] => {
  return variant === 'express' ? expressCategories : fullCategories;
};

// Verify question counts
console.log('Express survey questions:', expressQuestions.length); // Should be 60
console.log('Full survey questions:', fullQuestions.length); // Should be 96
console.log('Express categories:', expressCategories.length); // Should be 6
console.log('Full categories:', fullCategories.length); // Should be 7