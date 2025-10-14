import React from 'react';

interface DeckSelectorProps {
  decks: Array<{ deck: number; stack_name: string }>;
  selectedDeck: number;
  onDeckChange: (deck: number) => void;
}

export default function DeckSelector({ 
  decks, 
  selectedDeck, 
  onDeckChange 
}: DeckSelectorProps) {
  if (decks.length <= 1) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-sm font-semibold mb-3 text-gray-700">Seleccionar Piso</h3>
      <div className="flex gap-2">
        {decks.map((deckInfo) => (
          <button
            key={deckInfo.deck}
            onClick={() => onDeckChange(deckInfo.deck)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${selectedDeck === deckInfo.deck
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            Piso {deckInfo.deck}
            <span className="block text-xs mt-1 opacity-80">
              {deckInfo.stack_name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}