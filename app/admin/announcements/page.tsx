'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, Calendar, Image as ImageIcon } from 'lucide-react';
import { announcementService } from '@/services/announcement.service';
import { formatDateTime } from '@/lib/helpers';
import { toast } from 'sonner';
import type { Announcement } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    image_url: '',
    button_text: 'Got it',
    button_link: '',
    is_active: false,
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: '',
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      setLoading(true);
      const data = await announcementService.getAllAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      image_url: '',
      button_text: 'Got it',
      button_link: '',
      is_active: false,
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: '',
    });
    setShowDialog(true);
  }

  function openEditDialog(announcement: Announcement) {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      description: announcement.description || '',
      content: announcement.content || '',
      image_url: announcement.image_url || '',
      button_text: announcement.button_text || 'Got it',
      button_link: announcement.button_link || '',
      is_active: announcement.is_active,
      valid_from: announcement.valid_from.slice(0, 16),
      valid_until: announcement.valid_until ? announcement.valid_until.slice(0, 16) : '',
    });
    setShowDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const data = {
        title: formData.title,
        description: formData.description || undefined,
        content: formData.content || undefined,
        image_url: formData.image_url || undefined,
        button_text: formData.button_text || 'Got it',
        button_link: formData.button_link || undefined,
        is_active: formData.is_active,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : new Date().toISOString(),
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : undefined,
      };

      if (editingAnnouncement) {
        await announcementService.updateAnnouncement(editingAnnouncement.id, data);
        toast.success('Announcement updated successfully');
      } else {
        await announcementService.createAnnouncement(data);
        toast.success('Announcement created successfully');
      }

      setShowDialog(false);
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    }
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      await announcementService.toggleAnnouncementStatus(id, !currentStatus);
      toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadAnnouncements();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  }

  async function handleDelete() {
    if (!deleteConfirmId) return;

    try {
      await announcementService.deleteAnnouncement(deleteConfirmId);
      toast.success('Announcement deleted successfully');
      setDeleteConfirmId(null);
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await announcementService.uploadAnnouncementImage(file);
      setFormData({ ...formData, image_url: imageUrl });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-light text-stone-900 mb-2">Announcements</h1>
          <p className="text-stone-600">Manage popup announcements and offers</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-lg border-2 border-dashed border-stone-200">
            <p className="text-stone-600 mb-4">No announcements yet</p>
            <Button onClick={openCreateDialog} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create First Announcement
            </Button>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white border border-stone-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-medium text-stone-900">
                      {announcement.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        announcement.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {announcement.description && (
                    <p className="text-stone-600 mb-3">{announcement.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-stone-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>From: {formatDateTime(announcement.valid_from)}</span>
                    </div>
                    {announcement.valid_until && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Until: {formatDateTime(announcement.valid_until)}</span>
                      </div>
                    )}
                    {announcement.image_url && (
                      <div className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" />
                        <span>Has Image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Preview */}
                {announcement.image_url && (
                  <div className="w-32 h-20 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                    <img
                      src={announcement.image_url}
                      alt={announcement.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleStatus(announcement.id, announcement.is_active)}
                    title={announcement.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {announcement.is_active ? (
                      <EyeOff className="w-4 h-4 text-stone-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-stone-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(announcement)}
                  >
                    <Edit className="w-4 h-4 text-stone-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirmId(announcement.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., 🎉 Special Offer!"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Short Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Get 20% off on your first order"
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Full Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter detailed content here..."
                rows={4}
              />
            </div>

            {/* Image Upload */}
            <div>
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
                {formData.image_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                  >
                    Remove
                  </Button>
                )}
              </div>
              {formData.image_url && (
                <div className="mt-2 w-full h-40 rounded-lg overflow-hidden bg-stone-100">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Button Text & Link */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="button_text">Button Text</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  placeholder="Got it"
                />
              </div>
              <div>
                <Label htmlFor="button_link">Button Link (Optional)</Label>
                <Input
                  id="button_link"
                  value={formData.button_link}
                  onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                  placeholder="/shop"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valid_from">Valid From *</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valid_until">Valid Until (Optional)</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
              <div>
                <Label htmlFor="is_active" className="text-base">Active</Label>
                <p className="text-sm text-stone-600">
                  Enable to show this announcement to users
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAnnouncement ? 'Update' : 'Create'} Announcement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this announcement. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
