import React from 'react';

interface SurveyHeaderProps {
  categoryName: string;
  subcategoryName: string;
}

const SurveyHeader: React.FC<SurveyHeaderProps> = ({ categoryName, subcategoryName }) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Business Assessment
          </h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">{categoryName}</span>
            <span className="text-gray-400">•</span>
            <span>{subcategoryName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyHeader;
