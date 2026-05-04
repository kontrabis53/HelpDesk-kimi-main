import React, { useEffect, useState, useRef } from 'react';
import { useLocationStore } from '@/stores/locationStore';

interface Cable {
  fromId: string;
  toId: string;
  bidirectional: boolean;
  color: string;
  dataColor: string;
  altFrom?: string;
  altTo?: string;
}

export const DataCables: React.FC<{ locationView?: string }> = ({ locationView = 'floors' }) => {
  const { buildings } = useLocationStore();
  const [paths, setPaths] = useState<any[]>([]);
  const containerRef = useRef<SVGSVGElement>(null);

  // Define our logic with multiple cables and specific colors
  const connections: (Cable & { offset: number })[] = [
    // Between General and ODC - 4 cables with specific directions
    { 
      fromId: 'General', 
      toId: 'ODC', 
      bidirectional: false, // Only General -> ODC
      color: 'rgba(59, 130, 246, 0.3)', 
      dataColor: '#3B82F6', // Blue
      altFrom: 'главн',
      altTo: 'диагн',
      offset: -10
    },
    { 
      fromId: 'ODC', 
      toId: 'General', 
      bidirectional: false, // Only ODC -> General
      color: 'rgba(16, 185, 129, 0.3)', 
      dataColor: '#10B981', // Green
      altFrom: 'диагн',
      altTo: 'главн',
      offset: 0
    },
    { 
      fromId: 'General', 
      toId: 'ODC', 
      bidirectional: false, // Only General -> ODC
      color: 'rgba(234, 179, 8, 0.3)', 
      dataColor: '#EAB308', // Yellow
      altFrom: 'главн',
      altTo: 'диагн',
      offset: 10
    },
    { 
      fromId: 'ODC', 
      toId: 'General', 
      bidirectional: false, // Only ODC -> General
      color: 'rgba(239, 68, 68, 0.3)', 
      dataColor: '#EF4444', // Red
      altFrom: 'диагн',
      altTo: 'главн',
      offset: 20
    },
    // Between Warehouse and ODC - 2 cables (Red, Green)
    { 
      fromId: 'Warehouse', 
      toId: 'ODC', 
      bidirectional: false, 
      color: 'rgba(239, 68, 68, 0.3)', 
      dataColor: '#EF4444', // Red
      altFrom: 'склад',
      altTo: 'диагн',
      offset: -5
    },
    { 
      fromId: 'Warehouse', 
      toId: 'ODC', 
      bidirectional: false, 
      color: 'rgba(16, 185, 129, 0.3)', 
      dataColor: '#10B981', // Green
      altFrom: 'склад',
      altTo: 'диагн',
      offset: 5
    }
  ];

  useEffect(() => {
    const updatePaths = () => {
      const newPaths: any[] = [];
      const containerEl = containerRef.current;
      if (!containerEl) return;
      
      connections.forEach((conn, index) => {
        const fromBld = buildings.find(b => 
          b.name.toLowerCase().includes(conn.fromId.toLowerCase()) || 
          (conn.altFrom && b.name.toLowerCase().includes(conn.altFrom.toLowerCase()))
        );
        const toBld = buildings.find(b => 
          b.name.toLowerCase().includes(conn.toId.toLowerCase()) || 
          (conn.altTo && b.name.toLowerCase().includes(conn.altTo.toLowerCase()))
        );

        if (fromBld && toBld) {
          const fromEl = document.getElementById(`building-${fromBld.id}`);
          const toEl = document.getElementById(`building-${toBld.id}`);

          if (fromEl && toEl) {
            const isFromLeft = fromEl.offsetLeft < toEl.offsetLeft;
            
            // Connection points relative to the parent container
            // This is 100% stable during scroll because it uses static offsets
            const startX = (isFromLeft ? fromEl.offsetLeft + fromEl.offsetWidth : fromEl.offsetLeft);
            const startY = fromEl.offsetTop + 30 + conn.offset;
            const endX = (isFromLeft ? toEl.offsetLeft : toEl.offsetLeft + toEl.offsetWidth);
            const endY = toEl.offsetTop + 30 + conn.offset;

            const distance = Math.abs(endX - startX);
            
            // Industrial look: tighter cables, less "garland" sag
            let sag = 5 + (index % 3) * 3; 
            
            if (conn.dataColor === '#EF4444' && distance < 500) {
              sag = 15; 
            }
            
            if (distance > 500) {
              sag = -40 - (index % 2) * 10;
            }
            
            const tension = 0.15;
            const cp1x = startX + (isFromLeft ? distance * tension : -distance * tension);
            const cp2x = endX + (isFromLeft ? -distance * tension : distance * tension);
            
            const d = `M ${startX} ${startY} C ${cp1x} ${startY + sag}, ${cp2x} ${endY + sag}, ${endX} ${endY}`;
            
            newPaths.push({
              d,
              startX,
              startY,
              endX,
              endY,
              color: conn.color,
              dataColor: conn.dataColor,
              bidirectional: conn.bidirectional,
              id: `${fromBld.id}-${toBld.id}-${index}`
            });
          }
        }
      });

      setPaths(newPaths);
    };

    // Update on resize and re-render
    updatePaths();
    window.addEventListener('resize', updatePaths);
    
    // Check for changes periodically (e.g. after animation/drag finishes)
    const interval = setInterval(updatePaths, 500);

    return () => {
      window.removeEventListener('resize', updatePaths);
      clearInterval(interval);
    };
  }, [buildings]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <svg 
        ref={containerRef}
        className="w-full h-full overflow-visible"
        style={{ minWidth: '100%', minHeight: '100%' }}
      >
        <defs>
          {paths.map((p, i) => (
            <filter key={`glow-${i}`} id={`glow-${p.id}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          ))}
        </defs>
        
        {paths.map((p) => (
          <React.Fragment key={p.id}>
            {/* Connection Points (Sockets) */}
            <circle
              cx={p.startX}
              cy={p.startY}
              r="3"
              fill={p.dataColor}
              className="opacity-80"
              filter={`url(#glow-${p.id})`}
            />
            <circle
              cx={p.endX}
              cy={p.endY}
              r="3"
              fill={p.dataColor}
              className="opacity-80"
              filter={`url(#glow-${p.id})`}
            />

            {/* Main Cable */}
            <path
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth="3"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            
            {/* Forward Data Flow */}
            <path
              d={p.d}
              fill="none"
              stroke={p.dataColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 20"
              filter={`url(#glow-${p.id})`}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="24"
                to="0"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>

            {/* Backward Data Flow (if bidirectional) */}
            {p.bidirectional && (
              <path
                d={p.d}
                fill="none"
                stroke={p.dataColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 20"
                filter={`url(#glow-${p.id})`}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="24"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
            )}
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
};
