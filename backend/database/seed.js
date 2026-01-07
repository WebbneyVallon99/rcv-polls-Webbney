const db = require("./db");
const { User, Poll, Option } = require("./index");

const seed = async () => {
  try {
    db.logging = false;
    await db.sync({ force: true }); // Drop and recreate tables

    const users = await User.bulkCreate([
      { username: "admin", passwordHash: User.hashPassword("admin123") },
      { username: "user1", passwordHash: User.hashPassword("user111") },
      { username: "user2", passwordHash: User.hashPassword("user222") },
    ]);

    console.log(`👤 Created ${users.length} users`);

    // Create mock polls with options
    const polls = await Poll.bulkCreate([
      {
        title: "Best Programming Language 2024",
        description: "Which programming language do you think is the best for web development this year?",
        status: "open",
        closeDate: new Date("2024-12-31T23:59:59"),
        userId: users[0].id, // admin
      },
      {
        title: "Favorite Pizza Topping",
        description: "What's your go-to pizza topping?",
        status: "open",
        userId: users[1].id, // user1
      },
      {
        title: "Weekend Activity Preference",
        description: "How do you like to spend your weekends?",
        status: "closed",
        userId: users[1].id, // user1
      },
      {
        title: "Preferred Coffee Type",
        description: "What's your favorite way to enjoy coffee?",
        status: "open",
        closeDate: new Date("2025-02-28T23:59:59"),
        userId: users[2].id, // user2
      },
      {
        title: "Best Streaming Platform",
        description: "Which streaming service do you use most often?",
        status: "open",
        userId: users[0].id, // admin
      },
      {
        title: "Favorite Season",
        description: "What's your favorite time of year?",
        status: "open",
        userId: users[2].id, // user2
      },
    ]);

    console.log(`📊 Created ${polls.length} polls`);

    // Create options for each poll
    const options = await Option.bulkCreate([
      // Poll 1: Best Programming Language
      { text: "JavaScript", order: 0, pollId: polls[0].id },
      { text: "Python", order: 1, pollId: polls[0].id },
      { text: "TypeScript", order: 2, pollId: polls[0].id },
      { text: "Rust", order: 3, pollId: polls[0].id },
      { text: "Go", order: 4, pollId: polls[0].id },

      // Poll 2: Favorite Pizza Topping
      { text: "Pepperoni", order: 0, pollId: polls[1].id },
      { text: "Mushrooms", order: 1, pollId: polls[1].id },
      { text: "Extra Cheese", order: 2, pollId: polls[1].id },
      { text: "Peppers", order: 3, pollId: polls[1].id },
      { text: "Sausage", order: 4, pollId: polls[1].id },

      // Poll 3: Weekend Activity Preference
      { text: "Hiking", order: 0, pollId: polls[2].id },
      { text: "Movies", order: 1, pollId: polls[2].id },
      { text: "Gaming", order: 2, pollId: polls[2].id },
      { text: "Reading", order: 3, pollId: polls[2].id },

      // Poll 4: Preferred Coffee Type
      { text: "Espresso", order: 0, pollId: polls[3].id },
      { text: "Cappuccino", order: 1, pollId: polls[3].id },
      { text: "Latte", order: 2, pollId: polls[3].id },
      { text: "Americano", order: 3, pollId: polls[3].id },
      { text: "Cold Brew", order: 4, pollId: polls[3].id },

      // Poll 5: Best Streaming Platform
      { text: "Netflix", order: 0, pollId: polls[4].id },
      { text: "Disney+", order: 1, pollId: polls[4].id },
      { text: "Hulu", order: 2, pollId: polls[4].id },
      { text: "Amazon Prime Video", order: 3, pollId: polls[4].id },
      { text: "HBO Max", order: 4, pollId: polls[4].id },

      // Poll 6: Favorite Season
      { text: "Spring", order: 0, pollId: polls[5].id },
      { text: "Summer", order: 1, pollId: polls[5].id },
      { text: "Fall", order: 2, pollId: polls[5].id },
      { text: "Winter", order: 3, pollId: polls[5].id },
    ]);

    console.log(`✅ Created ${options.length} options`);

    console.log("🌱 Seeded the database");
  } catch (error) {
    console.error("Error seeding database:", error);
    if (error.message.includes("does not exist")) {
      console.log("\n🤔🤔🤔 Have you created your database??? 🤔🤔🤔");
    }
  }
  db.close();
};

seed();
