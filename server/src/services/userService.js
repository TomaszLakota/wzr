import bcrypt from 'bcryptjs';

// Initialize test user in development mode
export const initializeTestUser = async () => {
  try {
    const { users } = global.stores;
    const testUserEmail = 'tomasz.lakota1@gmail.com';

    // Check if test user already exists
    const existingUser = await users.get(testUserEmail);
    if (existingUser) {
      console.log(`Test user (${testUserEmail}) already exists`);
      return { success: true, message: 'Test user already exists' };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('qweqweqwe', salt);

    // Create test user object
    const testUser = {
      email: testUserEmail,
      name: 'Tomasz Łakota',
      password: hashedPassword,
      createdAt: Date.now(),
      stripeCustomerId: 'cus_Rz3rLxOUvWhrrF',
      stripeSubscriptionId: 'sub_1R55jf2cdengCFrjOXcPgwz4',
      isSubscribed: true,
      isAdmin: true,
    };

    // Save the test user to the database
    await users.set(testUserEmail, testUser);

    console.log(`Test user (${testUserEmail}) initialized successfully`);
    return { success: true, message: 'Test user initialized successfully' };
  } catch (error) {
    console.error('Error initializing test user:', error);
    return { success: false, error: error.message };
  }
};
