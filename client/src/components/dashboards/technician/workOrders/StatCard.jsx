import React from 'react';

const StatCard = ({ title, value, icon: Icon }) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#232249] hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
          <p className="text-3xl font-bold text-[#232249]">{value}</p>
        </div>
        
        <div className="p-3 bg-[#232249] rounded-lg group-hover:bg-[#1a1b3a] transition-colors duration-300">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
