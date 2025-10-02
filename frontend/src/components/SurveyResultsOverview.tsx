import { SurveyResults } from 'bizass-shared';
import { CircularProgress } from './CircularProgress';

interface SurveyResultsOverviewProps {
  results: SurveyResults;
  surveyType: 'express' | 'full';
}

export function SurveyResultsOverview({ results, surveyType }: SurveyResultsOverviewProps) {
  const emoji = surveyType === 'express' ? '⚡' : '📊';
  const title = surveyType === 'express' ? 'Экспресс-опрос' : 'Полный чек-ап';
  const bgColor = surveyType === 'express' ? 'bg-teal-100' : 'bg-pink-100';

  return (
    <div className="bg-white rounded-lg p-6 mb-6 border">
      <div className="text-center mb-4">
        <div className={`inline-flex items-center justify-center w-16 h-16 ${bgColor} rounded-full mb-3`}>
          <span className="text-2xl">{emoji}</span>
        </div>
        <h2 className="text-lg font-medium text-slate-800 mb-2">{title}</h2>
        <p className="text-sm text-slate-600">Завершено</p>
      </div>

      <div className="flex justify-center mb-6">
        <CircularProgress
          percentage={results.overallScore}
          color={results.overallContent.color}
          size={120}
        />
      </div>

      <div className="space-y-3 text-center">
        <h3 className="font-medium text-slate-800">
          {results.overallContent.titleSummary}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          {results.overallContent.resultDescription}
        </p>
      </div>
    </div>
  );
}
