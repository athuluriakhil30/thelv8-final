'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { X, ArrowRight, Percent } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
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
  const pathname = usePathname();

  // Prevent SSR/hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only show on home page
    if (mounted && !hasChecked.current && pathname === '/') {
      hasChecked.current = true;
      checkAndShowAnnouncement();
    }
  }, [mounted, pathname]);

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
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden border-none shadow-2xl">
        {/* Accessible Title and Description */}
        <VisuallyHidden>
          <DialogTitle>{announcement.title}</DialogTitle>
          <DialogDescription>{announcement.description || announcement.content || 'Special announcement'}</DialogDescription>
        </VisuallyHidden>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-black/5 backdrop-blur-sm p-2 hover:bg-black/10 transition-all duration-200 group"
          aria-label="Close announcement"
        >
          <X className="h-5 w-5 text-stone-700 group-hover:text-stone-900" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Left Side - Image */}
          {announcement.image_url && (
            <div className="relative h-64 md:h-full min-h-[400px] overflow-hidden bg-stone-100">
              <Image
                src={announcement.image_url}
                alt={announcement.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Right Side - Content */}
          <div className="flex flex-col justify-center p-8 md:p-12 bg-white">
            {/* Discount Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-900 rounded-full text-sm font-semibold w-fit mb-6">
              <Percent className="w-4 h-4" />
              <span>Special Offer</span>
            </div>

            {/* Title */}
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4 leading-tight">
              {announcement.title}
            </h2>

            {/* Description */}
            {announcement.description && (
              <p className="text-lg text-stone-600 mb-6 leading-relaxed">
                {announcement.description}
              </p>
            )}

            {/* Additional Content */}
            {announcement.content && (
              <p className="text-stone-500 mb-8 whitespace-pre-line leading-relaxed">
                {announcement.content}
              </p>
            )}

            {/* Action Button */}
            {announcement.button_link ? (
              <Link href={announcement.button_link} onClick={handleClose}>
                <button className="group inline-flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-full font-medium hover:bg-stone-800 transition-all duration-300 hover:gap-4">
                  <span>{announcement.button_text || 'Shop Now'}</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            ) : (
              <button 
                onClick={handleButtonClick}
                className="group inline-flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-full font-medium hover:bg-stone-800 transition-all duration-300 hover:gap-4 w-fit"
              >
                <span>{announcement.button_text || 'Got it'}</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            )}

            {/* Footer Text */}
            <p className="text-sm text-stone-400 mt-6">
              Limited time only. Terms and conditions apply.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
