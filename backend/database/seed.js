const db = require("./db");
const { User, Poll, Option, Vote } = require("./index");

const seed = async () => {
  try {
    db.logging = false;
    await db.sync(); // Sync tables without dropping

    // Find or create users
    let admin = await User.findOne({ where: { username: "admin" } });
    let user1 = await User.findOne({ where: { username: "user1" } });
    let user2 = await User.findOne({ where: { username: "user2" } });

    if (!admin) {
      admin = await User.create({ username: "admin", passwordHash: User.hashPassword("admin123") });
      console.log("👤 Created admin user");
    }
    if (!user1) {
      user1 = await User.create({ username: "user1", passwordHash: User.hashPassword("user111") });
      console.log("👤 Created user1");
    }
    if (!user2) {
      user2 = await User.create({ username: "user2", passwordHash: User.hashPassword("user222") });
      console.log("👤 Created user2");
    }

    // Create Polls only if they don't already exist
    let poll1 = await Poll.findOne({ where: { title: "Best Programming Language 2024" } });
    if (!poll1) {
      poll1 = await Poll.create({
        title: "Best Programming Language 2024",
        description: "Vote for your favorite programming language!",
        status: "open",
        closeDate: new Date("2024-12-31T23:59:59Z"),
        userId: admin.id,
      });
      await Option.bulkCreate([
        { text: "JavaScript", pollId: poll1.id, order: 0 },
        { text: "Python", pollId: poll1.id, order: 1 },
        { text: "TypeScript", pollId: poll1.id, order: 2 },
        { text: "Rust", pollId: poll1.id, order: 3 },
      ]);
      console.log("✅ Created poll: Best Programming Language 2024");
    }

    let poll2 = await Poll.findOne({ where: { title: "Favorite Pizza Topping" } });
    if (!poll2) {
      poll2 = await Poll.create({
        title: "Favorite Pizza Topping",
        description: "What's your go-to pizza topping?",
        status: "open",
        userId: user1.id,
      });
      await Option.bulkCreate([
        { text: "Pepperoni", pollId: poll2.id, order: 0 },
        { text: "Mushrooms", pollId: poll2.id, order: 1 },
        { text: "Extra Cheese", pollId: poll2.id, order: 2 },
        { text: "Peppers", pollId: poll2.id, order: 3 },
      ]);
      console.log("✅ Created poll: Favorite Pizza Topping");
    }

    let poll3 = await Poll.findOne({ where: { title: "Weekend Activity Preference" } });
    if (!poll3) {
      poll3 = await Poll.create({
        title: "Weekend Activity Preference",
        description: "How do you like to spend your weekends?",
        status: "closed",
        userId: user2.id,
      });
      await Option.bulkCreate([
        { text: "Hiking", pollId: poll3.id, order: 0 },
        { text: "Movies", pollId: poll3.id, order: 1 },
        { text: "Gaming", pollId: poll3.id, order: 2 },
        { text: "Reading", pollId: poll3.id, order: 3 },
      ]);
      console.log("✅ Created poll: Weekend Activity Preference");
    }

    let poll4 = await Poll.findOne({ where: { title: "Preferred Coffee Type" } });
    if (!poll4) {
      poll4 = await Poll.create({
        title: "Preferred Coffee Type",
        description: "How do you take your coffee?",
        status: "open",
        closeDate: new Date("2024-06-30T23:59:59Z"),
        userId: admin.id,
      });
      await Option.bulkCreate([
        { text: "Espresso", pollId: poll4.id, order: 0 },
        { text: "Cappuccino", pollId: poll4.id, order: 1 },
        { text: "Latte", pollId: poll4.id, order: 2 },
        { text: "Americano", pollId: poll4.id, order: 3 },
      ]);
      console.log("✅ Created poll: Preferred Coffee Type");
    }

    // Create a closed poll with votes for IRV demonstration
    let poll5 = await Poll.findOne({ where: { title: "Best Video Game Genre 2024" } });
    if (!poll5) {
      poll5 = await Poll.create({
        title: "Best Video Game Genre 2024",
        description: "What's your favorite video game genre? Rank your preferences!",
        status: "closed",
        userId: admin.id,
      });

      // Create options for the poll
      const gameOptions = await Option.bulkCreate([
        { text: "Action", pollId: poll5.id, order: 0 },
        { text: "RPG", pollId: poll5.id, order: 1 },
        { text: "Strategy", pollId: poll5.id, order: 2 },
        { text: "Puzzle", pollId: poll5.id, order: 3 },
      ]);

      // Get option IDs for voting
      const actionOption = gameOptions.find((opt) => opt.text === "Action");
      const rpgOption = gameOptions.find((opt) => opt.text === "RPG");
      const strategyOption = gameOptions.find((opt) => opt.text === "Strategy");
      const puzzleOption = gameOptions.find((opt) => opt.text === "Puzzle");

      // Create votes from multiple users with ranked preferences
      // This simulates an IRV scenario where:
      // - Most votes for Action (first choice)
      // - RPG has some first-choice votes
      // - Strategy and Puzzle get eliminated first
      // - Action vs RPG final round

      // User 1 (admin): Action > RPG > Strategy > Puzzle
      await Vote.bulkCreate([
        { userId: admin.id, pollId: poll5.id, optionId: actionOption.id, rank: 1 },
        { userId: admin.id, pollId: poll5.id, optionId: rpgOption.id, rank: 2 },
        { userId: admin.id, pollId: poll5.id, optionId: strategyOption.id, rank: 3 },
        { userId: admin.id, pollId: poll5.id, optionId: puzzleOption.id, rank: 4 },
      ]);

      // User 2 (user1): Action > Strategy > RPG > Puzzle
      await Vote.bulkCreate([
        { userId: user1.id, pollId: poll5.id, optionId: actionOption.id, rank: 1 },
        { userId: user1.id, pollId: poll5.id, optionId: strategyOption.id, rank: 2 },
        { userId: user1.id, pollId: poll5.id, optionId: rpgOption.id, rank: 3 },
        { userId: user1.id, pollId: poll5.id, optionId: puzzleOption.id, rank: 4 },
      ]);

      // User 3 (user2): RPG > Action > Puzzle > Strategy
      await Vote.bulkCreate([
        { userId: user2.id, pollId: poll5.id, optionId: rpgOption.id, rank: 1 },
        { userId: user2.id, pollId: poll5.id, optionId: actionOption.id, rank: 2 },
        { userId: user2.id, pollId: poll5.id, optionId: puzzleOption.id, rank: 3 },
        { userId: user2.id, pollId: poll5.id, optionId: strategyOption.id, rank: 4 },
      ]);

      // Create additional test users for more votes
      let testUser1 = await User.findOne({ where: { username: "testUser1" } });
      if (!testUser1) {
        testUser1 = await User.create({
          username: "testUser1",
          passwordHash: User.hashPassword("test123"),
        });
      }

      let testUser2 = await User.findOne({ where: { username: "testUser2" } });
      if (!testUser2) {
        testUser2 = await User.create({
          username: "testUser2",
          passwordHash: User.hashPassword("test123"),
        });
      }

      let testUser3 = await User.findOne({ where: { username: "testUser3" } });
      if (!testUser3) {
        testUser3 = await User.create({
          username: "testUser3",
          passwordHash: User.hashPassword("test123"),
        });
      }

      // Test User 1: Action > RPG > Puzzle > Strategy
      await Vote.bulkCreate([
        { userId: testUser1.id, pollId: poll5.id, optionId: actionOption.id, rank: 1 },
        { userId: testUser1.id, pollId: poll5.id, optionId: rpgOption.id, rank: 2 },
        { userId: testUser1.id, pollId: poll5.id, optionId: puzzleOption.id, rank: 3 },
        { userId: testUser1.id, pollId: poll5.id, optionId: strategyOption.id, rank: 4 },
      ]);

      // Test User 2: Strategy > Action > RPG > Puzzle
      await Vote.bulkCreate([
        { userId: testUser2.id, pollId: poll5.id, optionId: strategyOption.id, rank: 1 },
        { userId: testUser2.id, pollId: poll5.id, optionId: actionOption.id, rank: 2 },
        { userId: testUser2.id, pollId: poll5.id, optionId: rpgOption.id, rank: 3 },
        { userId: testUser2.id, pollId: poll5.id, optionId: puzzleOption.id, rank: 4 },
      ]);

      // Test User 3: RPG > Puzzle > Action > Strategy
      await Vote.bulkCreate([
        { userId: testUser3.id, pollId: poll5.id, optionId: rpgOption.id, rank: 1 },
        { userId: testUser3.id, pollId: poll5.id, optionId: puzzleOption.id, rank: 2 },
        { userId: testUser3.id, pollId: poll5.id, optionId: actionOption.id, rank: 3 },
        { userId: testUser3.id, pollId: poll5.id, optionId: strategyOption.id, rank: 4 },
      ]);

      console.log("✅ Created poll: Best Video Game Genre 2024 (closed with 6 votes)");
    }

    console.log("🌱 Seed data check complete - all seed polls are in the database");
  } catch (error) {
    console.error("Error seeding database:", error);
    if (error.message.includes("does not exist")) {
      console.log("\n🤔🤔🤔 Have you created your database??? 🤔🤔🤔");
    }
  }
  db.close();
};

seed();
