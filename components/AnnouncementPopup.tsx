'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { announcementService } from '@/services/announcement.service';
import { useAuth } from '@/context/AuthContext';
import type { Announcement } from '@/types';

const STORAGE_KEY = 'thelv8_announcement_seen';

export function AnnouncementPopup() {
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const hasChecked = useRef(false);
  const { user } = useAuth();

  // Prevent SSR/hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !hasChecked.current) {
      hasChecked.current = true;
      checkAndShowAnnouncement();
    }
  }, [mounted]);

  async function checkAndShowAnnouncement() {
    try {
      setLoading(true);

      // Fetch active announcement
      const activeAnnouncement = await announcementService.getActiveAnnouncement();

      if (!activeAnnouncement) {
        setLoading(false);
        return;
      }

      setAnnouncement(activeAnnouncement);

      // Check if user should see the popup
      if (user) {
        // Signed-in user: Show only once (check localStorage)
        const seenAnnouncements = getSeenAnnouncements();
        
        if (!seenAnnouncements.includes(activeAnnouncement.id)) {
          setOpen(true);
        }
      } else {
        // Non-signed-in user: Show every time
        setOpen(true);
      }
    } catch (error) {
      console.error('Error loading announcement:', error);
    } finally {
      setLoading(false);
    }
  }

  function getSeenAnnouncements(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function markAnnouncementAsSeen(announcementId: string) {
    try {
      const seenAnnouncements = getSeenAnnouncements();
      
      if (!seenAnnouncements.includes(announcementId)) {
        seenAnnouncements.push(announcementId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seenAnnouncements));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  function handleClose() {
    if (user && announcement) {
      // Mark as seen for signed-in users
      markAnnouncementAsSeen(announcement.id);
    }
    setOpen(false);
  }

  function handleButtonClick() {
    handleClose();
    // If there's a button link, it will be handled by the Link component
  }

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted || loading || !announcement) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 backdrop-blur-sm p-2 hover:bg-white transition-colors shadow-md"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-stone-700" />
        </button>

        {/* Image */}
        {announcement.image_url && (
          <div className="relative w-full h-64 md:h-80 bg-stone-100">
            <Image
              src={announcement.image_url}
              alt={announcement.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 md:p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl md:text-3xl font-light text-stone-900">
              {announcement.title}
            </DialogTitle>
          </DialogHeader>

          {announcement.description && (
            <p className="text-lg text-stone-700 mb-4 font-medium">
              {announcement.description}
            </p>
          )}

          {announcement.content && (
            <div className="text-stone-600 mb-6 whitespace-pre-line">
              {announcement.content}
            </div>
          )}

          {/* Action Button */}
          {announcement.button_link ? (
            <Link href={announcement.button_link} onClick={handleClose}>
              <Button size="lg" className="w-full md:w-auto">
                {announcement.button_text || 'Learn More'}
              </Button>
            </Link>
          ) : (
            <Button size="lg" onClick={handleButtonClick} className="w-full md:w-auto">
              {announcement.button_text || 'Got it'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
