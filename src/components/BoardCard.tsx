import React, { useState } from 'react';
import type { BoardMeta } from '../types';

interface BoardCardProps {
  board: BoardMeta;
  objectCount: number;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

const BoardCard: React.FC<BoardCardProps> = ({ board, objectCount, onSelect, onDelete, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(board.name);

  const handleRename = () => {
    if (name.trim()) {
      onRename(board.id, name.trim());
    } else {
      setName(board.name);
    }
    setEditing(false);
  };

  const updatedDate = new Date(board.updatedAt).toLocaleDateString('ru-RU', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
      {/* Board preview area */}
      <div
        className="h-32 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center cursor-pointer"
        onClick={() => onSelect(board.id)}
      >
        <div className="text-4xl opacity-30">📋</div>
      </div>

      {/* Board info */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        {editing ? (
          <input
            autoFocus
            className="text-sm font-semibold text-gray-800 border border-indigo-400 rounded px-1 w-full focus:outline-none"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setName(board.name); setEditing(false); }
            }}
          />
        ) : (
          <h3
            className="text-sm font-semibold text-gray-800 truncate cursor-pointer hover:text-indigo-600"
            onDoubleClick={() => setEditing(true)}
            title={board.name}
          >
            {board.name}
          </h3>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{objectCount} объектов</span>
          <span>{updatedDate}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex items-center gap-1">
        <button
          onClick={() => onSelect(board.id)}
          className="flex-1 bg-indigo-600 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Открыть
        </button>
        <button
          onClick={() => setEditing(true)}
          title="Переименовать"
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(board.id)}
          title="Удалить"
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default BoardCard;
