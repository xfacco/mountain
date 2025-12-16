import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand & Payoff */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="w-5 h-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 3L2 20H22L12 3Z"
                                        fill="currentColor"
                                        fillOpacity="0.2"
                                    />
                                    <path
                                        d="M12 3L2 20H22L12 3ZM12 3L16 11H8L12 3Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M12 7L14.5 12H9.5L12 7Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </div>
                            <span className="font-display font-bold text-xl text-white">
                                MountComp
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed text-slate-400 mb-6">
                            Il primo comparatore intelligente per le tue vacanze in montagna.
                            Analizziamo dati reali per aiutarti a scegliere la destinazione perfetta, stagione dopo stagione.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Linkedin size={20} /></a>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Esplora</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
                            <li><Link href="/locations" className="hover:text-primary transition-colors">Destinazioni</Link></li>
                            <li><Link href="/compare" className="hover:text-primary transition-colors">Confronta</Link></li>
                            <li><Link href="/search" className="hover:text-primary transition-colors">Ricerca Avanzata</Link></li>
                            <li><Link href="/blog" className="hover:text-primary transition-colors">Journal & Guide</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Azienda</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/about" className="hover:text-primary transition-colors">Chi Siamo</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contatti</Link></li>
                            <li><Link href="/partners" className="hover:text-primary transition-colors">Lavora con Noi</Link></li>
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">Termini di Servizio</Link></li>
                        </ul>
                    </div>

                    {/* Contacts & Data */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Contatti</h4>
                        <ul className="space-y-4 text-sm text-slate-400">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-primary flex-shrink-0 mt-0.5" />
                                <span>Via Alpina 12, 38100 Trento (TN), Italia</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-primary flex-shrink-0" />
                                <a href="mailto:info@mountcomp.it" className="hover:text-white transition-colors">info@mountcomp.it</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-primary flex-shrink-0" />
                                <a href="tel:+390461000000" className="hover:text-white transition-colors">+39 0461 000000</a>
                            </li>
                        </ul>
                        <div className="mt-8 pt-8 border-t border-slate-800 text-xs text-slate-500">
                            <p>© 2024 MountComp S.r.l.</p>
                            <p>P.IVA: IT01234567890</p>
                            <p>Tutti i diritti riservati.</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
