'use client';

import Link from 'next/link';
import { SeasonSelector } from '@/components/ui/SeasonSelector';
import { Menu, Search } from 'lucide-react';

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/70 backdrop-blur-lg border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
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
                        <span className="font-display font-bold text-xl text-slate-800 group-hover:text-primary transition-colors">
                            MountComp
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/locations"
                            className="text-slate-600 hover:text-primary transition-colors font-medium"
                        >
                            Destinations
                        </Link>
                        <Link
                            href="/compare"
                            className="text-slate-600 hover:text-primary transition-colors font-medium"
                        >
                            Compare
                        </Link>
                        <Link
                            href="/map"
                            className="text-slate-600 hover:text-primary transition-colors font-medium"
                        >
                            Map
                        </Link>
                        <Link
                            href="/blog"
                            className="text-slate-600 hover:text-primary transition-colors font-medium"
                        >
                            Journal
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <SeasonSelector />
                        <Link href="/search" className="p-2 text-slate-500 hover:text-primary transition-colors">
                            <Search size={20} />
                        </Link>
                        <button className="md:hidden p-2 text-slate-500">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
