export const normalizeSearchText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const matchesSearch = (item, fields, searchTerm) => {
  const query = normalizeSearchText(searchTerm);

  if (!query) return true;

  return fields.some((field) => {
    const value = typeof field === "function" ? field(item) : item[field];

    return normalizeSearchText(value).includes(query);
  });
};
