'use client';

import { Navbar } from "@/components/layout/Navbar";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Map, BarChart3, ArrowRight } from 'lucide-react';
import { useSeasonStore } from "@/store/season-store";
import { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';
import { locationNameToSlug } from '@/lib/url-utils';

export default function Home() {
  const { currentSeason } = useSeasonStore();
  const t = useTranslations('Home');
  const tNav = useTranslations('Navbar');
  const [featuredLocations, setFeaturedLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [homeConfig, setHomeConfig] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { collection, getDocs, query, limit, orderBy, doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');

        // 1. Fetch Home Config
        const configSnap = await getDoc(doc(db, 'settings', 'home'));
        if (configSnap.exists()) {
          setHomeConfig(configSnap.data());
        }

        // 2. Fetch Featured Locations (Random)
        const q = query(collection(db, 'locations'));
        const querySnapshot = await getDocs(q);

        const publishedDocs = querySnapshot.docs
          .map(snap => ({ id: snap.id, ...snap.data() } as any))
          .filter(loc => loc.status === 'published');

        // Shuffle and take 3 random locations
        const shuffled = publishedDocs.sort(() => 0.5 - Math.random());
        const lightDocs = shuffled.slice(0, 3);

        // Fetch details for these 3 featured locations to get descriptions and images
        const fullDocs = await Promise.all(lightDocs.map(async (loc) => {
          try {
            const detailsSnap = await getDoc(doc(db, 'location_details', loc.id));
            if (detailsSnap.exists()) {
              return { ...loc, ...detailsSnap.data() };
            }
          } catch (e) {
            console.error("Error fetching details for featured loc:", loc.name, e);
          }
          return loc;
        }));

        setFeaturedLocations(fullDocs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
            style={{
              backgroundImage: homeConfig?.heroImages?.[currentSeason]
                ? `url("${homeConfig.heroImages[currentSeason]}")`
                : (() => {
                  const defaults: any = {
                    winter: 'https://images.hdqwalls.com/wallpapers/dolomite-mountains-in-italy-4k-gs.jpg',
                    summer: 'https://images.hdqwalls.com/wallpapers/dolomite-mountains-in-italy-4k-gs.jpg',
                    autumn: 'https://images.hdqwalls.com/wallpapers/dolomite-mountains-in-italy-4k-gs.jpg',
                    spring: 'https://images.hdqwalls.com/wallpapers/dolomite-mountains-in-italy-4k-gs.jpg'
                  };
                  return `url("${defaults[currentSeason] || defaults.winter}")`;
                })()
            }}
          />

          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight"
            dangerouslySetInnerHTML={{
              __html: t.raw('hero_title')
            }}
          />
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl opacity-90 mb-10 max-w-2xl mx-auto font-light"
            dangerouslySetInnerHTML={{
              __html: t.raw('hero_subtitle')
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href="/match" className="px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/25">
              <span className="text-xl">✨</span> Start Matching
            </Link>
            <Link href="/search" className="px-8 py-4 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-100 transition-all flex items-center gap-2">
              <Search size={20} /> {t('search_destination')}
            </Link>
            <Link href="/compare" className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-full hover:bg-white/20 transition-all flex items-center gap-2">
              <BarChart3 size={20} /> {t('compare_action')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Section (Dynamic) */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">{t('featured_title')}</h2>
              <p className="text-slate-600">{t('featured_subtitle')}</p>
            </div>
            <Link href="/locations" className="text-primary font-bold hover:underline flex items-center gap-1">
              {t('see_all')} <ArrowRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <div key={i} className="h-80 bg-slate-200 rounded-2xl animate-pulse" />)}
            </div>
          ) : featuredLocations.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed text-slate-400">
              {t('no_featured')}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredLocations.map((loc) => (
                <Link key={loc.id} href={`/locations/${locationNameToSlug(loc.name)}`} className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all">
                  <img
                    src={loc.seasonalImages?.[currentSeason] || loc.coverImage || 'https://images.unsplash.com/photo-1519681393784-d120267933ba'}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={loc.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 text-white w-full">
                    <div className="text-sm font-medium opacity-80 mb-2 uppercase tracking-widest">{loc.region || 'Alti Italiane'}</div>
                    <h3 className="text-3xl font-display font-bold mb-2">{loc.name}</h3>
                    <p className="text-white/80 line-clamp-2 text-sm">
                      {loc.description?.[currentSeason] || loc.description?.['winter'] || 'Discover this amazing destination.'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Match CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M45.7,-70.5C58.9,-62.5,71.5,-51.1,79.2,-37.6C86.9,-24.1,89.7,-8.4,85.6,5.3C81.5,19.1,70.5,30.9,59.3,40.9C48.1,50.9,36.7,59.1,23.8,65.3C10.9,71.5,-3.5,75.7,-16.4,72.6C-29.3,69.5,-40.7,59.1,-51.2,48.7C-61.7,38.3,-71.3,27.9,-75.6,15.6C-79.9,3.3,-79,-10.8,-73.2,-23.1C-67.4,-35.4,-56.7,-45.9,-45.1,-54.6C-33.5,-63.3,-21,-70.2,-7.5,-71.3C6,-72.4,12,-67.7,21,-63.9L45.7,-70.5Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block py-1 px-3 rounded-full bg-primary/20 text-primary-light font-bold text-sm tracking-wider uppercase mb-4 border border-primary/30">
                New Feature
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 leading-tight">
                Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Perfect Match</span>
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-lg">
                Answer 4 simple questions and let our AI algorithm find the ideal mountain destination tailored just for you.
              </p>
              <Link href="/match" className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-100 transition-all shadow-lg hover:shadow-white/20 transform hover:-translate-y-1">
                Start Matching <ArrowRight size={20} />
              </Link>
            </div>

            <div className="flex-1 w-full max-w-md">
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-3xl">👨‍👩‍👧‍👦</span>
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-bold">Target</div>
                      <div className="font-bold">Family</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-3xl">🧘‍♀️</span>
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-bold">Vibe</div>
                      <div className="font-bold">Relax & Wellness</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center pt-2">
                    <div className="w-8 h-8 rounded-full bg-primary animate-pulse flex items-center justify-center">
                      <ArrowRight size={16} className="text-white transform rotate-90" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-4 text-center shadow-lg transform scale-105 border border-white/10">
                    <div className="text-xs text-white/80 uppercase font-bold mb-1">Top Match</div>
                    <div className="text-xl font-bold text-white">Madonna di Campiglio</div>
                    <div className="text-sm text-white/90">98% Compatibility</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
