import { useState, useRef, useCallback, type ReactNode } from 'react';

const THRESHOLD = 60;
const MAX_PULL = 120;

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    if (containerRef.current && containerRef.current.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) { setPullDistance(0); return; }
    const damped = Math.min(delta * 0.5, MAX_PULL);
    setPullDistance(damped);
  }, [isPulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || refreshing) return;
    setIsPulling(false);
    if (pullDistance >= THRESHOLD) {
      setPullDistance(THRESHOLD);
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, isPulling, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overflow: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      <div
        style={{
          height: pullDistance,
          transition: isPulling ? 'none' : 'height 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--primary)',
            animation: refreshing ? 'spin 0.6s linear infinite' : 'none',
            transform: refreshing ? 'none' : `rotate(${progress * 360}deg)`,
            opacity: refreshing ? 1 : progress,
            transition: 'opacity 0.15s',
          }}
        />
      </div>
      {children}
    </div>
  );
}
