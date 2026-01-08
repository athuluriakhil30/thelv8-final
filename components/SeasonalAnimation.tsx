'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { seasonalService } from '@/services/seasonal.service';
import type { SeasonalSetting } from '@/types';

export function SeasonalAnimation() {
  const [seasonalSetting, setSeasonalSetting] = useState<SeasonalSetting | null>(null);
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();

  // Paths where animation should NOT appear
  const excludedPaths = ['/cart', '/checkout', '/order-success'];

  useEffect(() => {
    setMounted(true);
    loadSeasonalSetting();
  }, []);

  async function loadSeasonalSetting() {
    try {
      const setting = await seasonalService.getActiveSeason();
      setSeasonalSetting(setting);
    } catch (error) {
      console.error('Error loading seasonal setting:', error);
    }
  }

  useEffect(() => {
    if (!mounted || !seasonalSetting || !canvasRef.current) return;
    if (!seasonalSetting.is_active || seasonalSetting.animation_type === 'none') return;
    
    // Check if current path is excluded
    const isExcluded = excludedPaths.some(path => pathname?.startsWith(path));
    if (isExcluded) return;

    // Initialize animation based on type
    if (seasonalSetting.animation_type === 'snow') {
      return initSnowAnimation();
    } else if (seasonalSetting.animation_type === 'leaves') {
      return initLeavesAnimation();
    } else if (seasonalSetting.animation_type === 'petals') {
      return initPetalsAnimation();
    } else if (seasonalSetting.animation_type === 'rain') {
      return initRainAnimation();
    } else if (seasonalSetting.animation_type === 'stars') {
      return initStarsAnimation();
    }
  }, [mounted, seasonalSetting, pathname]);

  function initSnowAnimation() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const intensity = seasonalSetting?.animation_intensity || 'medium';
    const particleCount = intensity === 'light' ? 50 : intensity === 'heavy' ? 150 : 100;

    interface Snowflake {
      x: number;
      y: number;
      radius: number;
      speed: number;
      wind: number;
      opacity: number;
    }

    const snowflakes: Snowflake[] = [];

    // Create snowflakes
    for (let i = 0; i < particleCount; i++) {
      snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1,
        speed: Math.random() * 1 + 0.5,
        wind: Math.random() * 0.5 - 0.25,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    let mouseX = 0;
    let mouseY = 0;
    let isMouseMoving = false;

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMouseMoving = true;
      setTimeout(() => {
        isMouseMoving = false;
      }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let animationId: number;
    
    function animate() {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakes.forEach((flake) => {
        // Mouse interaction - push snowflakes away
        if (isMouseMoving) {
          const dx = mouseX - flake.x;
          const dy = mouseY - flake.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const force = (100 - distance) / 100;
            flake.x -= (dx / distance) * force * 3;
            flake.y -= (dy / distance) * force * 3;
          }
        }

        // Update position
        flake.y += flake.speed;
        flake.x += flake.wind;

        // Reset if out of bounds
        if (flake.y > canvas.height) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }
        if (flake.x > canvas.width) {
          flake.x = 0;
        } else if (flake.x < 0) {
          flake.x = canvas.width;
        }

        // Draw snowflake with border for visibility on light backgrounds
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 240, 255, ${flake.opacity})`;
        ctx.fill();
        // Add subtle border for contrast
        ctx.strokeStyle = `rgba(180, 200, 230, ${flake.opacity * 0.6})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    // Handle window resize
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }

  function initLeavesAnimation() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const intensity = seasonalSetting?.animation_intensity || 'medium';
    const particleCount = intensity === 'light' ? 30 : intensity === 'heavy' ? 100 : 60;

    interface Leaf {
      x: number;
      y: number;
      size: number;
      speed: number;
      wind: number;
      rotation: number;
      rotationSpeed: number;
      color: string;
    }

    const leaves: Leaf[] = [];
    const leafColors = ['#ff6b35', '#f7931e', '#c1946a', '#8b4513', '#dc143c'];

    for (let i = 0; i < particleCount; i++) {
      leaves.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 15 + 8,
        speed: Math.random() * 1 + 0.3,
        wind: Math.random() * 2 - 1,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1,
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
      });
    }

    let mouseX = 0;
    let mouseY = 0;
    let isMouseMoving = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMouseMoving = true;
      setTimeout(() => {
        isMouseMoving = false;
      }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    
    function animate() {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      leaves.forEach((leaf) => {
        if (isMouseMoving) {
          const dx = mouseX - leaf.x;
          const dy = mouseY - leaf.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            const force = (120 - distance) / 120;
            leaf.x -= (dx / distance) * force * 5;
            leaf.y -= (dy / distance) * force * 5;
            leaf.rotationSpeed += force * 5;
          }
        }

        leaf.y += leaf.speed;
        leaf.x += Math.sin(leaf.y * 0.01) * leaf.wind;
        leaf.rotation += leaf.rotationSpeed;

        if (leaf.y > canvas.height) {
          leaf.y = -20;
          leaf.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate((leaf.rotation * Math.PI) / 180);
        ctx.fillStyle = leaf.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size, leaf.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }

  function initPetalsAnimation() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const intensity = seasonalSetting?.animation_intensity || 'medium';
    const particleCount = intensity === 'light' ? 40 : intensity === 'heavy' ? 120 : 80;

    interface Petal {
      x: number;
      y: number;
      size: number;
      speed: number;
      wind: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }

    const petals: Petal[] = [];

    for (let i = 0; i < particleCount; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 4,
        speed: Math.random() * 0.8 + 0.2,
        wind: Math.random() * 1.5 - 0.75,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 3 - 1.5,
        opacity: Math.random() * 0.4 + 0.4,
      });
    }

    let mouseX = 0;
    let mouseY = 0;
    let isMouseMoving = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMouseMoving = true;
      setTimeout(() => {
        isMouseMoving = false;
      }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    
    function animate() {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      petals.forEach((petal) => {
        if (isMouseMoving) {
          const dx = mouseX - petal.x;
          const dy = mouseY - petal.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const force = (100 - distance) / 100;
            petal.x -= (dx / distance) * force * 4;
            petal.y -= (dy / distance) * force * 4;
          }
        }

        petal.y += petal.speed;
        petal.x += Math.sin(petal.y * 0.02) * petal.wind;
        petal.rotation += petal.rotationSpeed;

        if (petal.y > canvas.height) {
          petal.y = -20;
          petal.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate((petal.rotation * Math.PI) / 180);
        ctx.fillStyle = `rgba(255, 150, 180, ${petal.opacity})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, petal.size, petal.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Add subtle border for better visibility
        ctx.strokeStyle = `rgba(255, 120, 160, ${petal.opacity * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }

  function initRainAnimation() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const intensity = seasonalSetting?.animation_intensity || 'medium';
    const particleCount = intensity === 'light' ? 100 : intensity === 'heavy' ? 300 : 200;

    interface Raindrop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
    }

    const raindrops: Raindrop[] = [];

    for (let i = 0; i < particleCount; i++) {
      raindrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: Math.random() * 20 + 10,
        speed: Math.random() * 10 + 10,
        opacity: Math.random() * 0.3 + 0.2,
      });
    }

    let animationId: number;
    
    function animate() {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      raindrops.forEach((drop) => {
        drop.y += drop.speed;

        if (drop.y > canvas.height) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.strokeStyle = `rgba(100, 140, 200, ${drop.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }

  function initStarsAnimation() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const intensity = seasonalSetting?.animation_intensity || 'medium';
    const particleCount = intensity === 'light' ? 50 : intensity === 'heavy' ? 150 : 100;

    interface Star {
      x: number;
      y: number;
      size: number;
      opacity: number;
      twinkleSpeed: number;
      growing: boolean;
    }

    const stars: Star[] = [];

    for (let i = 0; i < particleCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        opacity: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        growing: Math.random() > 0.5,
      });
    }

    let animationId: number;
    
    function animate() {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        if (star.growing) {
          star.opacity += star.twinkleSpeed;
          if (star.opacity >= 1) star.growing = false;
        } else {
          star.opacity -= star.twinkleSpeed;
          if (star.opacity <= 0.2) star.growing = true;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${star.opacity})`;
        ctx.shadowBlur = 3;
        ctx.shadowColor = `rgba(255, 200, 0, ${star.opacity * 0.8})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }

  if (!mounted || !seasonalSetting || !seasonalSetting.is_active) {
    return null;
  }

  if (seasonalSetting.animation_type === 'none') {
    return null;
  }

  const isExcluded = excludedPaths.some(path => pathname?.startsWith(path));
  if (isExcluded) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'normal' }}
    />
  );
}
