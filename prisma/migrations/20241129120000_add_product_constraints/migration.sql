ALTER TABLE "ProductItem"
    ADD CONSTRAINT check_product_item_stock_positive
        CHECK (stock >= 0);

ALTER TABLE "ShoppingCartItem"
    ADD CONSTRAINT check_cart_item_quantity_positive
        CHECK (quantity > 0);

ALTER TABLE "ShoppingCartItem"
    ADD CONSTRAINT unique_cart_product_item
        UNIQUE ("cartId", "productItemId");

CREATE INDEX IF NOT EXISTS idx_product_item_stock_available 
    ON "ProductItem" (id, stock) 
    WHERE stock > 0;

CREATE INDEX IF NOT EXISTS idx_shopping_cart_user
    ON "ShoppingCart" ("userId");