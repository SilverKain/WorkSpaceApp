import React, { useRef, useEffect } from 'react';
import { Rect, Text, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import type { BoardObject } from '../types';

interface CardNodeProps {
  obj: BoardObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, changes: Partial<BoardObject>) => void;
}

const CardNode: React.FC<CardNodeProps> = React.memo(({ obj, isSelected, onSelect, onChange }) => {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const bg = obj.style?.background || (obj.type === 'card' ? '#fef9c3' : '#e0e7ff');
  const isRect = obj.type === 'rectangle';

  const handleDblClick = () => {
    if (isRect) return;
    const group = groupRef.current;
    if (!group) return;
    const stage = group.getStage();
    if (!stage) return;
    const container = stage.container();
    const pos = group.absolutePosition();
    const stageBox = container.getBoundingClientRect();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.value = obj.content || '';
    textarea.style.position = 'fixed';
    textarea.style.top = stageBox.top + pos.y + 8 + 'px';
    textarea.style.left = stageBox.left + pos.x + 8 + 'px';
    textarea.style.width = (obj.width - 16) + 'px';
    textarea.style.height = (obj.height - 16) + 'px';
    textarea.style.fontSize = '14px';
    textarea.style.border = '1px solid #6366f1';
    textarea.style.padding = '4px';
    textarea.style.background = bg;
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.fontFamily = 'sans-serif';
    textarea.style.zIndex = '9999';
    textarea.style.borderRadius = '4px';
    textarea.focus();
    textarea.select();

    function removeTextarea() {
      onChange(obj.id, { content: textarea.value });
      document.body.removeChild(textarea);
      window.removeEventListener('click', handleOutsideClick);
    }

    function handleOutsideClick(e: MouseEvent) {
      if (e.target !== textarea) removeTextarea();
    }

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') removeTextarea();
    });

    setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    });
  };

  return (
    <>
      <Group
        ref={groupRef}
        x={obj.x}
        y={obj.y}
        width={obj.width}
        height={obj.height}
        rotation={obj.rotation}
        draggable
        onClick={() => onSelect(obj.id)}
        onTap={() => onSelect(obj.id)}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        onDragEnd={e => onChange(obj.id, { x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = groupRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          onChange(obj.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(40, obj.width * scaleX),
            height: Math.max(40, obj.height * scaleY),
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      >
        <Rect
          width={obj.width}
          height={obj.height}
          fill={bg}
          stroke={isSelected ? '#6366f1' : '#d1d5db'}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={isRect ? 4 : 8}
          shadowColor="rgba(0,0,0,0.1)"
          shadowBlur={4}
          shadowOffsetY={2}
        />
        {!isRect && (
          <Text
            x={8}
            y={8}
            width={obj.width - 16}
            height={obj.height - 16}
            text={obj.content || ('Дважды кликните для редактирования')}
            fontSize={14}
            fill={obj.style?.color || '#374151'}
            wrap="word"
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(_, newBox) => ({
            ...newBox,
            width: Math.max(40, newBox.width),
            height: Math.max(40, newBox.height),
          })}
        />
      )}
    </>
  );
});

CardNode.displayName = 'CardNode';

export default CardNode;
