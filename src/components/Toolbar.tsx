import React, { useState } from 'react';

interface ToolbarProps {
  activeTool: string;
  onToolSelect: (tool: string) => void;
  onAddText: () => void;
  onAddCard: () => void;
  onAddRectangle: () => void;
  onUploadImage: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  onExportPNG: () => void;
  onClearBoard: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onBack: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  boardName: string;
  canUndo: boolean;
  canRedo: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool, onToolSelect,
  onAddText, onAddCard, onAddRectangle, onUploadImage,
  onExportJSON, onImportJSON, onExportPNG, onClearBoard,
  onUndo, onRedo, onBack, onZoomIn, onZoomOut, boardName, canUndo, canRedo,
}) => {
  const isArrow = activeTool === 'arrow';
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* ─── Панель инструментов (десктоп) ─── */}
      <div className="hidden sm:flex fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-3 items-center gap-1 shadow-sm" style={{ height: '48px' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 mr-1 text-sm text-gray-600 hover:text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
        >
          ← Доски
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <span className="text-sm font-semibold text-gray-700 mr-1 max-w-36 truncate">{boardName}</span>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Отменить (Ctrl+Z)"
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
        >↩</button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Повторить (Ctrl+Y)"
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
        >↪</button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolBtn label="T"   title="Текст"            onClick={onAddText} />
        <ToolBtn label="📄"  title="Карточка"         onClick={onAddCard} />
        <ToolBtn label="⬜"  title="Прямоугольник"    onClick={onAddRectangle} />
        <ToolBtn label="🖼️" title="Изображение"      onClick={onUploadImage} />

        {/* Стрелка — режим соединения */}
        <button
          onClick={() => onToolSelect(isArrow ? 'select' : 'arrow')}
          title={isArrow ? 'Выйти из режима стрелок' : 'Режим стрелок: соединить блоки'}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-sm font-bold
            ${isArrow ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50 text-gray-600 hover:text-indigo-600'}`}
        >→</button>

        {isArrow && (
          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full whitespace-nowrap ml-1">
            Кликни источник → цель
          </span>
        )}

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolBtn label="+" title="Приблизить" onClick={onZoomIn} />
        <ToolBtn label="−" title="Отдалить"   onClick={onZoomOut} />

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolBtn label="⬇️" title="Экспорт JSON" onClick={onExportJSON} />
        <ToolBtn label="⬆️" title="Импорт JSON"  onClick={onImportJSON} />
        <ToolBtn label="📸" title="Экспорт PNG"  onClick={onExportPNG} />

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          onClick={onClearBoard}
          title="Очистить доску"
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors text-sm"
        >🗑️</button>
      </div>

      {/* ─── Верхняя панель (мобильный) ─── */}
      <div
        className="flex sm:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-lg"
        style={{ height: '56px', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-around w-full px-1 h-full">
          <MobileBtn label="T"  title="Текст"    onClick={() => { onAddText(); setMoreOpen(false); }} />
          <MobileBtn label="📄" title="Карточка" onClick={() => { onAddCard(); setMoreOpen(false); }} />
          <MobileBtn
            label="→"
            title="Стрелка"
            onClick={() => { onToolSelect(isArrow ? 'select' : 'arrow'); setMoreOpen(false); }}
            active={isArrow}
          />
          <MobileBtn label="+" title="Увелич." onClick={onZoomIn} />
          <MobileBtn label="−" title="Умен."   onClick={onZoomOut} />
          {/* Кнопка "ещё" */}
          <button
            onClick={() => setMoreOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors w-10 h-full
              ${moreOpen ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'}`}
          >
            <span className="text-base font-bold leading-none">•••</span>
            <span className="text-[8px] leading-none">Ещё</span>
          </button>
        </div>
      </div>

      {/* ─── Выпадающее меню "Ещё" (мобильный) ─── */}
      {moreOpen && (
        <div
          className="flex sm:hidden fixed left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-md"
          style={{ top: '56px' }}
        >
          <div className="flex items-center justify-around w-full px-1 py-1.5">
            <MobileBtn label="←"   title="Доски"     onClick={() => { onBack(); setMoreOpen(false); }} />
            <MobileBtn label="⬜"  title="Прямоуг."  onClick={() => { onAddRectangle(); setMoreOpen(false); }} />
            <MobileBtn label="🖼️" title="Изображ."  onClick={() => { onUploadImage(); setMoreOpen(false); }} />
            <MobileBtn label="↩"   title="Отменить"  onClick={onUndo} disabled={!canUndo} />
            <MobileBtn label="↪"   title="Повторить" onClick={onRedo} disabled={!canRedo} />
            <MobileBtn label="⬇️" title="Экспорт"   onClick={() => { onExportJSON(); setMoreOpen(false); }} />
            <MobileBtn label="🗑️" title="Очистить"  onClick={() => { onClearBoard(); setMoreOpen(false); }} />
          </div>
        </div>
      )}

      {/* Подсказка режима стрелок на мобильном */}
      {isArrow && !moreOpen && (
        <div
          className="flex sm:hidden fixed left-0 right-0 z-40 bg-indigo-600 text-white text-xs text-center py-1.5 px-3"
          style={{ top: '56px' }}
        >
          Режим стрелок: нажми на источник, затем на цель
        </div>
      )}
    </>
  );
};

const ToolBtn: React.FC<{ label: string; title: string; onClick: () => void }> = ({ label, title, onClick }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-colors text-sm font-medium"
  >
    {label}
  </button>
);

const MobileBtn: React.FC<{
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}> = ({ label, title, onClick, disabled, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex flex-col items-center justify-center gap-0.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors w-10 h-full
      ${active ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'}`}
  >
    <span className="text-lg leading-none">{label}</span>
    <span className="text-[8px] leading-none">{title}</span>
  </button>
);

export default Toolbar;
