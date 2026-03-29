import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Users, Lock, Globe, Clock, FolderKanban, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const ProjectCard = ({ project, className }) => {
  const isPublic = project.visibility === 'public';
  const isCompleted = project.status === 'completed';

  return (
    <Link
      to={`/projects/${project._id}`}
      className={cn(
        "group flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all hover:shadow-md",
        isCompleted 
          ? "bg-green-50/30 border-green-200 hover:border-green-400" 
          : "bg-white border-surface-200 hover:border-primary-300",
        className
      )}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1.5", isCompleted ? "text-green-600" : "text-surface-500")}>
              {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span className="text-xs font-medium uppercase tracking-wider">
                {project.visibility}
              </span>
            </div>
            
            {isCompleted && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[10px] font-bold tracking-wider uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </div>
            )}
          </div>

          {/* {project.matchScore && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100/80 text-amber-800 rounded-full border border-amber-200">
              <span className="text-[10px] font-bold">MATCH</span>
              <span className="text-xs font-black">{Math.round(project.matchScore.score * 100)}%</span>
            </div>
          )} */}

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
            {project.requiredSkills.slice(0, 3).map((skill, index) => {
              const skillName = typeof skill === 'string' ? skill : skill.name;
              return (
                <span key={skillName || index} className="px-2 py-0.5 bg-surface-100 text-surface-600 rounded-md text-[11px] font-medium">
                  {skillName}
                </span>
              );
            })}
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
