'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Target, Heart, Activity, CheckCircle2 } from 'lucide-react';

interface ScoreBreakdownProps {
    location: any;
    preferences: any;
}

export function MatchScoreBreakdown({ location, preferences }: ScoreBreakdownProps) {
    const [isOpen, setIsOpen] = useState(true);

    const weights = location.tagWeights || {};

    // Build matches array - one entry per selected preference
    const matches: any[] = [];

    const getEffectiveWeight = (category: string, tag: string) => {
        // 1. Try specific AI weight first
        const catWeights = weights[category] || {};
        if (catWeights[tag] !== undefined) return catWeights[tag];

        // 2. Fallback to binary tag presence (Legacy match)
        let locTags: string[] = [];
        if (category === 'activities') {
            // Activities can be in multiple lists in the legacy structure
            locTags = [
                ...(location.tags?.activities || []),
                ...(location.tags?.tourism || []),
                ...(location.tags?.sport || [])
            ];
        } else {
            locTags = location.tags?.[category] || [];
        }

        // Check for inclusion (case-insensitive) to match MatchWizard logic
        const hasTag = locTags.some(t => t.toLowerCase().includes(tag.toLowerCase()));
        return hasTag ? 100 : 0;
    };

    // Target matches
    if (preferences.target?.length > 0) {
        preferences.target.forEach((tag: string) => {
            const weight = getEffectiveWeight('target', tag);
            matches.push({
                category: 'Target',
                icon: Target,
                tag,
                weight,
                label: capitalize(tag)
            });
        });
    }

    // Vibe matches
    if (preferences.vibe?.length > 0) {
        preferences.vibe.forEach((tag: string) => {
            const weight = getEffectiveWeight('vibe', tag);
            matches.push({
                category: 'Vibe',
                icon: Heart,
                tag,
                weight,
                label: capitalize(tag)
            });
        });
    }

    // Activity matches
    if (preferences.activities?.length > 0) {
        preferences.activities.forEach((tag: string) => {
            const weight = getEffectiveWeight('activities', tag);
            matches.push({
                category: 'Activity',
                icon: Activity,
                tag,
                weight,
                label: capitalize(tag)
            });
        });
    }

    function capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function getMatchLevel(weight: number) {
        if (weight >= 80) return { label: 'Excellent Match', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
        if (weight >= 60) return { label: 'Good Match', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
        if (weight >= 40) return { label: 'Fair Match', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
        if (weight >= 20) return { label: 'Partial Match', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
        return { label: 'Low Match', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' };
    }

    return (
        <div className="border-t border-slate-100 mt-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-4 text-left hover:bg-slate-50 transition-colors px-2 rounded"
            >
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    <span className="text-sm font-bold text-slate-700">Why this match?</span>
                    <span className="text-xs text-slate-400">({matches.length} preferences analyzed)</span>
                </div>
                {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>

            {isOpen && (
                <div className="px-2 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="text-xs text-slate-500 mb-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <strong>How to read:</strong> Each preference you selected has been analyzed by our AI to determine how well this location matches your needs (0-100%).
                    </div>

                    <div className="space-y-2">
                        {matches.map((match, idx) => {
                            const Icon = match.icon;
                            const level = getMatchLevel(match.weight);

                            return (
                                <div key={idx} className={`p-3 rounded-lg border ${level.border} ${level.bg} transition-all`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 ${level.color}`}>
                                            <Icon size={18} strokeWidth={2} />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-sm text-slate-900">{match.label}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{match.category}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-xl font-black ${level.color}`}>{match.weight}%</div>
                                                    <div className={`text-[9px] font-bold ${level.color}`}>{level.label}</div>
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-slate-200">
                                                <div
                                                    className={`h-full transition-all duration-500 ${match.weight >= 80 ? 'bg-green-500' :
                                                        match.weight >= 60 ? 'bg-blue-500' :
                                                            match.weight >= 40 ? 'bg-yellow-500' :
                                                                match.weight >= 20 ? 'bg-orange-500' :
                                                                    'bg-slate-300'
                                                        }`}
                                                    style={{ width: `${match.weight}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-700">Overall Match Score:</span>
                            <div className="text-2xl font-black text-primary">{location.matchScore}%</div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                            Based on the average compatibility across all your preferences
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
