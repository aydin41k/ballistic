type FocusListener = (itemId: string) => void;

const listeners = new Set<FocusListener>();
let pendingItemId: string | null = null;

export function focusJournalItem(itemId: string): void {
  pendingItemId = itemId;
  if (listeners.size === 0) return;
  listeners.forEach((listener) => listener(itemId));
  pendingItemId = null;
}

export function subscribeToJournalFocus(listener: FocusListener): () => void {
  listeners.add(listener);
  if (pendingItemId) {
    const itemId = pendingItemId;
    pendingItemId = null;
    listener(itemId);
  }
  return () => listeners.delete(listener);
}
