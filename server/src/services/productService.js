import stripeClient from '../config/stripeConfig.js';

// Initialize products and prices in Supabase from Stripe
export const initializeProducts = async (supabase) => {
  console.log('[INIT_PRODUCTS] Starting product sync from Stripe to Supabase...');
  try {
    // 1. Fetch active products from Stripe
    const stripeProducts = await stripeClient.products.list({
      active: true,
      limit: 100, // Adjust limit as needed
    });
    console.log(
      `[INIT_PRODUCTS] Fetched ${stripeProducts.data.length} active products from Stripe`
    );

    if (stripeProducts.data.length === 0) {
      console.log('[INIT_PRODUCTS] No active products found in Stripe. Exiting sync.');
      return { success: true, message: 'No active products in Stripe.' };
    }

    const productsToUpsert = [];
    const pricesToUpsert = [];

    // 2. Process each product and fetch its active prices
    for (const product of stripeProducts.data) {
      productsToUpsert.push({
        id: product.id,
        active: product.active,
        name: product.name,
        description: product.description,
        // Add other product fields if needed (images, metadata etc.)
        // images: product.images,
        // metadata: product.metadata
      });

      try {
        const prices = await stripeClient.prices.list({
          product: product.id,
          active: true,
          limit: 100, // Fetch all active prices for the product
        });

        if (prices.data.length > 0) {
          console.log(
            `[INIT_PRODUCTS] Found ${prices.data.length} active price(s) for product ${product.id}`
          );
          prices.data.forEach((price) => {
            pricesToUpsert.push({
              id: price.id,
              product_id: price.product,
              active: price.active,
              currency: price.currency,
              unit_amount: price.unit_amount,
              type: price.type,
              // Add other price fields if needed (recurring interval, etc.)
              // recurring_interval: price.recurring?.interval,
              // metadata: price.metadata
            });
          });
        } else {
          console.log(`[INIT_PRODUCTS] No active prices found for product ${product.id}`);
        }
      } catch (priceError) {
        console.error(
          `[INIT_PRODUCTS] Error fetching prices for product ${product.id}:`,
          priceError
        );
        // Continue processing other products even if one fails
      }
    }

    // 3. Upsert products into Supabase
    if (productsToUpsert.length > 0) {
      console.log(`[INIT_PRODUCTS] Upserting ${productsToUpsert.length} products into Supabase...`);
      const { error: productUpsertError } = await supabase
        .from('products')
        .upsert(productsToUpsert, { onConflict: 'id' }); // Assuming 'id' is the primary key

      if (productUpsertError) {
        console.error(
          '[INIT_PRODUCTS] Error upserting products:',
          JSON.stringify(productUpsertError, null, 2)
        );
        console.error(
          `[INIT_PRODUCTS] Supabase error code: ${productUpsertError.code}, message: ${productUpsertError.message}`
        );
        // Decide if this is a fatal error or if price upsert should continue
      } else {
        console.log('[INIT_PRODUCTS] Products upserted successfully.');
      }
    }

    // 4. Upsert prices into Supabase
    if (pricesToUpsert.length > 0) {
      console.log(`[INIT_PRODUCTS] Upserting ${pricesToUpsert.length} prices into Supabase...`);
      const { error: priceUpsertError } = await supabase
        .from('prices')
        .upsert(pricesToUpsert, { onConflict: 'id' }); // Assuming 'id' is the primary key

      if (priceUpsertError) {
        console.error(
          '[INIT_PRODUCTS] Error upserting prices:',
          JSON.stringify(priceUpsertError, null, 2)
        );
        console.error(
          `[INIT_PRODUCTS] Supabase error code: ${priceUpsertError.code}, message: ${priceUpsertError.message}`
        );
      } else {
        console.log('[INIT_PRODUCTS] Prices upserted successfully.');
      }
    }

    console.log('[INIT_PRODUCTS] Product sync completed.');
    return { success: true, message: 'Product initialization completed' };
  } catch (error) {
    console.error('[INIT_PRODUCTS] Fatal error during product initialization:', error);
    return { success: false, error: error.message };
  }
};
