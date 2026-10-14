import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Project } from '../types';
import { AddProjectModal } from '../components/projects/AddProjectModal';
import { EditProjectModal } from '../components/projects/EditProjectModal';
import { ProjectCardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Pagination } from '../components/common/Pagination';
import { formatNumber } from '../utils/formatters';
import { MapPin, Plus, Trash2, Edit, RefreshCw, Building2, Star } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ProjectsPage: React.FC = () => {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [dholeraFilter, setDholeraFilter] = useState<'all' | 'dholera'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/projects');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setProjects(data);
    } catch (e: any) {
      console.error('Failed to fetch projects:', e);
      setError(e?.friendlyMessage || 'Failed to connect to projects API.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = dholeraFilter === 'dholera' ? projects.filter(p => p.isDholera) : projects;
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project and all associated plots?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted successfully!');
      fetchProjects();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.friendlyMessage || 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Add Project Action */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#171A18]">Real Estate Projects & Townships</h2>
          <p className="text-xs text-[#171A18]/70 mt-1">Active townships, masterplan settings, and project-specific pricing configurations</p>
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => { setDholeraFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                dholeraFilter === 'all'
                  ? 'bg-[#0B4F3C] text-white border-[#0B4F3C]'
                  : 'bg-white text-[#171A18]/70 border-[#0B4F3C]/20 hover:border-[#0B4F3C]'
              }`}
            >
              All Projects ({projects.length})
            </button>
            <button
              onClick={() => { setDholeraFilter('dholera'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                dholeraFilter === 'dholera'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              Special Dholera ({projects.filter(p => p.isDholera).length})
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProjects}
            className="p-2.5 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
            title="Refresh Projects"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer border border-[#0B4F3C]"
          >
            <Plus className="w-4 h-4" /> Create New Project
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <ProjectCardSkeleton count={3} />
      ) : error ? (
        <ErrorState
          title="Projects Load Failed"
          message={error}
          onRetry={fetchProjects}
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title={dholeraFilter === 'dholera' ? 'No Special Dholera Projects' : 'No Projects Found'}
          description={dholeraFilter === 'dholera' ? 'No projects are tagged as Special Dholera SIR yet. Enable the toggle in any project to mark it.' : 'There are currently no real estate projects or townships registered in the system.'}
          icon={dholeraFilter === 'dholera' ? Star : Building2}
          actionLabel={dholeraFilter === 'dholera' ? 'View All Projects' : 'Create First Project'}
          onAction={dholeraFilter === 'dholera' ? () => setDholeraFilter('all') : () => setIsAddModalOpen(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProjects.map((p) => {
              const projectImage = p.bannerImage || p.mapImageUrl || p.gallery?.[0]?.url || p.logoImage;
              return (
                <div key={p._id} className="bg-white rounded-2xl border border-[#0B4F3C]/15 hover:border-[#0B4F3C]/40 transition-all relative group shadow-sm overflow-hidden">

                  <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-[#E8F0EC] to-[#D0E8DC] overflow-hidden">
                    {projectImage ? (
                      <img
                        src={projectImage}
                        alt={p.name || 'Project'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallbackEl = target.parentElement?.querySelector('.image-fallback-placeholder');
                          if (fallbackEl) (fallbackEl as HTMLElement).style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    <div className={`image-fallback-placeholder absolute inset-0 flex flex-col items-center justify-center gap-1 text-[#0B4F3C]/40 bg-[#E8F0EC] ${projectImage ? 'hidden' : 'flex'}`}>
                      <Building2 className="w-10 h-10 text-[#0B4F3C]/30" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B4F3C]/60">No Image Uploaded</span>
                    </div>
                  {/* Status Badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-[#E8F0EC]/90 backdrop-blur-sm text-[#0B4F3C] text-[10px] font-bold border border-[#0B4F3C]/20">
                    {p.status || 'ACTIVE'}
                  </span>
                  {/* Dholera Badge */}
                  {p.isDholera && (
                    <span className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/95 backdrop-blur-sm text-amber-950 text-[10px] font-extrabold shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-amber-900" /> Special Dholera
                    </span>
                  )}
                  {/* Code Badge */}
                  <span className="absolute top-3 right-3 font-mono text-xs bg-black/50 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                    {p.code || 'PRJ'}
                  </span>
                  {/* Action Buttons */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingProject(p)}
                      className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer shadow-sm"
                      title="Edit Project"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer shadow-sm"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#171A18] group-hover:text-[#0B4F3C] transition-colors">{p.name || 'Unnamed Project'}</h3>
                    <p className="text-xs text-[#171A18]/70 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0B4F3C] shrink-0" /> {p.location || 'Location Not Specified'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#0B4F3C]/15 text-xs">
                    <div className="bg-[#E8F0EC] p-2 rounded-xl border border-[#0B4F3C]/20">
                      <p className="text-[#171A18]/70 font-semibold text-[10px]">Total Plots</p>
                      <p className="font-bold text-[#171A18] text-sm mt-0.5">{formatNumber(p.totalPlots)}</p>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      <p className="text-emerald-800 font-semibold text-[10px]">Available</p>
                      <p className="font-bold text-emerald-900 text-sm mt-0.5">{formatNumber(p.availableCount ?? 0)}</p>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                      <p className="text-amber-800 font-semibold text-[10px]">Pending</p>
                      <p className="font-bold text-amber-900 text-sm mt-0.5">{formatNumber(p.pendingCount ?? 0)}</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded-xl border border-red-200">
                      <p className="text-red-800 font-semibold text-[10px]">Booked / Sold</p>
                      <p className="font-bold text-red-900 text-sm mt-0.5">{formatNumber((p.bookedCount ?? 0) + (p.soldCount ?? 0))}</p>
                    </div>
                  </div>

                  {/* Base Rate */}
                  {p.basePricePerSqft && (
                    <div className="text-xs text-[#0B4F3C] font-bold bg-[#E8F0EC] px-3 py-1.5 rounded-lg text-center border border-[#0B4F3C]/15">
                      ₹{p.basePricePerSqft?.toLocaleString('en-IN')} / sqft base rate
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredProjects.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[6, 9, 12, 24]}
            label="projects"
          />
        </>

      )}

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <AddProjectModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={fetchProjects}
        />
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={fetchProjects}
        />
      )}
    </div>
  );
};
