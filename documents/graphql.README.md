## 🚀 GraphQL API

In addition to REST endpoints, the application also exposes a GraphQL API at:
- **Playground**: `http://localhost:3000/graphql`
- **Introspection**: Enabled in development

### Authentication for GraphQL

GraphQL endpoints use JWT authentication via the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

# 📊 GraphQL Queries & Mutations Documentation

## 🔍 Queries

### 1. Get All Products (Paginated)
**Description**: Retrieves all products with pagination
**Requires authentication**: No

```graphql
query GetProducts($pagination: PaginationInput) {
  products(pagination: $pagination) {
    data {
      id
      name
      description
      is_active
      created_at
      updated_at
      categories {
        id
        name
        slug
        description
      }
      variations {
        id
        productId
        isActive
        items {
          id
          sku
          price
          stock
          attributes {
            attributeValueId
            value
            attributeName
          }
        }
        images {
          id
          s3Key
          alt_text
          created_at
        }
      }
    }
    metadata {
      totalItems
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

**Variables example**:
```json
{
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "sortBy": "created_at",
    "sortOrder": "DESC"
  }
}
```

---

### 2. Get Products by Categories
**Description**: Retrieves products filtered by categories
**Requires authentication**: No

```graphql
query GetProductsByCategories($filters: ProductFiltersInput!) {
  productsByCategories(filters: $filters) {
    data {
      id
      name
      description
      is_active
      categories {
        id
        name
        slug
      }
      variations {
        id
        items {
          id
          sku
          price
          stock
        }
      }
    }
    metadata {
      totalItems
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

**Variables example**:
```json
{
  "filters": {
    "page": 1,
    "pageSize": 5,
    "categoryNames": ["T-Shirts", "Hoodies"],
    "isActive": true,
    "sortBy": "name",
    "sortOrder": "ASC"
  }
}
```

---

### 3. Get Single Product by ID
**Description**: Retrieves detailed information of a specific product
**Requires authentication**: No

```graphql
query GetProduct($id: String!) {
  product(id: $id) {
    id
    name
    description
    is_active
    created_at
    updated_at
    categories {
      id
      name
      slug
      description
    }
    variations {
      id
      productId
      isActive
      items {
        id
        variationId
        sku
        price
        stock
        attributes {
          attributeValueId
          value
          attributeName
        }
      }
      images {
        id
        variationId
        s3Key
        alt_text
        created_at
      }
    }
  }
}
```

**Variables example**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 4. Get All Categories
**Description**: Retrieves all available categories
**Requires authentication**: No

```graphql
query GetCategories {
  categories {
    id
    name
    slug
    description
    is_active
    createdAt
  }
}
```

---

### 5. Get My Shopping Cart
**Description**: Retrieves the authenticated user's shopping cart
**Requires authentication**: JWT

```graphql
query GetMyCart {
  myCart {
    id
    userId
    created_at
    updated_at
    items {
      id
      cartId
      productItemId
      quantity
      created_at
      updated_at
    }
  }
}
```

---

### 6. Get My Orders
**Description**: Retrieves orders for the authenticated user
**Requires authentication**: JWT

```graphql
query GetMyOrders($filters: GetOrdersFilterInput) {
  myOrders(filters: $filters) {
    data {
      id
      userId
      shippingAddress
      orderStatus
      orderDate
      orderTotal
      created_at
      updated_at
      orderLines {
        id
        orderId
        productItemId
        quantity
        price
        created_at
        productItem {
          id
          sku
          price
          stock
        }
      }
    }
    metadata {
      totalItems
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

**Variables example**:
```json
{
  "filters": {
    "page": 1,
    "pageSize": 10,
    "status": "PENDING",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "sortBy": "orderDate",
    "sortOrder": "DESC"
  }
}
```

---

### 7. Get Order Details
**Description**: Retrieves detailed information of a specific order
**Requires authentication**: JWT

```graphql
query GetOrderDetails($orderId: String!) {
  orderDetails(orderId: $orderId) {
    id
    userId
    shippingAddress
    orderStatus
    orderDate
    orderTotal
    created_at
    updated_at
    orderLines {
      id
      orderId
      productItemId
      quantity
      price
      created_at
      productItem {
        id
        variationId
        sku
        price
        stock
        attributes {
          attributeValueId
          value
          attributeName
        }
      }
    }
  }
}
```

**Variables example**:
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 8. Get All Orders (Admin Only)
**Description**: Retrieves all orders in the system (admin only)
**Requires authentication**: JWT
**Required roles**: ADMIN

```graphql
query GetAllOrders($filters: GetOrdersFilterInput) {
  allOrders(filters: $filters) {
    data {
      id
      userId
      shippingAddress
      orderStatus
      orderDate
      orderTotal
      created_at
      updated_at
      orderLines {
        id
        quantity
        price
        productItem {
          id
          sku
          price
        }
      }
    }
    metadata {
      totalItems
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

---

### 9. Get My Favorites
**Description**: Retrieves the authenticated user's favorite products
**Requires authentication**: JWT

```graphql
query GetMyFavorites {
  myFavorites {
    id
    userId
    productItemId
    created_at
  }
}
```

---

### 10. Get Variation Image URLs
**Description**: Retrieves signed URLs for variation images
**Requires authentication**: No

```graphql
query GetVariationImageUrls($variationId: String!) {
  getVariationImageUrls(variationId: $variationId)
}
```

**Variables example**:
```json
{
  "variationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## ✏️ Mutations

### 1. Create Product with Variations
**Description**: Creates a new product with its variations and items
**Requires authentication**: JWT
**Required roles**: ADMIN, EDITOR

```graphql
mutation CreateProductWithVariations($input: CreateProductWithVariationsInput!) {
  createProductWithVariations(input: $input) {
    id
    name
    description
    is_active
    created_at
    categories {
      id
      name
      slug
    }
    variations {
      id
      productId
      isActive
      items {
        id
        sku
        price
        stock
        attributes {
          attributeValueId
          value
          attributeName
        }
      }
    }
  }
}
```

**Variables example**:
```json
{
  "input": {
    "name": "Premium Cotton T-Shirt",
    "description": "High-quality cotton t-shirt available in multiple sizes and colors",
    "categoryNames": ["T-Shirts", "Cotton"],
    "variations": [
      {
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "items": [
          {
            "sku": "TSHIRT-M-RED-001",
            "price": 29.99,
            "stock": 100,
            "attributes": [
              {
                "attributeValueId": 1
              },
              {
                "attributeValueId": 2
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

### 2. Update Product
**Description**: Updates an existing product's basic information
**Requires authentication**: JWT
**Required roles**: ADMIN, EDITOR

```graphql
mutation UpdateProduct($input: UpdateProductInput!) {
  updateProduct(input: $input) {
    id
    name
    description
    is_active
    updated_at
    categories {
      id
      name
      slug
    }
  }
}
```

**Variables example**:
```json
{
  "input": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Premium T-Shirt",
    "description": "Updated description for premium t-shirt",
    "isActive": true
  }
}
```

---

### 3. Create Category
**Description**: Creates a new product category
**Requires authentication**: No

```graphql
mutation CreateCategory($input: CreateCategoryInput!) {
  createCategory(input: $input) {
    id
    name
    slug
    description
    is_active
    createdAt
  }
}
```

**Variables example**:
```json
{
  "input": {
    "name": "Premium Collection",
    "slug": "premium-collection",
    "description": "High-end t-shirts and apparel"
  }
}
```

---

### 4. Create Variation
**Description**: Creates a new variation for an existing product
**Requires authentication**: No

```graphql
mutation CreateVariation($input: CreateVariationInput!) {
  createVariation(input: $input) {
    id
    productId
    isActive
    items {
      id
      variationId
      sku
      price
      stock
      attributes {
        attributeValueId
        value
        attributeName
      }
    }
  }
}
```

**Variables example**:
```json
{
  "input": {
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "items": [
      {
        "sku": "TSHIRT-L-BLUE-002",
        "price": 32.99,
        "stock": 50,
        "attributes": [
          {
            "attributeValueId": 3
          },
          {
            "attributeValueId": 4
          }
        ]
      }
    ]
  }
}
```

---

### 5. Add to Cart
**Description**: Adds a product item to the user's shopping cart
**Requires authentication**: JWT

```graphql
mutation AddToCart($input: AddToCartInput!) {
  addToCart(input: $input) {
    id
    cartId
    productItemId
    quantity
    created_at
    updated_at
  }
}
```

**Variables example**:
```json
{
  "input": {
    "productItemId": 123,
    "quantity": 2
  }
}
```

---

### 6. Update Cart Item Quantity
**Description**: Updates the quantity of an item in the shopping cart
**Requires authentication**: JWT

```graphql
mutation UpdateCartItemQuantity($input: UpdateCartItemInput!) {
  updateCartItemQuantity(input: $input) {
    id
    cartId
    productItemId
    quantity
    updated_at
  }
}
```

**Variables example**:
```json
{
  "input": {
    "cartItemId": 456,
    "quantity": 3
  }
}
```

---

### 7. Remove from Cart
**Description**: Removes an item from the shopping cart
**Requires authentication**: JWT

```graphql
mutation RemoveFromCart($input: RemoveFromCartInput!) {
  removeFromCart(input: $input)
}
```

**Variables example**:
```json
{
  "input": {
    "cartItemId": 456
  }
}
```

---

### 8. Clear Cart
**Description**: Removes all items from the user's shopping cart
**Requires authentication**: JWT

```graphql
mutation ClearCart {
  clearCart
}
```

---

### 9. Create Order from Cart
**Description**: Creates an order from the current shopping cart items
**Requires authentication**: JWT

```graphql
mutation CreateOrderFromCart($input: CreateOrderFromCartInput!) {
  createOrderFromCart(input: $input) {
    id
    userId
    shippingAddress
    orderStatus
    orderDate
    orderTotal
    created_at
    orderLines {
      id
      productItemId
      quantity
      price
      productItem {
        id
        sku
        price
      }
    }
  }
}
```

**Variables example**:
```json
{
  "input": {
    "shippingAddress": "123 Main St, Apartment 4B, New York, NY 10001, USA"
  }
}
```

---

### 10. Update Order Status
**Description**: Updates the status of an existing order (Admin only)
**Requires authentication**: JWT
**Required roles**: ADMIN

```graphql
mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
  updateOrderStatus(input: $input) {
    id
    userId
    orderStatus
    updated_at
    orderLines {
      id
      quantity
      price
    }
  }
}
```

**Variables example**:
```json
{
  "input": {
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "newStatus": "APPROVED"
  }
}
```

---

### 11. Add to Favorites
**Description**: Adds a product item to the user's favorites
**Requires authentication**: JWT

```graphql
mutation AddFavorite($input: AddFavoriteInput!) {
  addFavorite(input: $input) {
    id
    userId
    productItemId
    created_at
  }
}
```

**Variables example**:
```json
{
  "input": {
    "productItemId": 123
  }
}
```

---

### 12. Delete Product Item
**Description**: Deletes a specific product item
**Requires authentication**: JWT
**Required roles**: ADMIN, EDITOR

```graphql
mutation DeleteProductItem($input: DeleteProductItemInput!) {
  deleteProductItem(input: $input)
}
```

**Variables example**:
```json
{
  "input": {
    "id": 123
  }
}
```

---

### 13. Generate Variation Image Upload URL
**Description**: Generates a pre-signed URL for uploading variation images to S3
**Requires authentication**: JWT
**Required roles**: ADMIN, EDITOR

```graphql
mutation GenerateVariationImageUploadUrl($variationId: String!, $fileName: String!, $contentType: String!) {
  generateVariationImageUploadUrl(
    variationId: $variationId
    fileName: $fileName
    contentType: $contentType
  )
}
```

**Variables example**:
```json
{
  "variationId": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "tshirt-red-front.jpg",
  "contentType": "image/jpeg"
}
```

---

## 📝 GraphQL Usage Examples

### Complete Product Management Flow (Admin/Editor)

```bash
# 1. Create a new category
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateCategory($input: CreateCategoryInput!) { createCategory(input: $input) { id name slug description is_active createdAt } }",
    "variables": {
      "input": {
        "name": "Premium T-Shirts",
        "slug": "premium-tshirts",
        "description": "High-quality cotton t-shirts"
      }
    }
  }'

# 2. Create a product with variations
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateProductWithVariations($input: CreateProductWithVariationsInput!) { createProductWithVariations(input: $input) { id name description categories { id name } variations { id items { id sku price stock } } } }",
    "variables": {
      "input": {
        "name": "Premium Cotton T-Shirt",
        "description": "High-quality cotton t-shirt",
        "categoryNames": ["Premium T-Shirts"],
        "variations": []
      }
    }
  }'
```

### Customer Shopping Flow

```bash
# 1. Browse products
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetProducts($pagination: PaginationInput) { products(pagination: $pagination) { data { id name description variations { items { id sku price stock } } } metadata { totalItems currentPage totalPages } } }",
    "variables": {
      "pagination": {
        "page": 1,
        "pageSize": 5
      }
    }
  }'

# 2. Add item to cart (requires authentication)
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer CLIENT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation AddToCart($input: AddToCartInput!) { addToCart(input: $input) { id cartId productItemId quantity } }",
    "variables": {
      "input": {
        "productItemId": 123,
        "quantity": 2
      }
    }
  }'

# 3. Create order from cart
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer CLIENT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateOrderFromCart($input: CreateOrderFromCartInput!) { createOrderFromCart(input: $input) { id orderStatus orderTotal shippingAddress orderLines { quantity price } } }",
    "variables": {
      "input": {
        "shippingAddress": "123 Main St, New York, NY 10001"
      }
    }
  }'
```

### Favorites Management

```bash
# 1. Add to favorites
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer CLIENT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation AddFavorite($input: AddFavoriteInput!) { addFavorite(input: $input) { id userId productItemId created_at } }",
    "variables": {
      "input": {
        "productItemId": 123
      }
    }
  }'

# 2. Get my favorites
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer CLIENT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetMyFavorites { myFavorites { id userId productItemId created_at } }"
  }'
```

---

## 🔄 GraphQL Error Handling

GraphQL responses include errors in a standardized format:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Product not found",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": [
        "product"
      ],
      "extensions": {
        "code": "NOT_FOUND",
        "exception": {
          "stacktrace": ["Error: Product not found"]
        }
      }
    }
  ]
}
```

### Common Error Codes
- `UNAUTHENTICATED`: Missing or invalid JWT token
- `FORBIDDEN`: Insufficient permissions for the operation
- `NOT_FOUND`: Requested resource does not exist
- `BAD_USER_INPUT`: Invalid input data or validation errors
- `INTERNAL_SERVER_ERROR`: Unexpected server error
