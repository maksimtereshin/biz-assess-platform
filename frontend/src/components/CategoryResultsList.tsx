import { useNavigate } from 'react-router-dom';
import { CategoryResult } from 'bizass-shared';
import { CategoryResultCard } from './CategoryResultCard';

interface CategoryResultsListProps {
  categories: CategoryResult[];
  sessionId: string;
  surveyType: 'express' | 'full';
}

export function CategoryResultsList({ categories, sessionId, surveyType }: CategoryResultsListProps) {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/${surveyType}/${sessionId}/results/category/${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="mt-8">
      <h3 className="font-medium text-slate-800 mb-4">Результаты по категориям</h3>
      <div className="space-y-2">
        {categories.map((category, index) => (
          <CategoryResultCard
            key={category.name}
            category={category}
            index={index}
            onClick={() => handleCategoryClick(category.name)}
          />
        ))}
      </div>
    </div>
  );
}
