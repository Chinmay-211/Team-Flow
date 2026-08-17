import React from 'react';
import { MessageSquare, Paperclip, Clock, ArrowRight, ArrowLeft, CheckCircle2, User } from 'lucide-react';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignee?: { id: string; name: string; avatarUrl?: string };
  creator?: { id: string; name: string };
  _count?: { comments: number; attachments: number };
}

interface KanbanBoardProps {
  tasks: TaskItem[];
  onTaskClick: (task: TaskItem) => void;
  onMoveStatus: (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskClick, onMoveStatus }) => {
  const columns = [
    { id: 'TODO', title: 'To Do', color: 'border-slate-700 bg-slate-900/40', badge: 'bg-slate-800 text-slate-300' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-cyan-500/30 bg-cyan-950/20', badge: 'bg-cyan-500/20 text-cyan-400' },
    { id: 'DONE', title: 'Completed', color: 'border-emerald-500/30 bg-emerald-950/20', badge: 'bg-emerald-500/20 text-emerald-400' }
  ];

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div key={col.id} className={`rounded-2xl p-4 border ${col.color} flex flex-col h-full min-h-[600px]`}>
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                {col.title}
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                  {colTasks.length}
                </span>
              </h3>
            </div>

            {/* Task Cards List */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {colTasks.length === 0 ? (
                <div className="h-32 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-500 font-medium">
                  No tasks in this column
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="glass-card rounded-xl p-4 border border-slate-800/80 cursor-pointer group hover:border-indigo-500/40 transition-all duration-200"
                  >
                    {/* Header: Priority & Controls */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {col.id !== 'TODO' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveStatus(task.id, col.id === 'DONE' ? 'IN_PROGRESS' : 'TODO');
                            }}
                            title="Move back"
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {col.id !== 'DONE' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveStatus(task.id, col.id === 'TODO' ? 'IN_PROGRESS' : 'DONE');
                            }}
                            title="Move forward"
                            className="p-1 hover:bg-indigo-600 rounded text-slate-400 hover:text-white"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Task Title */}
                    <h4 className="font-medium text-slate-100 text-sm mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {task.title}
                    </h4>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/50 text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                          {task._count?.comments || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                          {task._count?.attachments || 0}
                        </span>
                      </div>

                      {/* Assignee Avatar */}
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <img
                            src={task.assignee.avatarUrl || 'https://ui-avatars.com/api/?name=User'}
                            alt={task.assignee.name}
                            title={`Assigned to ${task.assignee.name}`}
                            className="w-6 h-6 rounded-full ring-1 ring-slate-700 object-cover"
                          />
                        ) : (
                          <div title="Unassigned" className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                            <User className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
