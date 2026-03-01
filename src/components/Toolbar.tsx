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
      <div className="hidden sm:flex fixed top-0 left-0 right-0 z-50 bg-slate-800 border-b border-slate-700 px-3 items-center gap-1 shadow-lg" style={{ height: '48px' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 mr-1 text-sm text-slate-300 hover:text-white hover:bg-slate-700 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium"
        >
          ← Доски
        </button>

        <div className="w-px h-5 bg-slate-600 mx-1" />

        <span className="text-sm font-semibold text-white mr-1 max-w-36 truncate">{boardName}</span>

        <div className="w-px h-5 bg-slate-600 mx-1" />

        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Отменить (Ctrl+Z)"
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
        >↩</button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Повторить (Ctrl+Y)"
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
        >↪</button>

        <div className="w-px h-5 bg-slate-600 mx-1" />

        <ToolBtn label="T"   title="Текст"         onClick={onAddText} />
        <ToolBtn label="📄"  title="Карточка"      onClick={onAddCard} />
        <ToolBtn label="⬜"  title="Прямоугольник" onClick={onAddRectangle} />
        <ToolBtn label="🖼️" title="Изображение"   onClick={onUploadImage} />

        <button
          onClick={() => onToolSelect(isArrow ? 'select' : 'arrow')}
          title={isArrow ? 'Выйти из режима стрелок' : 'Режим стрелок'}
          className={`px-2.5 h-8 flex items-center justify-center rounded-lg transition-colors text-sm font-bold
            ${isArrow ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
        >→</button>

        {isArrow && (
          <span className="text-xs text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded-full whitespace-nowrap ml-1 border border-indigo-700">
            Кликни источник → цель
          </span>
        )}

        <div className="w-px h-5 bg-slate-600 mx-1" />

        <ToolBtn label="+" title="Приблизить" onClick={onZoomIn} />
        <ToolBtn label="−" title="Отдалить"   onClick={onZoomOut} />

        <div className="w-px h-5 bg-slate-600 mx-1" />

        <ToolBtn label="⬇️" title="Экспорт JSON" onClick={onExportJSON} />
        <ToolBtn label="⬆️" title="Импорт JSON"  onClick={onImportJSON} />
        <ToolBtn label="📸" title="Экспорт PNG"  onClick={onExportPNG} />

        <div className="w-px h-5 bg-slate-600 mx-1" />

        <button
          onClick={onClearBoard}
          title="Очистить доску"
          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/40 transition-colors text-sm"
        >🗑️</button>
      </div>

      {/* ─── Верхняя панель (мобильный) ─── */}
      <div
        className="flex sm:hidden fixed top-0 left-0 right-0 z-50 bg-slate-800 border-b border-slate-700 shadow-xl"
        style={{ height: '64px', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-around w-full px-2 h-full gap-1">
          <MobileBtn icon="T"   label="Текст"    color="indigo"  onClick={() => { onAddText(); setMoreOpen(false); }} />
          <MobileBtn icon="📄" label="Карточка" color="violet"  onClick={() => { onAddCard(); setMoreOpen(false); }} />
          <MobileBtn
            icon="→"
            label="Стрелка"
            color="sky"
            onClick={() => { onToolSelect(isArrow ? 'select' : 'arrow'); setMoreOpen(false); }}
            active={isArrow}
          />
          <MobileBtn icon="📸" label="Экспорт"  color="emerald" onClick={() => { onExportPNG(); setMoreOpen(false); }} />
          <MobileBtn icon="+"  label="Увелич."  color="amber"   onClick={onZoomIn} />
          <MobileBtn icon="−"  label="Умен."    color="amber"   onClick={onZoomOut} />
          <button
            onClick={() => setMoreOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all w-11 h-12 text-xs
              ${moreOpen
                ? 'bg-slate-600 text-white shadow-inner'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'}`}
          >
            <span className="text-base font-bold leading-none tracking-widest">···</span>
            <span className="text-[8px] leading-none font-medium">Ещё</span>
          </button>
        </div>
      </div>

      {/* ─── Выпадающее меню "Ещё" (мобильный) ─── */}
      {moreOpen && (
        <div
          className="flex sm:hidden fixed left-0 right-0 z-40 bg-slate-800 border-b border-slate-700 shadow-xl"
          style={{ top: '64px' }}
        >
          <div className="flex items-center justify-around w-full px-2 py-2 gap-1">
            <MobileBtn icon="←"   label="Доски"     color="slate"   onClick={() => { onBack(); setMoreOpen(false); }} />
            <MobileBtn icon="⬜"  label="Прямоуг."  color="blue"    onClick={() => { onAddRectangle(); setMoreOpen(false); }} />
            <MobileBtn icon="🖼️" label="Изображ."  color="pink"    onClick={() => { onUploadImage(); setMoreOpen(false); }} />
            <MobileBtn icon="↩"   label="Отменить"  color="slate"   onClick={onUndo} disabled={!canUndo} />
            <MobileBtn icon="↪"   label="Повторить" color="slate"   onClick={onRedo} disabled={!canRedo} />
            <MobileBtn icon="⬇️" label="JSON"       color="teal"    onClick={() => { onExportJSON(); setMoreOpen(false); }} />
            <MobileBtn icon="🗑️" label="Очистить"  color="red"     onClick={() => { onClearBoard(); setMoreOpen(false); }} />
          </div>
        </div>
      )}

      {/* Подсказка режима стрелок на мобильном */}
      {isArrow && !moreOpen && (
        <div
          className="flex sm:hidden fixed left-0 right-0 z-40 bg-indigo-700 text-white text-xs text-center py-1.5 px-3 font-medium"
          style={{ top: '64px' }}
        >
          Режим стрелок: нажми на источник, затем на цель
        </div>
      )}
    </>
  );
};

