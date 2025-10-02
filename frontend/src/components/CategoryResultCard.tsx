import { CategoryResult } from 'bizass-shared';
import { ChevronRight } from 'lucide-react';

interface CategoryResultCardProps {
  category: CategoryResult;
  index: number;
  onClick: () => void;
}

export function CategoryResultCard({ category, index, onClick }: CategoryResultCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-3 border flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
          style={{
            backgroundColor: `${category.content.color}20`,
            color: category.content.color
          }}
        >
          {index + 1}
        </div>
        <div>
          <p className="font-medium text-sm text-slate-800">{category.name}</p>
          <p className="text-xs text-slate-500">{Math.round(category.score)}%</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-16 bg-slate-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: category.content.color,
              width: `${Math.min(category.score, 100)}%`
            }}
          />
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    </div>
  );
}
