import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * A premium branded splash screen that shows for a fixed duration (7s).
 * Features the KSOSHTC logo and a branded progress bar.
 */
export function BrandedSplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const DURATION = 7000; // 7 seconds as requested

  useEffect(() => {
    let completed = false;
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      if (completed) return;

      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(newProgress);
      
      if (elapsed >= DURATION) {
        completed = true;
        clearInterval(interval);
        // Start fade out
        setTimeout(() => {
          setVisible(false);
          // Wait for fade out animation
          setTimeout(() => {
             if (onComplete) onComplete();
          }, 600);
        }, 300);
      }
    }, 16); // ~60fps

    return () => {
      completed = true;
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1a1a1a] transition-opacity duration-500 ease-in-out",
        !visible ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="flex flex-col items-center gap-8 max-w-sm w-full px-8 animate-in fade-in zoom-in duration-1000">
        {/* Logo Container - Circular like the reference */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white p-4 shadow-2xl flex items-center justify-center border-4 border-[#D4AF37]/30 overflow-hidden group">
          <img 
            src="/logo.webp" 
            alt="KSOSHTC Logo" 
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
          />
          {/* Subtle spinning glow behind logo */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#1B5E3F] animate-spin-slow opacity-20" style={{ animationDuration: '3s' }} />
        </div>

        {/* Brand Text */}
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Kigali Safety OSH Training Center
          </h2>
          <p className="text-[#D4AF37] font-medium text-sm sm:text-base tracking-wide uppercase opacity-90">
            Safety Today, Prosperity Tomorrow
          </p>
        </div>

        {/* Progress Container */}
        <div className="w-full space-y-4">
           {/* Percentage text */}
           <div className="flex justify-between items-end">
              <span className="text-xs font-medium text-white/50 uppercase tracking-widest">Initialising Portal</span>
              <span className="text-lg font-bold text-[#D4AF37] leading-none">{Math.round(progress)}%</span>
           </div>
           
           {/* Animated Progress Bar */}
           <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
             <div 
               className="h-full bg-gradient-to-r from-[#1B5E3F] via-[#2d7c54] to-[#D4AF37] transition-all duration-300 ease-out shadow-[0_0_15px_rgba(27,94,63,0.5)]"
               style={{ width: `${progress}%` }}
             />
           </div>
           
           <p className="text-[10px] text-center text-white/40 font-medium italic">
             Bringing excellence in safety training...
           </p>
        </div>
      </div>
      
      {/* Bottom tagline */}
      <div className="absolute bottom-12 text-white/20 text-xs font-medium tracking-[0.2em] uppercase">
        KSOSHTC &bull; Rwanda
      </div>
    </div>
  );
}
