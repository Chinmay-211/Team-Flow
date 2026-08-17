import React, { useState, useEffect } from 'react';
import { X, Send, Paperclip, MessageSquare, Clock, UserCheck, ShieldAlert, Download, Trash2, CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
  onTaskUpdated: () => void;
  projectMembers: any[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, onClose, onTaskUpdated, projectMembers }) => {
  const { user } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchTaskDetails = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${taskId}`);
      if (res.data.success) {
        setTask(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch task details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  if (!taskId) return null;

  const handleStatusChange = async (status: string) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      fetchTaskDetails();
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAssigneeChange = async (assignedTo: string) => {
    try {
      await api.patch(`/tasks/${taskId}/assignee`, { assignedTo: assignedTo || null });
      fetchTaskDetails();
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to update assignee:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/tasks/${taskId}/comments`, { content: newComment });
      setNewComment('');
      fetchTaskDetails();
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(30);

    try {
      setUploadProgress(70);
      await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadProgress(100);
      fetchTaskDetails();
      onTaskUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await api.delete(`/attachments/${attachmentId}`);
      fetchTaskDetails();
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
              TASK DETAILS
            </span>
            <span className="text-xs text-slate-500">Project: {task?.project?.name}</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Content Area (2 cols) */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">{task?.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                  {task?.description || 'No description provided.'}
                </p>
              </div>

              {/* Attachments Section */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-indigo-400" />
                    Task Attachments (Amazon S3)
                  </h3>
                  <label className="cursor-pointer text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4" />
                    Upload File
                    <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>

                {uploading && (
                  <div className="mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-indigo-400 mb-1">
                      <span>Uploading to S3...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {task?.attachments?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No file attachments uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {task?.attachments?.map((att: any) => (
                      <div key={att.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-medium text-slate-200 truncate">{att.fileName}</p>
                          <p className="text-[10px] text-slate-500">{(att.fileSize / 1024).toFixed(1)} KB • {att.user?.name}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={att.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-indigo-400 hover:bg-indigo-500/20 rounded"
                            title="Download attachment"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="pt-4 border-t border-slate-800">
                <h3 className="font-semibold text-slate-200 text-sm mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  Comments Timeline ({task?.comments?.length || 0})
                </h3>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="mb-6 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    <Send className="w-4 h-4" />
                    Comment
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {task?.comments?.map((comment: any) => (
                    <div key={comment.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-start gap-3">
                      <img
                        src={comment.user.avatarUrl || 'https://ui-avatars.com/api/?name=User'}
                        alt={comment.user.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-500/30"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-200">{comment.user.name}</span>
                          <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-300">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Controls Column */}
            <div className="space-y-5 p-4 bg-slate-950/50 rounded-xl border border-slate-800/80">
              {/* Status Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Status</label>
                <select
                  value={task?.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Completed</option>
                </select>
              </div>

              {/* Assignee Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Assignee</label>
                <select
                  value={task?.assignedTo || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {projectMembers?.map((m: any) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name} ({m.user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Tag */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Priority</label>
                <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {task?.priority}
                </span>
              </div>

              {/* Creator & Meta */}
              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Created By:</span>
                  <span className="text-slate-200 font-medium">{task?.creator?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created Date:</span>
                  <span>{new Date(task?.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
