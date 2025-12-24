'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
    label: string;
    value: number; // 0-100
}

interface RadarChartProps {
    data: DataPoint[];
    color?: string;
    size?: number;
}

export function RadarChart({ data, color = '#a855f7', size = 300 }: RadarChartProps) {
    const center = size / 2;
    const radius = size * 0.32; // Slightly smaller to give labels more room
    const angleStep = (Math.PI * 2) / data.length;

    // Calculate points for the polygon
    const points = useMemo(() => {
        return data.map((d, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const r = (d.value / 100) * radius;
            return {
                x: center + r * Math.cos(angle),
                y: center + r * Math.sin(angle),
                angle,
                label: d.label,
                value: d.value
            };
        });
    }, [data, radius, center, angleStep]);

    // Points for the background rings (25%, 50%, 75%, 100%)
    const rings = [0.25, 0.5, 0.75, 1];

    const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';

    return (
        <div className="flex justify-center items-center w-full overflow-visible py-4">
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="overflow-visible"
            >
                {/* Background Rings */}
                {rings.map((r, i) => (
                    <circle
                        key={i}
                        cx={center}
                        cy={center}
                        r={r * radius}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        strokeDasharray={i === 3 ? "none" : "3 3"}
                    />
                ))}

                {/* Axis lines */}
                {data.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const x2 = center + radius * Math.cos(angle);
                    const y2 = center + radius * Math.sin(angle);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={x2}
                            y2={y2}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* The Radar Polygon */}
                <motion.path
                    initial={{ pathLength: 0, opacity: 0, scale: 0.5 }}
                    animate={{ pathLength: 1, opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "circOut" }}
                    d={polygonPath}
                    fill={color}
                    fillOpacity="0.25"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    style={{ originX: `${center}px`, originY: `${center}px` }}
                />

                {/* Data Points */}
                {points.map((p, i) => (
                    <motion.circle
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill={color}
                        stroke="white"
                        strokeWidth="2"
                    />
                ))}

                {/* Labels */}
                {data.map((d, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const labelRadius = radius + 25; // More distance
                    const x = center + labelRadius * Math.cos(angle);
                    const y = center + labelRadius * Math.sin(angle);

                    // Refined label positioning
                    let textAnchor: "inherit" | "middle" | "start" | "end" = "middle";
                    let dy = 0;

                    if (Math.abs(Math.cos(angle)) < 0.1) {
                        textAnchor = "middle";
                        dy = Math.sin(angle) > 0 ? 15 : -10;
                    } else if (Math.cos(angle) > 0) {
                        textAnchor = "start";
                        dy = 3;
                    } else {
                        textAnchor = "end";
                        dy = 3;
                    }

                    return (
                        <g key={i}>
                            <text
                                x={x}
                                y={y + dy}
                                textAnchor={textAnchor}
                                dominantBaseline="middle"
                                className="text-[8px] font-bold uppercase tracking-tight fill-slate-400 drop-shadow-sm"
                            >
                                {d.label.split(' & ')[0]}
                            </text>
                            <text
                                x={x}
                                y={y + dy + 10}
                                textAnchor={textAnchor}
                                dominantBaseline="middle"
                                className="text-[9px] font-black fill-slate-800"
                            >
                                {d.value}%
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
