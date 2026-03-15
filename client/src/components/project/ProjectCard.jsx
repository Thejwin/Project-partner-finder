import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Users, Lock, Globe, Clock, FolderKanban } from 'lucide-react';
import { cn } from '../../utils/cn';

export const ProjectCard = ({ project, className }) => {
  const isPublic = project.visibility === 'public';
  
  return (
    <Link 
      to={`/projects/${project._id}`}
      className={cn(
        "group flex flex-col justify-between bg-white rounded-xl border border-surface-200 p-5 shadow-sm transition-all hover:shadow-md hover:border-primary-300",
        className
      )}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 text-surface-500">
            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span className="text-xs font-medium uppercase tracking-wider">
              {project.visibility}
            </span>
          </div>
          
          <div className="flex -space-x-2">
            {/* Owner avatar placeholder */}
            <div className="w-6 h-6 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary-700 select-none">
              O
            </div>
            {project.collaborators?.slice(0, 3).map((collab, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-surface-200 border-2 border-white flex items-center justify-center text-[10px] select-none">
                ?
              </div>
            ))}
            {project.collaborators?.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-surface-100 border-2 border-white flex items-center justify-center text-[10px] select-none">
                +{project.collaborators.length - 3}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-surface-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {project.title}
        </h3>
        
        <p className="text-sm text-surface-600 line-clamp-2 mb-4">
          {project.description || "No description provided."}
        </p>

        {project.requiredSkills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.requiredSkills.slice(0, 3).map(skill => (
              <span key={skill} className="px-2 py-0.5 bg-surface-100 text-surface-600 rounded-md text-[11px] font-medium">
                {skill}
              </span>
            ))}
            {project.requiredSkills.length > 3 && (
              <span className="px-2 py-0.5 bg-surface-100 text-surface-600 rounded-md text-[11px] font-medium">
                +{project.requiredSkills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-surface-100 text-sm text-surface-500">
        <div className="flex items-center gap-1.5">
          <FolderKanban className="w-4 h-4" />
          <span>{project.tasks?.length || 0} tasks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  );
};
