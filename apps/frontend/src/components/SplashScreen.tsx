"use client";

/**
 * Lightweight PWA splash screen with animated rocket emoji.
 * Uses pure CSS animations for performance.
 */
export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-sky-500 to-indigo-600">
      {/* Animated rocket */}
      <div className="relative">
        <span
          className="text-7xl animate-rocket select-none"
          role="img"
          aria-label="Rocket launching"
        >
          🚀
        </span>
        {/* Trail particles */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          <span className="w-2 h-2 bg-orange-300 rounded-full animate-particle-1 opacity-80" />
          <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-particle-2 opacity-70" />
          <span className="w-2 h-2 bg-orange-400 rounded-full animate-particle-3 opacity-80" />
        </div>
      </div>

      {/* App name */}
      <h1 className="mt-8 text-3xl font-bold text-white tracking-wide animate-fade-in-up">
        Ballistic
      </h1>
      <p className="mt-2 text-white/70 text-sm animate-fade-in-up animation-delay-200">
        The Simplest Bullet Journal
      </p>

      {/* Loading dots */}
      <div className="mt-8 flex gap-1.5">
        <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce-dot" />
        <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce-dot animation-delay-100" />
        <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce-dot animation-delay-200" />
      </div>

      <style jsx>{`
        @keyframes rocket {
          0%, 100% {
            transform: translateY(0) rotate(-45deg);
          }
          25% {
            transform: translateY(-8px) rotate(-43deg);
          }
          50% {
            transform: translateY(-4px) rotate(-45deg);
          }
          75% {
            transform: translateY(-10px) rotate(-47deg);
          }
        }

        @keyframes particle-1 {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translateY(12px) scale(0.5);
            opacity: 0.3;
          }
        }

        @keyframes particle-2 {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translateY(16px) scale(0.4);
            opacity: 0.2;
          }
        }

        @keyframes particle-3 {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translateY(10px) scale(0.6);
            opacity: 0.4;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-dot {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        .animate-rocket {
          animation: rocket 1.5s ease-in-out infinite;
          display: inline-block;
        }

        .animate-particle-1 {
          animation: particle-1 1s ease-in-out infinite;
        }

        .animate-particle-2 {
          animation: particle-2 1.2s ease-in-out infinite;
        }

        .animate-particle-3 {
          animation: particle-3 0.9s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-bounce-dot {
          animation: bounce-dot 1s ease-in-out infinite;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
