import React, { useEffect, useRef, useState } from 'react';
import { Home, X } from 'lucide-react';
import { Project } from '../../types';
import { createProperty } from '../../services/propertiesService';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { clearDraft, readDraft, writeDraft } from '../../utils/formDraft';
import { emptyPropertyForm, formToPayload, PropertyForm, PropertyFormValues } from './PropertyForm';

const DRAFT_KEY = 'hs-admin-property-draft-new';

interface AddPropertyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ onClose, onSuccess }) => {
  const toast = useToast();
  const savedDraft = readDraft<PropertyFormValues>(DRAFT_KEY);
  const skipDraft = useRef(false);
  const [form, setForm] = useState<PropertyFormValues>(() => (
    savedDraft ? { ...emptyPropertyForm(), ...savedDraft } : emptyPropertyForm()
  ));
  const [draftRestored, setDraftRestored] = useState(Boolean(savedDraft?.title || savedDraft?.city || savedDraft?.areaSqft));
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (skipDraft.current) return;
    writeDraft(DRAFT_KEY, form);
  }, [form]);

  useEffect(() => {
    api.get('/projects')
      .then((res) => setProjects(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(() => setProjects([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Property title is required');
      return;
    }
    try {
      setIsSubmitting(true);
      await createProperty(formToPayload(form));
      skipDraft.current = true;
      clearDraft(DRAFT_KEY);
      toast.success('Property created and published');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.friendlyMessage || 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-white border border-[#0B4F3C]/20 w-full max-w-3xl rounded-3xl p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between border-b border-[#0B4F3C]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B4F3C] text-white flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#171A18]">Create Property Listing</h3>
              <p className="text-xs text-[#171A18]/70">Separate from township projects — residential, commercial, villa, showroom</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-[#E8F0EC] text-[#0B4F3C] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {draftRestored && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-[#E8F0EC] px-3 py-2 text-xs text-[#0B4F3C]">
            <span className="font-semibold">Restored the details from when this window was closed.</span>
            <button
              type="button"
              className="font-bold underline cursor-pointer"
              onClick={() => {
                skipDraft.current = true;
                clearDraft(DRAFT_KEY);
                setForm(emptyPropertyForm());
                setDraftRestored(false);
                skipDraft.current = false;
              }}
            >
              Discard draft
            </button>
          </div>
        )}

        <PropertyForm value={form} onChange={setForm} projects={projects} />

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#0B4F3C]/20 text-xs font-bold cursor-pointer">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl bg-[#0B4F3C] text-white text-xs font-bold disabled:opacity-60 cursor-pointer">
            {isSubmitting ? 'Saving…' : 'Publish Property'}
          </button>
        </div>
      </form>
    </div>
  );
};
