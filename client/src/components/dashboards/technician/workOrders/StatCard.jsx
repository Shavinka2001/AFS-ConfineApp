import React from 'react';

const StatCard = ({ title, value, icon: Icon }) => {
  return (
    <div className="w-full bg-white rounded-xl p-4 md:p-6 border border-gray-200 hover:border-[#232249] hover:shadow-lg transition-all duration-300 group touch-manipulation min-h-[120px] md:min-h-[140px]">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="text-sm md:text-sm font-medium text-gray-500 mb-2">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-[#232249]">{value}</p>
        </div>
        
        <div className="p-2.5 md:p-3 bg-[#232249] rounded-lg group-hover:bg-[#1a1b3a] transition-colors duration-300 flex-shrink-0 ml-3">
          <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
