import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTasks, useUpdateTaskStatus } from '../hooks/useTasks';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '../utils/cn';
import { useSocketEvent, useSocket } from '../context/SocketContext';
import { CreateTaskModal } from '../components/task/CreateTaskModal';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-surface-200', text: 'text-surface-700' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-200', text: 'text-blue-700' },
  { id: 'done', title: 'Done', color: 'bg-green-200', text: 'text-green-700' }
];

export const TaskBoardPage = () => {
  const { projectId } = useParams();
  const { data, isLoading } = useTasks(projectId);
  const { mutate: updateStatus } = useUpdateTaskStatus(projectId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const qc = useQueryClient();
  const { socket } = useSocket();

  // Socket.io project room join/leave
  useSocketEvent('connect', useCallback(() => {
    socket?.emit('project:join', { projectId });
  }, [socket, projectId]));

  // Live real-time updates from TaskService socket emissions
  useSocketEvent('task:created', useCallback(({ task }) => {
    qc.setQueryData(['tasks', projectId, undefined], (old) => 
      old ? { ...old, data: { ...old.data, tasks: [...old.data.tasks, task] } } : old
    );
  }, [qc, projectId]));

  useSocketEvent('task:statusChanged', useCallback(({ taskId, status, updatedBy }) => {
    // Ignore if this client made the change (we already updated optimistically)
    // Actually, backend emits the updatedBy, so we could check against our user ID.
    qc.setQueryData(['tasks', projectId, undefined], (old) => {
      if (!old) return old;
      return {
        ...old,
        data: {
          ...old.data,
          tasks: old.data.tasks.map(t => t._id === taskId ? { ...t, status } : t)
        }
      };
    });
  }, [qc, projectId]));

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;

    // Optimistic UI update
    qc.setQueryData(['tasks', projectId, undefined], (old) => {
      if (!old) return old;
      return {
        ...old,
        data: {
          ...old.data,
          tasks: old.data.tasks.map(t => t._id === draggableId ? { ...t, status: newStatus } : t)
        }
      };
    });

    // Fire mutation to DB
    updateStatus({ taskId: draggableId, status: newStatus });
  };

  if (isLoading) return <div className="p-8 animate-pulse text-surface-500">Loading board...</div>;

  const tasks = data?.data?.tasks || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link to={`/projects/${projectId}`} className="p-2 hover:bg-surface-200 rounded-full transition-colors text-surface-500 hover:text-surface-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-surface-900">Task Board</h1>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 h-full min-h-0 overflow-x-auto pb-4 items-start">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            
            return (
              <div key={col.id} className="flex flex-col flex-shrink-0 w-80 max-h-full bg-surface-100/50 rounded-2xl border border-surface-200">
                
                {/* Column header */}
                <div className="p-4 flex items-center justify-between shrink-0 border-b border-surface-200/60 bg-surface-100/50 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider", col.color, col.text)}>
                      {col.title}
                    </span>
                    <span className="text-sm font-medium text-surface-500">{colTasks.length}</span>
                  </div>
                  <button className="text-surface-400 hover:text-surface-700 p-1 rounded-md hover:bg-surface-200">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Dropzone */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-[150px] transition-colors duration-200",
                        snapshot.isDraggingOver && "bg-primary-50/50"
                      )}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "bg-white p-4 rounded-xl border border-surface-200 shadow-sm transition-shadow",
                                snapshot.isDragging && "shadow-xl border-primary-300 ring-2 ring-primary-500/20 rotate-1"
                              )}
                              style={{...provided.draggableProps.style}}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                                  task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                  task.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                                  task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                  'bg-surface-100 text-surface-600'
                                )}>
                                  {task.priority || 'medium'}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-surface-900 mb-1.5 leading-tight">{task.title}</h4>
                              <p className="text-xs text-surface-500 line-clamp-2 mb-3">{task.description}</p>
                              <div className="flex items-center justify-between border-t border-surface-100 pt-3">
                                <div className="text-xs text-surface-400 font-medium"># {task._id.slice(-4)}</div>
                                {task.assignedTo && (
                                  <div className="w-6 h-6 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-[10px] font-bold text-primary-700" title={task.assignedTo?.username}>
                                    {task.assignedTo?.username?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
      />
    </div>
  );
};
