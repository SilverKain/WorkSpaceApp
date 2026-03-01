import React, { useRef, useEffect } from 'react';
import { Text, Transformer } from 'react-konva';
import Konva from 'konva';
import type { BoardObject } from '../types';

interface TextNodeProps {
  obj: BoardObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, changes: Partial<BoardObject>) => void;
}

const TextNode: React.FC<TextNodeProps> = React.memo(({ obj, isSelected, onSelect, onChange }) => {
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDblClick = () => {
    const textNode = textRef.current;
    if (!textNode) return;
    const stage = textNode.getStage();
    if (!stage) return;
    const container = stage.container();
    const textPosition = textNode.absolutePosition();
    const stageBox = container.getBoundingClientRect();
    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.value = obj.content || '';
    textarea.style.position = 'fixed';
    textarea.style.top = areaPosition.y + 'px';
    textarea.style.left = areaPosition.x + 'px';
    textarea.style.width = textNode.width() + 'px';
    textarea.style.fontSize = '16px';
    textarea.style.border = '1px solid #6366f1';
    textarea.style.padding = '4px';
    textarea.style.margin = '0';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'white';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = '1.4';
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
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        removeTextarea();
      }
      if (e.key === 'Escape') removeTextarea();
    });

    setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    });
  };

  return (
    <>
      <Text
        ref={textRef}
        x={obj.x}
        y={obj.y}
        width={obj.width}
        text={obj.content || 'Дважды кликните для редактирования'}
        fontSize={16}
        fill={obj.style?.color || '#1f2937'}
        draggable
        rotation={obj.rotation}
        onClick={() => onSelect(obj.id)}
        onTap={() => onSelect(obj.id)}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        onDragEnd={e => onChange(obj.id, { x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = textRef.current;
          if (!node) return;
          onChange(obj.id, {
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
        wrap="word"
        listening
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(_, newBox) => ({ ...newBox, width: Math.max(50, newBox.width) })}
        />
      )}
    </>
  );
});

TextNode.displayName = 'TextNode';

export default TextNode;
