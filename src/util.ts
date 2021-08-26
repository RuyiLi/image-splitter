export function classes(...names) {
  return names.filter((cls) => !!cls).join(' ');
}
