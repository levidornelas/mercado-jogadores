"use client";

import { X } from "lucide-react";

export type ActiveFilter = {
  id: string;
  label: string;
  onRemove: () => void;
};

export function ActiveFilters({
  filters,
  onClear,
}: {
  filters: ActiveFilter[];
  onClear: () => void;
}) {
  if (!filters.length) return null;

  return (
    <div className="active-filters" aria-label="Filtros ativos">
      <span>Filtros ativos:</span>
      <div className="active-filter-list">
        {filters.map((filter) => (
          <button
            key={filter.id}
            className="active-filter-chip"
            onClick={filter.onRemove}
            aria-label={"Remover filtro " + filter.label}
          >
            {filter.label}
            <X aria-hidden="true" />
          </button>
        ))}
      </div>
      <button className="clear-filters" onClick={onClear}>
        Limpar filtros
      </button>
    </div>
  );
}
