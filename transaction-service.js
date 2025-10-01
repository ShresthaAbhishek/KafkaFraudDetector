const crypto = require("crypto");
const express = require("express");
const { Kafka, Partitioners } = require("kafkajs");
const redis = require("redis");

const app = express();
const PORT = 3000;

// Environment-based Kafka & Redis setup
const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9094";
const redisUrl = process.env.REDIS_URL || "redis://:caremember@localhost:6379";

const kafka = new Kafka({
  clientId: "fraud-detection-producer",
  brokers: [kafkaBroker],
});

const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
const redisClient = redis.createClient({ url: redisUrl });

redisClient.on("error", (err) => console.error("❌ Redis error:", err));

app.use(express.json());

// Transaction endpoint
app.post("/api/v1/transactions", async (req, res) => {
  const { userId, amount, currency, location } = req.body;

  if (!userId || !amount || !currency || !location) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const transaction = {
    id: crypto.randomUUID(),
    userId,
    amount,
    currency,
    location,
    timestamp: new Date(),
  };

  // Store transaction in Redis
  const key = `user:${userId}:transactions`;
  await redisClient.lPush(key, JSON.stringify(transaction));
  await redisClient.lTrim(key, 0, 9);

  // Send to Kafka
  await producer.send({
    topic: "transactions",
    messages: [{ key: transaction.userId, value: JSON.stringify(transaction) }],
  });

  console.log("✅ Transaction Sent:", transaction);
  return res.status(200).json({ transactionId: transaction.id });
});

// Initialize connections
async function init() {
  try {
    await producer.connect();
    console.log("✅ Kafka Producer connected");

    await redisClient.connect();
    console.log("✅ Redis connected");

    app.listen(PORT, () => {
      console.log(`🚀 Transaction service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to initialize service:", error);
    process.exit(1);
  }
}

init().catch(console.error);
