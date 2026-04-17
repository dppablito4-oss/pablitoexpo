export function generateSlug(title) {
  if (!title) return 'presentacion';
  
  // Convert to lowercase, remove accents
  const baseSlug = title
    .toString()
    .toLowerCase()
    .normalize('NFD') // splits accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, '') // remove the diacritical marks
    .trim()
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/[^\w-]+/g, '') // remove non-word characters
    .replace(/--+/g, '-') // replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text

  // Generate a random 4-char alphanumeric string
  const hash = Math.random().toString(36).substring(2, 6);
  
  return baseSlug ? `${baseSlug}-${hash}` : hash;
}
