// Given static sources and userSites (array of URLs), build the final list.

export function buildSources(staticSources, userSites, placeholderPage) {
  const user = (userSites || []).map((url, idx) => ({ label: `Site ${idx + 1}`, source: url }));
  let list = [...(staticSources || []), ...user];
  if (list.length === 0 && placeholderPage) {
    list = [{ label: 'Placeholder', source: placeholderPage }];
  }
  return list;
}


