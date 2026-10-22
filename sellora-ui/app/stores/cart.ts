import { defineStore } from 'pinia';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category?: string;
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),
  
  getters: {
    cartItemsCount(): number {
      return this.items.reduce((total, item) => total + item.quantity, 0);
    },
    cartTotal(): number {
      return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
    }
  },
  
  actions: {
    initCart() {
      if (import.meta.client) {
        const stored = localStorage.getItem('sellora_cart');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // Validate that stored items have required fields
            if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((item: any) => typeof item.id === 'number' && typeof item.name === 'string')) {
              this.items = parsed;
            } else {
              this.items = [];
              localStorage.removeItem('sellora_cart');
            }
          } catch (e) {
            this.items = [];
            localStorage.removeItem('sellora_cart');
          }
        }
      }
    },
    
    saveCart() {
      if (import.meta.client) {
        localStorage.setItem('sellora_cart', JSON.stringify(this.items));
      }
    },
    
    addItem(product: Omit<CartItem, 'quantity'> & { stock?: number }, qty: number = 1) {
      const { stock, ...item } = product;
      const existing = this.items.find((i) => i.id === item.id);
      const cap = typeof stock === 'number' ? stock : Infinity;
      if (existing) {
        existing.quantity = Math.min(existing.quantity + qty, cap);
      } else {
        this.items.push({ ...item, quantity: Math.min(qty, cap) });
      }
      this.saveCart();
    },
    
    removeItem(productId: number) {
      const idx = this.items.findIndex(item => item.id === productId);
      if (idx !== -1) {
        this.items.splice(idx, 1);
      }
      this.saveCart();
    },
    
    updateQuantity(productId: number, quantity: number) {
      const existing = this.items.find(item => item.id === productId);
      if (existing) {
        existing.quantity = Math.max(1, quantity);
      }
      this.saveCart();
    },
    
    clearCart() {
      this.items = [];
      this.saveCart();
    }
  }
});
