import React from 'react';
import { Arrow, Circle, Group } from 'react-konva';
import type { BoardObject } from '../types';

interface ArrowNodeProps {
  obj: BoardObject;
  allObjects: BoardObject[];
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function getObjectCenter(o: BoardObject) {
  return {
    x: o.x + o.width / 2,
    y: o.y + o.height / 2,
  };
}

/**
 * Find the nearest edge point on source object toward target.
 */
function getEdgePoint(source: BoardObject, target: { x: number; y: number }) {
  const cx = source.x + source.width / 2;
  const cy = source.y + source.height / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  const angle = Math.atan2(dy, dx);

  const hw = source.width / 2;
  const hh = source.height / 2;

  // Clamp to rectangle edge
  let ex: number, ey: number;
  if (Math.abs(dx) * hh > Math.abs(dy) * hw) {
    // hit left or right edge
    ex = cx + (dx > 0 ? hw : -hw);
    ey = cy + Math.tan(angle) * (dx > 0 ? hw : -hw);
  } else {
    // hit top or bottom edge
    ey = cy + (dy > 0 ? hh : -hh);
    ex = cx + (dy > 0 ? hh : -hh) / Math.tan(angle);
  }

  return { x: ex, y: ey };
}

const ArrowNode: React.FC<ArrowNodeProps> = React.memo(({ obj, allObjects, isSelected, onSelect }) => {
  const fromObj = allObjects.find(o => o.id === obj.fromId);
  const toObj = allObjects.find(o => o.id === obj.toId);

  if (!fromObj || !toObj) return null;

  const toCenter = getObjectCenter(toObj);
  const fromCenter = getObjectCenter(fromObj);
  const start = getEdgePoint(fromObj, toCenter);
  const end = getEdgePoint(toObj, fromCenter);

  const color = obj.style?.arrowColor || '#6366f1';
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  return (
    <Group onClick={() => onSelect(obj.id)} onTap={() => onSelect(obj.id)}>
      <Arrow
        points={[start.x, start.y, end.x, end.y]}
        stroke={isSelected ? '#ef4444' : color}
        strokeWidth={isSelected ? 3 : 2}
        fill={isSelected ? '#ef4444' : color}
        pointerLength={10}
        pointerWidth={8}
        lineCap="round"
        lineJoin="round"
        tension={0}
        listening
      />
      {/* Invisible hit area at midpoint for easier selection */}
      <Circle
        x={midX}
        y={midY}
        radius={10}
        fill="transparent"
        onClick={() => onSelect(obj.id)}
        onTap={() => onSelect(obj.id)}
      />
    </Group>
  );
});

ArrowNode.displayName = 'ArrowNode';

export default ArrowNode;
