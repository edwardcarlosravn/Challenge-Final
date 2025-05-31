import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAttributes() {
  try {
    const colorAttribute = await prisma.attribute.upsert({
      where: { name: 'Color' },
      update: {},
      create: {
        name: 'Color',
      },
    });

    const sizeAttribute = await prisma.attribute.upsert({
      where: { name: 'Size' },
      update: {},
      create: {
        name: 'Size',
      },
    });

    const materialAttribute = await prisma.attribute.upsert({
      where: { name: 'Material' },
      update: {},
      create: {
        name: 'Material',
      },
    });

    const colorValues = [
      'Red',
      'Blue',
      'Green',
      'Black',
      'White',
      'Yellow',
      'Pink',
      'Gray',
      'Navy',
      'Orange',
      'Purple',
      'Brown',
    ];
    for (const value of colorValues) {
      await prisma.attributeValue.upsert({
        where: {
          attributeId_value: {
            attributeId: colorAttribute.id,
            value: value,
          },
        },
        update: {},
        create: {
          attributeId: colorAttribute.id,
          value: value,
        },
      });
    }

    const sizeValues = [
      'XS',
      'S',
      'M',
      'L',
      'XL',
      'XXL',
      'XXXL',
      '28',
      '30',
      '32',
      '34',
      '36',
      '38',
      '40',
      '42',
    ];
    for (const value of sizeValues) {
      await prisma.attributeValue.upsert({
        where: {
          attributeId_value: {
            attributeId: sizeAttribute.id,
            value: value,
          },
        },
        update: {},
        create: {
          attributeId: sizeAttribute.id,
          value: value,
        },
      });
    }

    const materialValues = [
      'Cotton',
      'Polyester',
      'Wool',
      'Silk',
      'Linen',
      'Leather',
      'Denim',
      'Spandex',
      'Nylon',
      'Cashmere',
      'Bamboo',
      'Modal',
    ];
    for (const value of materialValues) {
      await prisma.attributeValue.upsert({
        where: {
          attributeId_value: {
            attributeId: materialAttribute.id,
            value: value,
          },
        },
        update: {},
        create: {
          attributeId: materialAttribute.id,
          value: value,
        },
      });
    }

    console.log('Seed data inserted');
  } catch (error) {
    console.error('Seed failed', error);
    throw error;
  }
}
async function seedCategories() {
  try {
    const categories = [
      {
        name: 'Basic T-Shirts',
        slug: 'basic-t-shirts',
        description: 'Essential everyday t-shirts in classic styles and colors',
      },
      {
        name: 'Graphic Tees',
        slug: 'graphic-tees',
        description:
          'T-shirts with creative designs, logos, and artistic prints',
      },
      {
        name: 'Polo Shirts',
        slug: 'polo-shirts',
        description:
          'Collared t-shirts perfect for casual and semi-formal occasions',
      },
      {
        name: 'V-Neck T-Shirts',
        slug: 'v-neck-t-shirts',
        description: 'Stylish v-neck cut t-shirts for a modern look',
      },
      {
        name: 'Long Sleeve Tees',
        slug: 'long-sleeve-tees',
        description: 'Long-sleeved t-shirts for cooler weather and layering',
      },
      {
        name: 'Tank Tops',
        slug: 'tank-tops',
        description: 'Sleeveless shirts perfect for summer and workouts',
      },
      {
        name: 'Vintage Tees',
        slug: 'vintage-tees',
        description:
          'Retro-style t-shirts with vintage designs and washed looks',
      },
      {
        name: 'Sports T-Shirts',
        slug: 'sports-t-shirts',
        description: 'Athletic and performance t-shirts for active lifestyles',
      },
      {
        name: 'Premium Collection',
        slug: 'premium-collection',
        description: 'High-quality t-shirts made from premium materials',
      },
      {
        name: 'Oversized Tees',
        slug: 'oversized-tees',
        description: 'Relaxed fit and oversized t-shirts for comfortable style',
      },
      {
        name: 'Band Tees',
        slug: 'band-tees',
        description: 'Music-inspired t-shirts featuring bands and artists',
      },
      {
        name: 'Organic Cotton',
        slug: 'organic-cotton',
        description:
          'Eco-friendly t-shirts made from organic and sustainable materials',
      },
      {
        name: 'PRUEBA',
        slug: 'PRUEBA',
        description:
          'Eco-fnpm install @prisma/client prismariendly t-shirts made from organic and sustainable materials',
      },
    ];

    for (const category of categories) {
      await prisma.productCategory.upsert({
        where: { slug: category.slug },
        update: {},
        create: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          is_active: true,
          created_at: new Date(),
        },
      });
    }

    console.log('✅ Categories seeded successfully');
  } catch (error) {
    console.error('❌ Categories seed failed', error);
    throw error;
  }
}
async function seedProducts() {
  try {
    console.log('🌱 Starting products seed...');

    // Get attribute values for easier reference
    const colorValues = await prisma.attributeValue.findMany({
      where: { attribute: { name: 'Color' } },
      include: { attribute: true },
    });

    const sizeValues = await prisma.attributeValue.findMany({
      where: { attribute: { name: 'Size' } },
      include: { attribute: true },
    });

    const materialValues = await prisma.attributeValue.findMany({
      where: { attribute: { name: 'Material' } },
      include: { attribute: true },
    });

    // Get categories
    const basicCategory = await prisma.productCategory.findFirst({
      where: { slug: 'basic-t-shirts' },
    });
    const graphicCategory = await prisma.productCategory.findFirst({
      where: { slug: 'graphic-tees' },
    });
    const premiumCategory = await prisma.productCategory.findFirst({
      where: { slug: 'premium-collection' },
    });
    const vintageCategory = await prisma.productCategory.findFirst({
      where: { slug: 'vintage-tees' },
    });
    const sportsCategory = await prisma.productCategory.findFirst({
      where: { slug: 'sports-t-shirts' },
    });

    const getColorValue = (color: string) =>
      colorValues.find((v) => v.value === color)?.id;
    const getSizeValue = (size: string) =>
      sizeValues.find((v) => v.value === size)?.id;
    const getMaterialValue = (material: string) =>
      materialValues.find((v) => v.value === material)?.id;
    const product1 = await prisma.product.create({
      data: {
        name: 'Classic Cotton Essential Tee',
        description:
          'A timeless essential made from 100% premium cotton. Perfect for everyday wear with a comfortable fit.',
        is_active: true,
        categories: {
          connect: [{ id: basicCategory?.id }, { id: premiumCategory?.id }],
        },
        variations: {
          create: [
            {
              is_active: true,
              items: {
                create: [
                  {
                    sku: 'CCE-WHT-S-001',
                    price: 24.99,
                    stock: 50,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('White')! },
                        { attributeValueId: getSizeValue('S')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                  {
                    sku: 'CCE-WHT-M-001',
                    price: 24.99,
                    stock: 75,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('White')! },
                        { attributeValueId: getSizeValue('M')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                  {
                    sku: 'CCE-WHT-L-001',
                    price: 24.99,
                    stock: 60,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('White')! },
                        { attributeValueId: getSizeValue('L')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                ],
              },
            },
            {
              is_active: true,
              items: {
                create: [
                  {
                    sku: 'CCE-BLK-S-001',
                    price: 24.99,
                    stock: 45,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Black')! },
                        { attributeValueId: getSizeValue('S')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                  {
                    sku: 'CCE-BLK-M-001',
                    price: 24.99,
                    stock: 80,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Black')! },
                        { attributeValueId: getSizeValue('M')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                  {
                    sku: 'CCE-BLK-L-001',
                    price: 24.99,
                    stock: 55,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Black')! },
                        { attributeValueId: getSizeValue('L')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
    const product2 = await prisma.product.create({
      data: {
        name: 'Mountain Adventure Graphic Tee',
        description:
          'Express your love for adventure with this eye-catching mountain design. Made from soft cotton blend.',
        is_active: true,
        categories: {
          connect: [{ id: graphicCategory?.id }],
        },
        variations: {
          create: [
            {
              is_active: true,
              items: {
                create: [
                  {
                    sku: 'MAG-NAV-S-001',
                    price: 29.99,
                    stock: 30,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Navy')! },
                        { attributeValueId: getSizeValue('S')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                  {
                    sku: 'MAG-NAV-M-001',
                    price: 29.99,
                    stock: 40,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Navy')! },
                        { attributeValueId: getSizeValue('M')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                  {
                    sku: 'MAG-NAV-L-001',
                    price: 29.99,
                    stock: 35,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Navy')! },
                        { attributeValueId: getSizeValue('L')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                  {
                    sku: 'MAG-NAV-XL-001',
                    price: 29.99,
                    stock: 25,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Navy')! },
                        { attributeValueId: getSizeValue('XL')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                ],
              },
            },
            {
              is_active: true,
              items: {
                create: [
                  {
                    sku: 'MAG-GRN-M-001',
                    price: 29.99,
                    stock: 20,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Green')! },
                        { attributeValueId: getSizeValue('M')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                  {
                    sku: 'MAG-GRN-L-001',
                    price: 29.99,
                    stock: 25,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Green')! },
                        { attributeValueId: getSizeValue('L')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
    const product3 = await prisma.product.create({
      data: {
        name: 'Performance Athletic Tee',
        description:
          'High-performance athletic wear designed for intense workouts. Moisture-wicking polyester blend.',
        is_active: true,
        categories: {
          connect: [{ id: sportsCategory?.id }, { id: premiumCategory?.id }],
        },
        variations: {
          create: [
            {
              is_active: true,
              items: {
                create: [
                  {
                    sku: 'PAT-BLK-S-001',
                    price: 39.99,
                    stock: 25,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Black')! },
                        { attributeValueId: getSizeValue('S')! },
                        { attributeValueId: getMaterialValue('Polyester')! },
                      ],
                    },
                  },
                  {
                    sku: 'PAT-BLK-M-001',
                    price: 39.99,
                    stock: 30,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Black')! },
                        { attributeValueId: getSizeValue('M')! },
                        { attributeValueId: getMaterialValue('Polyester')! },
                      ],
                    },
                  },
                  {
                    sku: 'PAT-BLK-L-001',
                    price: 39.99,
                    stock: 35,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Black')! },
                        { attributeValueId: getSizeValue('L')! },
                        { attributeValueId: getMaterialValue('Polyester')! },
                      ],
                    },
                  },
                ],
              },
            },
            {
              is_active: true,
              items: {
                create: [
                  {
                    sku: 'PAT-BLU-M-001',
                    price: 39.99,
                    stock: 20,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Blue')! },
                        { attributeValueId: getSizeValue('M')! },
                        { attributeValueId: getMaterialValue('Polyester')! },
                      ],
                    },
                  },
                  {
                    sku: 'PAT-BLU-L-001',
                    price: 39.99,
                    stock: 25,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Blue')! },
                        { attributeValueId: getSizeValue('L')! },
                        { attributeValueId: getMaterialValue('Polyester')! },
                      ],
                    },
                  },
                  {
                    sku: 'PAT-BLU-XL-001',
                    price: 39.99,
                    stock: 15,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Blue')! },
                        { attributeValueId: getSizeValue('XL')! },
                        { attributeValueId: getMaterialValue('Polyester')! },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Product 4: Vintage Rock Band Tee
    const product4 = await prisma.product.create({
      data: {
        name: 'Vintage Rock Legends Tee',
        description:
          'Celebrate music history with this vintage-inspired rock band tee. Soft, worn-in feel.',
        is_active: true,
        categories: {
          connect: [{ id: vintageCategory?.id }, { id: graphicCategory?.id }],
        },
        variations: {
          create: [
            {
              is_active: true,
              items: {
                create: [
                  {
                    sku: 'VRL-GRY-S-001',
                    price: 34.99,
                    stock: 15,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Gray')! },
                        { attributeValueId: getSizeValue('S')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                  {
                    sku: 'VRL-GRY-M-001',
                    price: 34.99,
                    stock: 20,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Gray')! },
                        { attributeValueId: getSizeValue('M')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                  {
                    sku: 'VRL-GRY-L-001',
                    price: 34.99,
                    stock: 25,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Gray')! },
                        { attributeValueId: getSizeValue('L')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                ],
              },
            },
            {
              is_active: true,
              items: {
                create: [
                  {
                    sku: 'VRL-BLK-M-001',
                    price: 34.99,
                    stock: 18,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Black')! },
                        { attributeValueId: getSizeValue('M')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                  {
                    sku: 'VRL-BLK-L-001',
                    price: 34.99,
                    stock: 22,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Black')! },
                        { attributeValueId: getSizeValue('L')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                  {
                    sku: 'VRL-BLK-XL-001',
                    price: 34.99,
                    stock: 12,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Black')! },
                        { attributeValueId: getSizeValue('XL')! },
                        { attributeValueId: getMaterialValue('Cotton')! },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Product 5: Premium Organic Tee
    const product5 = await prisma.product.create({
      data: {
        name: 'Organic Bamboo Comfort Tee',
        description:
          'Sustainable luxury meets comfort. Made from organic bamboo fiber for ultimate softness.',
        is_active: true,
        categories: {
          connect: [{ id: premiumCategory?.id }, { id: basicCategory?.id }],
        },
        variations: {
          create: [
            {
              is_active: true,
              items: {
                create: [
                  {
                    sku: 'OBC-WHT-XS-001',
                    price: 49.99,
                    stock: 10,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('White')! },
                        { attributeValueId: getSizeValue('XS')! },
                        { attributeValueId: getMaterialValue('Bamboo')! },
                      ],
                    },
                  },
                  {
                    sku: 'OBC-WHT-S-001',
                    price: 49.99,
                    stock: 15,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('White')! },
                        { attributeValueId: getSizeValue('S')! },
                        { attributeValueId: getMaterialValue('Bamboo')! },
                      ],
                    },
                  },
                  {
                    sku: 'OBC-WHT-M-001',
                    price: 49.99,
                    stock: 20,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('White')! },
                        { attributeValueId: getSizeValue('M')! },
                        { attributeValueId: getMaterialValue('Bamboo')! },
                      ],
                    },
                  },
                ],
              },
            },
            {
              is_active: true,
              items: {
                create: [
                  {
                    sku: 'OBC-PNK-S-001',
                    price: 49.99,
                    stock: 12,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Pink')! },
                        { attributeValueId: getSizeValue('S')! },
                        { attributeValueId: getMaterialValue('Bamboo')! },
                      ],
                    },
                  },
                  {
                    sku: 'OBC-PNK-M-001',
                    price: 49.99,
                    stock: 18,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Pink')! },
                        { attributeValueId: getSizeValue('M')! },
                        { attributeValueId: getMaterialValue('Bamboo')! },
                      ],
                    },
                  },
                  {
                    sku: 'OBC-PNK-L-001',
                    price: 49.99,
                    stock: 14,
                    attributes: {
                      create: [
                        { attributeValueId: getColorValue('Pink')! },
                        { attributeValueId: getSizeValue('L')! },
                        { attributeValueId: getMaterialValue('Bamboo')! },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    console.log('✅ Products seeded successfully');
    console.log(
      `📦 Created products: ${[product1.name, product2.name, product3.name, product4.name, product5.name].join(', ')}`,
    );
  } catch (error) {
    console.error('❌ Products seed failed', error);
    throw error;
  }
}
async function main() {
  try {
    console.log('🌱 Starting database seed...');
    await seedCategories();
    await seedAttributes();
    await seedProducts(); // Add this line
    console.log('✅ Seed completed successfully');
  } finally {
    await prisma.$disconnect();
    console.log('📡 Disconnected from database');
  }
}

main().catch((e) => {
  console.error('🔥 Fatal error during seeding:', e);
  process.exit(1);
});
export { seedAttributes };
