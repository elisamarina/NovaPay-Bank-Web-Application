import React from "react";

const Category = ({ category }: CategoryProps) => {
  const percentage =
    category.totalCount > 0
      ? Math.round((category.count / category.totalCount) * 100)
      : 0;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-14 font-semibold text-gray-700">
          {category.name}
        </p>
        <p className="text-12 text-gray-500">
          {category.count} transactions
        </p>
      </div>
      <span className="text-14 font-semibold text-bankGradient">
        {percentage}%
      </span>
    </div>
  );
};

export default Category;
