export function matchesExploreCard(card, { selectedCategory = 'Todo', query = '' } = {}) {
  const category = String(card?.category || '');
  const searchable = String(card?.search || '').toLocaleLowerCase('es');
  const normalizedQuery = String(query || '').trim().toLocaleLowerCase('es');
  const categoryMatches = selectedCategory === 'Todo' || category === selectedCategory;
  return categoryMatches && (!normalizedQuery || searchable.includes(normalizedQuery));
}
