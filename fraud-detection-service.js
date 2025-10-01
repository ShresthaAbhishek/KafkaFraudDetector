const { Kafka, Partitioners } = require("kafkajs");
const redis = require("redis");

// Environment-based Kafka & Redis setup
const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9094";
const redisUrl = process.env.REDIS_URL || "redis://:caremember@localhost:6379";

const kafka = new Kafka({ clientId: "fraud-detection-consumer", brokers: [kafkaBroker] });
const consumer = kafka.consumer({ groupId: "fraud-detector-group" });
const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });

const redisClient = redis.createClient({ url: redisUrl });
redisClient.on("error", (err) => console.error("❌ Redis error:", err));

// Send fraud alert to Kafka
async function sendFraudAlert(userId, reason, transaction) {
  const alert = {
    userId,
    reason,
    transaction,
    timestamp: new Date().toISOString(),
  };

  await producer.send({
    topic: "fraud-alerts",
    messages: [{ value: JSON.stringify(alert) }],
  });

  console.log("⚠️ Fraud Alert Sent:", alert);
}

async function consumerTransactions() {
  await redisClient.connect();
  await consumer.connect();
  await producer.connect();

  await consumer.subscribe({ topic: "transactions", fromBeginning: true });
  console.log("✅ Subscribed to transactions topic");

  await consumer.run({
    eachMessage: async ({ message }) => {
      const transaction = JSON.parse(message.value.toString());
      const { userId, amount, location, timestamp } = transaction;

      console.log("Processing transaction:", transaction);

      // Rule 1: Large transaction
      if (amount > 10000) {
        await sendFraudAlert(userId, "Large Transaction Detected", transaction);
      }

      // Rule 2: High frequency
      const tsKey = `user:${userId}:transactionTimeStamps`;
      await redisClient.lPush(tsKey, timestamp);
      await redisClient.lTrim(tsKey, 0, 4);

      const lastTimestamps = (await redisClient.lRange(tsKey, 0, -1))
        .map(t => new Date(t).getTime());

      if (lastTimestamps.length >= 5) {
        const diff = lastTimestamps[0] - lastTimestamps[lastTimestamps.length - 1];
        if (diff < 60_000) {
          await sendFraudAlert(userId, "High Frequency Transactions Detected", transaction);
        }
      }

      // Rule 3: Location change
      const locKey = `user:${userId}:location`;
      const lastLocation = await redisClient.get(locKey);

      if (lastLocation && lastLocation !== location) {
        await sendFraudAlert(userId, "Unusual Location Change Detected", transaction);
      }

      await redisClient.set(locKey, location);
    },
  });
}

consumerTransactions().catch(console.error);
