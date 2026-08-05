import React from "react";
import SearchInput from "../SearchInput";
import PillOptionSelector from "../PillOptionSelector";

const SORTS = ["Recently Added", "Highest Rated", "Shortest Runtime", "Longest Runtime"];

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

const FavouriteFilters = ({
  searchInput,
  onSearchChange,
  onSearchClear,
  genres,
  selectedGenres,
  onToggleGenre,
  languages,
  selectedLanguages,
  onToggleLanguage,
  minRating,
  onRatingChange,
  sort,
  onSortChange,
}) => (
  <div className="space-y-4 mb-10">
    <SearchInput
      value={searchInput}
      onChange={onSearchChange}
      onClear={onSearchClear}
      suggestions={["Search your collection...", "Search by title...", "Find a saved favorite..."]}
    />

    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500 mr-1">Sort:</span>
      <PillOptionSelector options={SORTS} value={sort} onChange={onSortChange} />
    </div>

    {genres.length > 0 && (
      <div>
        <span className="text-xs text-gray-500 mb-1.5 block">Genre</span>
        <PillOptionSelector options={genres} value={selectedGenres} onChange={onToggleGenre} multiple />
      </div>
    )}

    {languages.length > 0 && (
      <div>
        <span className="text-xs text-gray-500 mb-1.5 block">Language</span>
        <PillOptionSelector
          options={languages}
          value={selectedLanguages}
          onChange={onToggleLanguage}
          multiple
          renderLabel={(lang) => {
            try {
              return languageNames.of(lang) ?? lang;
            } catch {
              return lang;
            }
          }}
        />
      </div>
    )}

    <div>
      <span className="text-xs text-gray-500 mb-1.5 block">Minimum Rating</span>
      <PillOptionSelector
        options={[0, 6, 7, 8, 9]}
        value={minRating}
        onChange={onRatingChange}
        renderLabel={(r) => (r === 0 ? "Any" : `${r}+`)}
      />
    </div>
  </div>
);

export default FavouriteFilters;