/* ─── Десктоп кнопка ─── */
const ToolBtn: React.FC<{ label: string; title: string; onClick: () => void }> = ({ label, title, onClick }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-sm font-semibold"
  >
    {label}
  </button>
);

/* ─── Мобильная кнопка ─── */
const COLOR_MAP: Record<string, { bg: string; activeBg: string; text: string; activeText: string }> = {
  indigo:  { bg: 'bg-indigo-600/30',  activeBg: 'bg-indigo-500',  text: 'text-indigo-300',  activeText: 'text-white' },
  violet:  { bg: 'bg-violet-600/30',  activeBg: 'bg-violet-500',  text: 'text-violet-300',  activeText: 'text-white' },
  sky:     { bg: 'bg-sky-600/30',     activeBg: 'bg-sky-500',     text: 'text-sky-300',     activeText: 'text-white' },
  emerald: { bg: 'bg-emerald-600/30', activeBg: 'bg-emerald-500', text: 'text-emerald-300', activeText: 'text-white' },
  amber:   { bg: 'bg-amber-600/30',   activeBg: 'bg-amber-500',   text: 'text-amber-300',   activeText: 'text-white' },
  blue:    { bg: 'bg-blue-600/30',    activeBg: 'bg-blue-500',    text: 'text-blue-300',    activeText: 'text-white' },
  pink:    { bg: 'bg-pink-600/30',    activeBg: 'bg-pink-500',    text: 'text-pink-300',    activeText: 'text-white' },
  teal:    { bg: 'bg-teal-600/30',    activeBg: 'bg-teal-500',    text: 'text-teal-300',    activeText: 'text-white' },
  red:     { bg: 'bg-red-600/30',     activeBg: 'bg-red-500',     text: 'text-red-300',     activeText: 'text-white' },
  slate:   { bg: 'bg-slate-600/50',   activeBg: 'bg-slate-500',   text: 'text-slate-300',   activeText: 'text-white' },
};

const MobileBtn: React.FC<{
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}> = ({ icon, label, color, onClick, disabled, active }) => {
  const c = COLOR_MAP[color] ?? COLOR_MAP.slate;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all w-11 h-12 disabled:opacity-30 disabled:cursor-not-allowed
        ${active ? `${c.activeBg} ${c.activeText} shadow-lg` : `${c.bg} ${c.text} hover:brightness-125`}`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-[8px] leading-none font-semibold tracking-wide uppercase">{label}</span>
    </button>
  );
};

export default Toolbar;
