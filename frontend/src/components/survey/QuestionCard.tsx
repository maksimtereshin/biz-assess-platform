import React, { useState } from 'react';

interface QuestionCardProps {
  question: {
    id: number;
    text: string;
  };
  onAnswer: (score: number) => void;
  isSubmitting?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  onAnswer, 
  isSubmitting = false 
}) => {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  const handleScoreSelect = (score: number) => {
    if (isSubmitting) return;
    
    setSelectedScore(score);
    onAnswer(score);
  };

  const scoreButtons = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="question-text mb-8 text-center">
          {question.text}
        </h2>
        
        <div className="flex justify-center">
          <div className="grid grid-cols-5 gap-3 max-w-md">
            {scoreButtons.map((score) => (
              <button
                key={score}
                onClick={() => handleScoreSelect(score)}
                disabled={isSubmitting}
                className={`
                  answer-button
                  ${selectedScore === score ? 'answer-button-selected' : ''}
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                aria-label={`Rate ${score} out of 10`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-6 text-xs text-gray-500">
          <span>Poor</span>
          <span>Excellent</span>
        </div>
        
        {isSubmitting && (
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-2 text-sm text-primary-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <span>Saving...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;
