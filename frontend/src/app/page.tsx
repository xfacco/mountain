'use client';

import { Navbar } from "@/components/layout/Navbar";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Map, BarChart3, ArrowRight } from 'lucide-react';
import { useSeasonStore } from "@/store/season-store";
import { useEffect, useState } from "react";

export default function Home() {
  const { currentSeason } = useSeasonStore();
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

        // 2. Fetch Featured Locations
        const q = query(collection(db, 'locations'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const docs = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(loc => loc.status === 'published')
          .slice(0, 3);

        setFeaturedLocations(docs);
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
              __html: homeConfig?.heroTitle || 'Scopri la tua <br /> Montagna Ideale'
            }}
          />
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl opacity-90 mb-10 max-w-2xl mx-auto font-light"
          >
            {homeConfig?.heroSubtitle || 'Il primo comparatore intelligente per località montane. Trova la destinazione perfetta per Sci, Trekking, Relax e Famiglia.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-4"
          >
            <Link href="/search" className="px-8 py-4 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-100 transition-all flex items-center gap-2">
              <Search size={20} /> Cerca Destinazione
            </Link>
            <Link href="/compare" className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-full hover:bg-white/20 transition-all flex items-center gap-2">
              <BarChart3 size={20} /> Confronta
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Section (Dynamic) */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Destinazioni in Evidenza</h2>
              <p className="text-slate-600">Le località più ricercate del momento.</p>
            </div>
            <Link href="/locations" className="text-primary font-bold hover:underline flex items-center gap-1">
              Vedi tutte <ArrowRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <div key={i} className="h-80 bg-slate-200 rounded-2xl animate-pulse" />)}
            </div>
          ) : featuredLocations.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed text-slate-400">
              Nessuna destinazione in evidenza al momento.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredLocations.map((loc) => (
                <Link key={loc.id} href={`/locations/${loc.name}`} className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all">
                  <img
                    src={loc.seasonalImages?.[currentSeason] || loc.coverImage || 'https://images.unsplash.com/photo-1519681393784-d120267933ba'}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={loc.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 text-white w-full">
                    <div className="text-sm font-medium opacity-80 mb-2 uppercase tracking-widest">{loc.region || 'Alpi Italiane'}</div>
                    <h3 className="text-3xl font-display font-bold mb-2">{loc.name}</h3>
                    <p className="text-white/80 line-clamp-2 text-sm">
                      {loc.description?.[currentSeason] || loc.description?.['winter'] || 'Scopri questa fantastica meta.'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">Perché usare MountainComparator?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Analizziamo centinaia di dati per offrirti confronti imparziali e dettagliati.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: <Map className="w-8 h-8 text-primary" />,
                title: "Dati Multipiattaforma",
                desc: "Raccogliamo informazioni verificate su piste, hotel e servizi da fonti multiple."
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-primary" />,
                title: "Confronto Intelligente",
                desc: "Metti a confronto fino a 4 località fianco a fianco per scegliere senza dubbi."
              },
              {
                icon: <ArrowRight className="w-8 h-8 text-primary" />,
                title: "Stagionalità Reale",
                desc: "Visualizza solo le informazioni rilevanti per la stagione che ti interessa."
              }
            ].map((item, i) => (
              <motion.div
                whileHover={{ y: -5 }}
                key={i}
                className="bg-slate-50 p-8 rounded-2xl shadow-sm border border-slate-100"
              >
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
