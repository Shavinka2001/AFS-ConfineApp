import React from 'react';
import { Search } from 'lucide-react';

const SearchAndFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter
}) => {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 mb-6 md:mb-8 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="w-full relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white text-base touch-manipulation"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white text-base touch-manipulation"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white text-base touch-manipulation"
          >
            <option value="">All Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;
