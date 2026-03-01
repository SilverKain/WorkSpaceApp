import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { useAppStore } from '../store/useAppStore';
import Toolbar from './Toolbar';
import TextNode from './TextNode';
import CardNode from './CardNode';
import ArrowNode from './ArrowNode';
import { exportBoardToJSON, importBoardFromJSON, exportBoardToPNG } from '../utils/exportImport';
import type { BoardObject } from '../types';

// Image node with transformer
interface ImageNodeProps {
  obj: BoardObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, changes: Partial<BoardObject>) => void;
}

const ImageNode: React.FC<ImageNodeProps> = React.memo(({ obj, isSelected, onSelect, onChange }) => {
  const [image] = useImage(obj.imageSrc || '');
  const imgRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && imgRef.current) {
      trRef.current.nodes([imgRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        ref={imgRef}
        image={image}
        x={obj.x}
        y={obj.y}
        width={obj.width}
        height={obj.height}
        rotation={obj.rotation}
        draggable
        onClick={() => onSelect(obj.id)}
        onTap={() => onSelect(obj.id)}
        onDragEnd={e => onChange(obj.id, { x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = imgRef.current;
          if (!node) return;
          onChange(obj.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(20, node.width() * node.scaleX()),
            height: Math.max(20, node.height() * node.scaleY()),
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(_, newBox) => ({
            ...newBox,
            width: Math.max(20, newBox.width),
            height: Math.max(20, newBox.height),
          })}
        />
      )}
    </>
  );
});
ImageNode.displayName = 'ImageNode';

// ---- Main Board Component ----

const Board: React.FC = () => {
  const {
    currentBoardData,
    currentBoardId,
    boardsMeta,
    addObject,
    updateObject,
    deleteObject,
    duplicateObject,
    clearBoard,
    undo,
    redo,
    importObjects,
    goToBoardManager,
  } = useAppStore();

  const stageRef = useRef<Konva.Stage>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [activeTool, setActiveTool] = useState<'select' | 'arrow'>('select');
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Resize listener для корректного размера на мобильном
  useEffect(() => {
    const onResize = () => setStageSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const boardMeta = boardsMeta.find(b => b.id === currentBoardId);

  // ---- Center the stage on mount ----
  useEffect(() => {
    setSelectedId(null);
    setStagePos({ x: 0, y: 0 });
    setStageScale(1);
    setActiveTool('select');
    setConnectionStart(null);
  }, [currentBoardId]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          deleteObject(selectedId);
          setSelectedId(null);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedId) duplicateObject(selectedId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setActiveTool('select');
        setConnectionStart(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteObject, duplicateObject, undo, redo]);

  // ---- Arrow tool: handle object click ----
  const handleObjectClickForArrow = useCallback((clickedId: string): boolean => {
    if (activeTool !== 'arrow') return false;
    if (!connectionStart) {
      setConnectionStart(clickedId);
      return true;
    }
    if (connectionStart === clickedId) {
      setConnectionStart(null);
      return true;
    }
    addObject({
      type: 'arrow',
      x: 0, y: 0, width: 0, height: 0, rotation: 0,
      fromId: connectionStart,
      toId: clickedId,
    });
    setConnectionStart(null);
    return true;
  }, [activeTool, connectionStart, addObject]);

  // ---- Wheel zoom ----
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.08;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const newScale = Math.min(5, Math.max(0.1, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy));
    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, []);

  // ---- Touch pinch zoom ----
  const lastDist = useRef(0);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);

  const handleTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    if (!touch1 || !touch2) return;

    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    const center = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };

    if (!lastDist.current) {
      lastDist.current = dist;
      lastCenter.current = center;
      return;
    }

    const scaleChange = dist / lastDist.current;
    const oldScale = stage.scaleX();
    const newScale = Math.min(5, Math.max(0.1, oldScale * scaleChange));

    if (lastCenter.current) {
      const dx = center.x - lastCenter.current.x;
      const dy = center.y - lastCenter.current.y;
      const stageX = stage.x() + dx + center.x - center.x * scaleChange;
      const stageY = stage.y() + dy + center.y - center.y * scaleChange;
      setStageScale(newScale);
      setStagePos({ x: stageX, y: stageY });
    }

    lastDist.current = dist;
    lastCenter.current = center;
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastDist.current = 0;
    lastCenter.current = null;
  }, []);

  // ---- Button zoom (mobile) ----
  const handleZoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const newScale = Math.min(5, stageScale * 1.3);
    const w = stage.width();
    const h = stage.height();
    setStageScale(newScale);
    setStagePos({
      x: w / 2 - (w / 2 - stagePos.x) * (newScale / stageScale),
      y: h / 2 - (h / 2 - stagePos.y) * (newScale / stageScale),
    });
  }, [stageScale, stagePos]);

  const handleZoomOut = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const newScale = Math.max(0.1, stageScale / 1.3);
    const w = stage.width();
    const h = stage.height();
    setStageScale(newScale);
    setStagePos({
      x: w / 2 - (w / 2 - stagePos.x) * (newScale / stageScale),
      y: h / 2 - (h / 2 - stagePos.y) * (newScale / stageScale),
    });
  }, [stageScale, stagePos]);

  // ---- Click on empty area deselects / cancels arrow ----
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      if (activeTool === 'arrow') setConnectionStart(null);
    }
  }, [activeTool]);

  // ---- Center position for new objects ----
  const getCenterPos = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 200, y: 200 };
    const w = stage.width();
    const h = stage.height();
    return {
      x: (w / 2 - stagePos.x) / stageScale,
      y: (h / 2 - stagePos.y) / stageScale,
    };
  }, [stagePos, stageScale]);

  // ---- Toolbar actions ----
  const handleAddText = () => {
    const pos = getCenterPos();
    addObject({ type: 'text', x: pos.x - 100, y: pos.y, width: 200, height: 100, rotation: 0, content: 'Введите текст...' });
  };

  const handleAddCard = () => {
    const pos = getCenterPos();
    addObject({ type: 'card', x: pos.x - 80, y: pos.y - 60, width: 160, height: 120, rotation: 0, content: 'Заметка', style: { background: '#fef9c3' } });
  };

  const handleAddRectangle = () => {
    const pos = getCenterPos();
    addObject({ type: 'rectangle', x: pos.x - 75, y: pos.y - 50, width: 150, height: 100, rotation: 0, style: { background: '#e0e7ff' } });
  };

  const handleUploadImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxW = 400;
          const ratio = Math.min(1, maxW / img.width);
          const pos = getCenterPos();
          addObject({
            type: 'image',
            x: pos.x - (img.width * ratio) / 2,
            y: pos.y - (img.height * ratio) / 2,
            width: img.width * ratio,
            height: img.height * ratio,
            rotation: 0,
            imageSrc: src,
          });
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleExportJSON = () => {
    if (!currentBoardData) return;
    exportBoardToJSON(currentBoardData.objects, boardMeta?.name || 'board');
  };

  const handleImportJSON = async () => {
    try {
      const objects = await importBoardFromJSON();
      importObjects(objects);
    } catch (err) {
      alert('Ошибка импорта: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleExportPNG = () => {
    exportBoardToPNG(stageRef as React.RefObject<Konva.Stage>, boardMeta?.name || 'доска');
  };

  const handleClear = () => {
    if (confirm('Очистить все объекты на доске?')) clearBoard();
  };

  const objects = currentBoardData?.objects || [];
  const nonArrowObjects = objects.filter(o => o.type !== 'arrow');
  const arrowObjects = objects.filter(o => o.type === 'arrow');
  const canUndo = (currentBoardData?.historyIndex ?? 0) > 0;
  const canRedo = (currentBoardData?.historyIndex ?? 0) < (currentBoardData?.history.length ?? 1) - 1;

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: '#f3f4f6' }}>
      <Toolbar
        activeTool={activeTool}
        onToolSelect={(t) => {
          setActiveTool(t as 'select' | 'arrow');
          setConnectionStart(null);
        }}
        onAddText={handleAddText}
        onAddCard={handleAddCard}
        onAddRectangle={handleAddRectangle}
        onUploadImage={handleUploadImage}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onExportPNG={handleExportPNG}
        onClearBoard={handleClear}
        onUndo={undo}
        onRedo={redo}
        onBack={goToBoardManager}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        boardName={boardMeta?.name || 'Доска'}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Полотно канваса */}
      <div className="absolute inset-0">
        <Stage
          ref={stageRef}
          width={stageSize.w}
          height={stageSize.h}
          x={stagePos.x}
          y={stagePos.y}
          scaleX={stageScale}
          scaleY={stageScale}
          draggable={activeTool === 'select'}
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleStageClick}
          onTap={handleStageClick}
          onDragEnd={(e) => {
            if (e.target === e.target.getStage()) {
              setStagePos({ x: e.target.x(), y: e.target.y() });
            }
          }}
          style={{ background: '#f3f4f6', cursor: activeTool === 'arrow' ? 'crosshair' : 'default' }}
        >
          <Layer>
            {/* Стрелки рендерятся первыми (под объектами) */}
            {arrowObjects.map(obj => (
              <ArrowNode
                key={obj.id}
                obj={obj}
                allObjects={nonArrowObjects}
                isSelected={selectedId === obj.id}
                onSelect={(id) => {
                  if (activeTool === 'select') setSelectedId(id);
                }}
              />
            ))}
            {nonArrowObjects.map(obj => {
              if (obj.type === 'text') {
                return (
                  <TextNode
                    key={obj.id}
                    obj={obj}
                    isSelected={selectedId === obj.id}
                    onSelect={(id) => {
                      if (handleObjectClickForArrow(id)) return;
                      setSelectedId(id);
                    }}
                    onChange={updateObject}
                  />
                );
              }
              if (obj.type === 'card' || obj.type === 'rectangle') {
                return (
                  <CardNode
                    key={obj.id}
                    obj={obj}
                    isSelected={connectionStart === obj.id || selectedId === obj.id}
                    onSelect={(id) => {
                      if (handleObjectClickForArrow(id)) return;
                      setSelectedId(id);
                    }}
                    onChange={updateObject}
                  />
                );
              }
              if (obj.type === 'image') {
                return (
                  <ImageNode
                    key={obj.id}
                    obj={obj}
                    isSelected={selectedId === obj.id}
                    onSelect={(id) => {
                      if (handleObjectClickForArrow(id)) return;
                      setSelectedId(id);
                    }}
                    onChange={updateObject}
                  />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      </div>

      {/* Контекстная панель выбранного объекта */}
      {selectedId && activeTool === 'select' && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center gap-1 px-2 py-1.5"
          style={{ bottom: '24px' }}
        >
          <button
            onClick={() => { deleteObject(selectedId); setSelectedId(null); }}
            className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            🗑️ Удалить
          </button>
          <button
            onClick={() => setSelectedId(null)}
            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Счётчик объектов (десктоп) */}
      <div className="fixed bg-white rounded-lg shadow-sm border border-gray-200 px-2 py-1 text-xs text-gray-400 hidden sm:block z-40"
           style={{ bottom: '16px', right: '16px' }}>
        {nonArrowObjects.length} объектов&nbsp;•&nbsp;{arrowObjects.length} связей&nbsp;•&nbsp;{Math.round(stageScale * 100)}%
      </div>

      {/* Подсказка режима стрелок (десктоп) */}
      {activeTool === 'arrow' && connectionStart && (
        <div className="hidden sm:flex fixed top-14 left-1/2 -translate-x-1/2 z-40 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-full shadow">
          Источник выбран — кликните на целевой блок
        </div>
      )}


    </div>
  );
};

export default Board;
