export interface StockAlertEmailData {
  userName: string;
  userEmail: string;
  productName: string;
  sku: string;
  price: number;
  stock: number;
  imageUrl?: string;
  productUrl?: string;
}
