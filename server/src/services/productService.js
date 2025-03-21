import stripeClient from '../config/stripeConfig.js';

// Initialize products from Stripe
export const initializeProducts = async () => {
  try {
    const { products } = global.stores;

    // Fetch products from Stripe API
    const stripeProducts = await stripeClient.products.list({
      active: true,
      limit: 100,
    });

    console.log(`Fetched ${stripeProducts.data.length} products from Stripe`);

    // Process each product
    for (const product of stripeProducts.data) {
      try {
        // Get prices for this product
        const prices = await stripeClient.prices.list({
          product: product.id,
          active: true,
          limit: 1,
        });

        if (prices.data.length > 0) {
          const price = prices.data[0];

          // Create a product record with the price
          const productRecord = {
            id: product.id,
            name: product.name,
            description: product.description || '',
            images: product.images || [],
            active: product.active,
            price: {
              id: price.id,
              currency: price.currency,
              unit_amount: price.unit_amount,
              formatted: `${(price.unit_amount / 100).toFixed(0)} zł`,
            },
          };

          // Store the product in our database
          await products.set(product.id, productRecord);
          console.log(`Product ${product.id} initialized in the store`);
        } else {
          console.log(`No active prices found for product ${product.id}`);
        }
      } catch (priceError) {
        console.error(`Error fetching prices for product ${product.id}:`, priceError);
      }
    }

    // If no products were found, log a message
    if (stripeProducts.data.length === 0) {
      console.log('No active products found in Stripe');
    }

    return { success: true, message: 'Product initialization completed' };
  } catch (error) {
    console.error('Error initializing products:', error);
    return { success: false, error: error.message };
  }
};
