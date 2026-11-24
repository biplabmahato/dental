import { useState } from 'react';
import { Loader2, Pencil, Plus, Power, X } from 'lucide-react';
import { formatCurrency, formatDuration } from '../../lib/formatters';
import type { DentalService } from '../../types/database';

export interface ServiceFormPayload {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

interface AdminServicesProps {
  services: DentalService[];
  loading: boolean;
  onCreateService: (payload: ServiceFormPayload) => Promise<void>;
  onUpdateService: (id: string, payload: ServiceFormPayload) => Promise<void>;
  onToggleActive: (id: string, nextActive: boolean) => Promise<void>;
}

export function AdminServices({
  services,
  loading,
  onCreateService,
  onUpdateService,
  onToggleActive,
}: AdminServicesProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<DentalService | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [price, setPrice] = useState('120');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreateDrawer = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setDurationMinutes('45');
    setPrice('150');
    setIsActive(true);
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (service: DentalService) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || '');
    setDurationMinutes(String(service.duration_minutes));
    setPrice(String(service.price));
    setIsActive(service.is_active);
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const parsedDuration = Number(durationMinutes);
    const parsedPrice = Number(price);

    if (!trimmedName) {
      setFormError('Service name is required.');
      return;
    }
    if (!Number.isFinite(parsedDuration) || parsedDuration < 5) {
      setFormError('Duration must be at least 5 minutes.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError('Price must be 0 or greater.');
      return;
    }

    setSaving(true);
    try {
      const payload: ServiceFormPayload = {
        name: trimmedName,
        description: description.trim(),
        duration_minutes: Math.round(parsedDuration),
        price: Math.round(parsedPrice * 100) / 100,
        is_active: isActive,
      };

      if (editingService) {
        await onUpdateService(editingService.id, payload);
      } else {
        await onCreateService(payload);
      }
      setDrawerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save service.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (service: DentalService) => {
    setTogglingId(service.id);
    try {
      await onToggleActive(service.id, !service.is_active);
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = services.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#DDE7EB] rounded-2xl p-5">
        <div>
          <h2 className="font-display text-base font-semibold text-[#0F2430]">
            Dental Services Catalog
          </h2>
          <p className="mt-0.5 text-xs text-[#5A7280] tabular-nums">
            {activeCount} active on public booking · {services.length - activeCount} inactive
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateDrawer}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Services Table */}
      <div className="bg-white border border-[#DDE7EB] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-[#F2F6F8] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="font-display text-base font-semibold text-[#0F2430]">
              No dental services configured yet
            </h3>
            <p className="mt-1 text-sm text-[#5A7280]">
              Add your first dental treatment so patients can book online.
            </p>
            <button
              type="button"
              onClick={openCreateDrawer}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Service</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5EEF2] bg-[#F8FAFB] text-xs font-medium text-[#5A7280]">
                  <th className="py-3.5 px-5">Service Name</th>
                  <th className="py-3.5 px-5">Duration</th>
                  <th className="py-3.5 px-5">Price</th>
                  <th className="py-3.5 px-5">Visibility</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF2F4] text-sm">
                {services.map((service) => {
                  const isToggling = togglingId === service.id;
                  return (
                    <tr
                      key={service.id}
                      className={`transition-colors ${
                        service.is_active ? 'hover:bg-[#FAFDFE]' : 'bg-[#F8FAFB]/70'
                      }`}
                    >
                      <td className="py-4 px-5 max-w-md">
                        <div className="font-semibold text-[#0F2430]">{service.name}</div>
                        {service.description && (
                          <p className="mt-1 text-xs text-[#5A7280] line-clamp-2">
                            {service.description}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-5 font-mono-tabular text-[#0F2430] whitespace-nowrap">
                        {formatDuration(service.duration_minutes)}
                      </td>

                      <td className="py-4 px-5 font-mono-tabular font-semibold text-[#0F2430] whitespace-nowrap">
                        {formatCurrency(service.price)}
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${
                            service.is_active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditDrawer(service)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F2430] bg-[#F2F6F8] rounded-lg hover:bg-[#E4EEF2] transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => void handleToggle(service)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                              service.is_active
                                ? 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                                : 'text-[#0D7A7E] bg-[#E8F5F5] hover:bg-[#D5ECEC]'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{service.is_active ? 'Deactivate' : 'Activate'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Create / Edit Service Drawer */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-drawer-title"
          className="fixed inset-0 z-50 flex justify-end bg-[#0F2430]/35 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg bg-white h-full shadow-xl border-l border-[#DDE7EB] flex flex-col">
            <div className="px-6 py-5 border-b border-[#EDF2F4] flex items-center justify-between">
              <div>
                <h3
                  id="service-drawer-title"
                  className="font-display text-lg font-semibold text-[#0F2430]"
                >
                  {editingService ? 'Edit Dental Service' : 'Add New Dental Service'}
                </h3>
                <p className="text-xs text-[#5A7280] mt-0.5">
                  {editingService
                    ? 'Updates appear immediately in the online booking flow.'
                    : 'Create a service available for patient scheduling.'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close service editor"
                onClick={handleCloseDrawer}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[#5A7280] hover:bg-[#F2F6F8] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
                >
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="service-name"
                  className="block text-sm font-medium text-[#0F2430] mb-1.5"
                >
                  Service Name <span className="text-[#0D7A7E]">*</span>
                </label>
                <input
                  id="service-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Comprehensive Dental Checkup"
                  className="w-full px-4 py-2.5 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E]"
                />
              </div>

              <div>
                <label
                  htmlFor="service-description"
                  className="block text-sm font-medium text-[#0F2430] mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="service-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief patient-friendly explanation of what the appointment includes..."
                  className="w-full px-4 py-2.5 text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="service-duration"
                    className="block text-sm font-medium text-[#0F2430] mb-1.5"
                  >
                    Duration (minutes) <span className="text-[#0D7A7E]">*</span>
                  </label>
                  <input
                    id="service-duration"
                    type="number"
                    min={5}
                    step={5}
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-4 py-2.5 font-mono-tabular text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="service-price"
                    className="block text-sm font-medium text-[#0F2430] mb-1.5"
                  >
                    Price (USD) <span className="text-[#0D7A7E]">*</span>
                  </label>
                  <input
                    id="service-price"
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 font-mono-tabular text-sm text-[#0F2430] bg-[#FAFDFE] border border-[#CEDCE2] rounded-xl focus:outline-none focus:border-[#0D7A7E]"
                  />
                </div>
              </div>

              <label className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#F6FAFB] border border-[#DDE7EB] cursor-pointer">
                <div>
                  <span className="block text-sm font-medium text-[#0F2430]">
                    Active on public booking page
                  </span>
                  <span className="block text-xs text-[#5A7280]">
                    Inactive services remain saved here without disrupting past appointments.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 accent-[#0D7A7E] rounded cursor-pointer"
                />
              </label>

              <div className="pt-4 border-t border-[#EDF2F4] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="px-4 py-2.5 text-sm font-medium text-[#4A606D] hover:text-[#0F2430] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#0D7A7E] rounded-xl hover:bg-[#095F63] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingService ? 'Save Changes' : 'Create Service'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
