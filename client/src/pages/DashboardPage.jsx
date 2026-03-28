import { useState } from 'react';
import { useProjects, useRecommendedProjects } from '../hooks/useProjects';
import { ProjectCard } from '../components/project/ProjectCard';
import { Sparkles, Search } from 'lucide-react';

export const DashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useProjects({ 
    status: 'open', 
    limit: 6,
    ...(searchQuery && { q: searchQuery }) 
  });
  const { data: recData, isLoading: isRecLoading } = useRecommendedProjects();

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Logic for triggering search is already handled by the useProjects dependency on searchQuery
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full space-y-12 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-8 sm:p-12 text-white relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg shadow-primary-900/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 max-w-lg text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">Find your next team.</h1>
          <p className="text-primary-100 text-lg">
            Discover projects looking for your exact skills, or find the perfect collaborators for your own ideas.
          </p>
        </div>
        <div className="relative z-10 w-full sm:w-auto">
          <div className="relative relative-group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-surface-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search projects or skills..." 
              className="block w-full sm:w-72 pl-10 pr-3 py-3 border-transparent rounded-xl text-surface-900 bg-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
            />
          </div>
        </div>
      </div>

      {/* AI Recommendations section */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-bold text-surface-900">Recommended for You</h2>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase tracking-wider">AI Powered</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isRecLoading ? (
            [1, 2, 3].map(i => <div key={i} className="h-48 bg-surface-100 rounded-xl animate-pulse"></div>)
          ) : recData?.data?.projects?.length > 0 ? (
            recData.data.projects.slice(0, 3).map(project => (
              <ProjectCard key={project._id} project={project} className="border-amber-200/60 bg-gradient-to-br from-amber-50/30 to-white hover:border-amber-400" />
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-surface-50 rounded-2xl border border-dashed border-surface-200">
               <p className="text-surface-500 italic">No recommendations yet. Try adding more skills to your profile!</p>
            </div>
          )}
        </div>
      </div>

      {/* Explore section */}
      <div>
        <h2 className="text-xl font-bold text-surface-900 mb-6">Explore Open Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3].map(i => <div key={i} className="h-48 bg-surface-100 rounded-xl animate-pulse"></div>)
          ) : (
            data?.data?.projects?.map(project => (
              <ProjectCard key={project._id} project={project} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
