import { useMemo } from "react";

import { type MultiSelectOption } from "@/components";
import type { FilterOptions } from "@/modules/library/api";
import { useLibraryFilterStore } from "@/stores";

interface FilterBarProps {
  filterOptions: FilterOptions;
}

export function FilterBar({ filterOptions }: FilterBarProps) {
  const { selectedChampions, setChampions } = useLibraryFilterStore();

  const championOptions = useMemo<MultiSelectOption[]>(
    () => filterOptions.champions.map((c) => ({ value: c, label: c })),
    [filterOptions.champions],
  );

  void selectedChampions;
  void setChampions;
  void championOptions;
  void filterOptions;

  return null;
}