export function createSelector(indices: string[]) {
  const left = '[data-id="';
  const right = '"]';
  return left + indices.join(`${right}, ${left}`) + right;
}
