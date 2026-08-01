import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import logo from "../assets/logo.png";
import heroVideo from "../assets/hero-video.mp4";

const FADE_DURATION = 1; // seconds — how long the crossfade transition takes

export default function Welcome() {
  const navigate = useNavigate();
  const videoARef = useRef(null);
  const videoBRef = useRef(null);
  const activeIsARef = useRef(true); // which video is currently visible/active
  const [, forceRender] = useState(0);

  useEffect(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!videoA || !videoB) return;

    let timeoutId;
    let cancelled = false;

    const runCycle = () => {
      if (cancelled) return;

      const activeVideo   = activeIsARef.current ? videoA : videoB;
      const inactiveVideo = activeIsARef.current ? videoB : videoA;

      const startCycle = () => {
        const duration = activeVideo.duration;
        if (!duration || !isFinite(duration)) return;

        const msUntilFade = Math.max(0, (duration - FADE_DURATION) * 1000);

        timeoutId = setTimeout(() => {
          if (cancelled) return;

          // Start the inactive video from the beginning, just before the swap
          inactiveVideo.currentTime = 0;
          inactiveVideo.play().catch(() => {});

          // Flip which one is "active" — triggers the CSS opacity crossfade
          activeIsARef.current = !activeIsARef.current;
          forceRender((n) => n + 1);

          // After the fade completes, pause the now-hidden video and schedule the next cycle
          timeoutId = setTimeout(() => {
            if (cancelled) return;
            activeVideo.pause();
            runCycle();
          }, FADE_DURATION * 1000);
        }, msUntilFade);
      };

      if (activeVideo.readyState >= 1) {
        startCycle();
      } else {
        activeVideo.addEventListener("loadedmetadata", startCycle, { once: true });
      }
    };

    videoA.play().catch(() => {});
    runCycle();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeIsA = activeIsARef.current;

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden flex items-center justify-center">

      {/* BACKGROUND VIDEO — two layered copies, crossfaded to mask the loop cut */}
      <video
        ref={videoARef}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity ease-linear"
        style={{ opacity: activeIsA ? 1 : 0, transitionDuration: `${FADE_DURATION}s` }}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      <video
        ref={videoBRef}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity ease-linear"
        style={{ opacity: activeIsA ? 0 : 1, transitionDuration: `${FADE_DURATION}s` }}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* DARK GRADIENT OVERLAY for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

      {/* CONTENT */}
      <div className="relative z-10 max-w-xl w-full text-center px-6 py-16">

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">
          Welcome to TierHome
        </h1>

        {/* Short description */}
        <p className="text-white/90 text-base md:text-lg mb-8 leading-relaxed drop-shadow">
          Find rental homes in Angeles City that actually fit your budget — ranked by
          affordability, verified for your safety.
        </p>

        {/* CTA button */}
        <button
          onClick={() => navigate("/browse")}
          className="inline-flex items-center gap-2 bg-[#3d6b35] text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-[#2d5525] transition shadow-lg"
        >
          Browse Listings
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}