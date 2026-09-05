// FILE: src/pages/Welcome.jsx

import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import logo from "../assets/logo.png";
import Footer from "../components/Footer";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const SLIDE_DURATION = 8000; // ms each photo stays on screen (matches the CSS animation length)
const FADE_DURATION = 1200;  // ms crossfade between photos

export default function Welcome() {
  const navigate = useNavigate();

  // Force-disable page scroll while this screen is showing, regardless of
  // any height-calculation edge cases (navbar height changes, mobile browser
  // chrome, etc.) — guarantees a truly fixed, non-scrollable hero screen.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const [photos, setPhotos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0); // forces the Ken Burns animation to restart per slide

  // Pull a handful of real, verified listing photos for the hero — replaces
  // the previous 30MB autoplay video, which was the actual cause of the
  // homepage hero intermittently failing to load on slower connections.
  useEffect(() => {
    let cancelled = false;
    const fetchHeroPhotos = async () => {
      try {
        const res = await axios.get(`${API}/listings`);
        const raw = res.data?.data?.data || [];
        const STORAGE = `${API.replace("/api", "")}/storage/`;

        const withPhotos = raw
          .filter((l) => l.images?.length > 0 || l.image)
          .slice(0, 5)
          .map((l) => (l.images?.[0]?.image_path ? STORAGE + l.images[0].image_path : STORAGE + l.image));

        if (!cancelled && withPhotos.length > 0) {
          setPhotos(withPhotos);
        }
      } catch (err) {
        console.error("Hero photo fetch failed:", err);
        // Silently falls back to the gradient-only background below —
        // never blocks the page or shows a broken-image state.
      }
    };
    fetchHeroPhotos();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (photos.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % photos.length);
      setFadeKey((k) => k + 1);
    }, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, [photos]);

  return (
    <>
    <div className="relative h-[calc(100dvh-80px)] w-full overflow-hidden flex items-center justify-center bg-[#1a2e17]">

      {/* HERO PHOTOS — real verified TierHome listings, Ken Burns zoom/pan,
          crossfaded between slides. Falls back to a plain dark-green
          background (already set above) if the fetch fails or returns
          nothing, so the hero never shows a broken/blank state. */}
      {photos.map((src, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity ease-linear"
          style={{
            opacity: i === activeIndex ? 1 : 0,
            transitionDuration: `${FADE_DURATION}ms`,
          }}
        >
          <img
            key={i === activeIndex ? fadeKey : `static-${i}`}
            src={src}
            alt=""
            className={`w-full h-full object-cover ${i === activeIndex ? (fadeKey % 2 === 0 ? "hero-kenburns-a" : "hero-kenburns-b") : ""}`}
          />
        </div>
      ))}

      {/* DARK GRADIENT OVERLAY for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

      {/* CONTENT */}
      <div className="relative z-10 max-w-xl w-full text-center px-6 py-8 md:py-16">

        {/* Logo */}
        <img src={logo} alt="TierHome" className="h-14 md:h-16 mx-auto mb-6 drop-shadow-lg" />

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
    <Footer />
    </>
  );
}