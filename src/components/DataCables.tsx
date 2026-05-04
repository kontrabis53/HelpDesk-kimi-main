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
    // Only show in buildings view
    if (locationView !== 'floors' || buildings.length === 0) {
      setPaths([]);
      return;
    }

    const updatePaths = () => {
      const newPaths: any[] = [];
      
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
            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();

            const isFromLeft = fromRect.left < toRect.left;
            
            // Apply vertical offset so cables don't overlap
            const startX = (isFromLeft ? fromRect.right : fromRect.left) + window.scrollX;
            const startY = fromRect.top + 30 + conn.offset + window.scrollY;
            const endX = (isFromLeft ? toRect.left : toRect.right) + window.scrollX;
            const endY = toRect.top + 30 + conn.offset + window.scrollY;

            const distance = Math.abs(endX - startX);
            
            // Adjust sag based on distance and connection type
            // If it's a long connection (Warehouse to ODC), arch it UPWARDS to avoid middle building's header
            let sag = 15 + (index % 3) * 10;
            
            // Make the red cable (index 3 between General and ODC) sag more
            if (conn.dataColor === '#EF4444' && distance < 500) {
              sag = 45; // Stronger sag for the red cable
            }
            
            if (distance > 500) {
              // Long connection: arch UPWARDS (negative sag)
              sag = -60 - (index % 2) * 20;
            }
            
            const cp1x = startX + (isFromLeft ? distance * 0.2 : -distance * 0.2);
            const cp2x = endX + (isFromLeft ? -distance * 0.2 : distance * 0.2);
            
            const d = `M ${startX} ${startY} C ${cp1x} ${startY + sag}, ${cp2x} ${endY + sag}, ${endX} ${endY}`;
            
            newPaths.push({
              d,
              color: conn.color,
              dataColor: conn.dataColor,
              bidirectional: conn.bidirectional,
              id: `${fromBld.id}-${toBld.id}-${index}`
            });
          }
        }
      });

      // Fallback: connect first available buildings by walls
      if (newPaths.length === 0 && buildings.length >= 2) {
        for (let i = 0; i < Math.min(buildings.length - 1, 2); i++) {
          const b1 = buildings[i];
          const b2 = buildings[i+1];
          const el1 = document.getElementById(`building-${b1.id}`);
          const el2 = document.getElementById(`building-${b2.id}`);
          if (el1 && el2) {
            const r1 = el1.getBoundingClientRect();
            const r2 = el2.getBoundingClientRect();
            
            const is1Left = r1.left < r2.left;
            const x1 = (is1Left ? r1.right : r1.left) + window.scrollX;
            const y1 = r1.top + 30 + window.scrollY;
            const x2 = (is1Left ? r2.left : r2.right) + window.scrollX;
            const y2 = r2.top + 30 + window.scrollY;
            
            const dist = Math.abs(x2 - x1);
            const d = `M ${x1} ${y1} C ${x1 + (is1Left ? dist * 0.2 : -dist * 0.2)} ${y1 + 15}, ${x2 + (is1Left ? -dist * 0.2 : dist * 0.2)} ${y2 + 15}, ${x2} ${y2}`;
            newPaths.push({ d, color: 'rgba(59, 130, 246, 0.3)', dataColor: '#3B82F6', bidirectional: true, id: `fallback-${i}` });
          }
        }
      }

      setPaths(newPaths);
    };

    // Run immediately and then on interval
    updatePaths();
    const interval = setInterval(updatePaths, 1000);
    window.addEventListener('resize', updatePaths);
    window.addEventListener('scroll', updatePaths);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePaths);
      window.removeEventListener('scroll', updatePaths);
    };
  }, [buildings, locationView]);

  if (locationView !== 'floors') return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none" 
      style={{ 
        zIndex: 50, // High z-index to be above everything
        width: '100vw',
        height: '100vh',
        overflow: 'visible'
      }}
    >
      <svg 
        ref={containerRef}
        className="w-full h-full overflow-visible"
        viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
        style={{ filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.1))' }}
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
