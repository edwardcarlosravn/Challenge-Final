import { Injectable } from '@nestjs/common';
import { StockAlertEmailData } from '../http/dto/stock-alert/stock-alert-email.dto';
@Injectable()
export class EmailTemplateService {
  generateStockAlertHtml(data: StockAlertEmailData): string {
    const {
      userName,
      userEmail,
      productName,
      sku,
      price,
      stock,
      imageUrl,
      productUrl,
    } = data;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 10px;">
          <h1>🚨 Low Stock Alert!</h1>
          <p>Hello ${userName || userEmail}, you have a favorite product with limited units available</p>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>🚨 Hurry up!</strong> Only <strong>${stock} units</strong> left of this product in your favorites.
        </div>

        ${this.renderProductImage(imageUrl, productName)}

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">${productName}</h2>
          <p><strong>SKU:</strong> ${sku}</p>
          <p><strong>Price:</strong> <span style="color: #e74c3c; font-size: 1.2em;">$${price}</span></p>
          <p><strong>Available stock:</strong> <span style="color: #e74c3c; font-weight: bold;">${stock} units</span></p>
        </div>

        ${this.renderCallToAction(productUrl, sku)}

        <p style="text-align: center; color: #e74c3c; font-weight: bold;">
          Don't let it sell out, buy it before others do!
        </p>

        ${this.renderFooter()}
      </div>
    `;
  }

  private renderProductImage(imageUrl?: string, productName?: string): string {
    if (imageUrl) {
      return `
        <div style="text-align: center; margin: 20px 0;">
          <img src="${imageUrl}" 
               alt="${productName}" 
               style="max-width: 300px; height: auto; border-radius: 10px; border: 2px solid #ddd; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" 
               onerror="this.style.display='none'" />
        </div>
      `;
    }

    return `
      <div style="text-align: center; margin: 20px 0; padding: 40px; background-color: #f8f9fa; border-radius: 10px; color: #666;">
        <p>📷 Image not available</p>
      </div>
    `;
  }

  private renderCallToAction(productUrl?: string, sku?: string): string {
    const url =
      productUrl ||
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/products/${sku}`;

    return `
      <div style="text-align: center;">
        <a href="${url}" 
           style="display: inline-block; padding: 12px 25px; background-color: #00b894; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold;">
          🛒 Buy Now
        </a>
      </div>
    `;
  }

  private renderFooter(): string {
    return `
      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
        <p>This email was sent because you have this product in your favorites list.</p>
        <p>T-Shirts Store © ${new Date().getFullYear()}</p>
      </div>
    `;
  }
}
