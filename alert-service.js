const { Kafka } = require("kafkajs");
const redis = require("redis");

// Environment-based Kafka & Redis setup
const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9094";
const redisUrl = process.env.REDIS_URL || "redis://:caremember@localhost:6379";

const kafka = new Kafka({ clientId: "fraud-alert-consumer", brokers: [kafkaBroker] });
const consumer = kafka.consumer({ groupId: "fraud-alert-group" });
const redisClient = redis.createClient({ url: redisUrl });

redisClient.on("error", (err) => console.error("❌ Redis error:", err));

async function consumeFraudAlerts() {
  await redisClient.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: "fraud-alerts", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const alert = JSON.parse(message.value.toString());
      console.log("==============================");
      console.log("⚠️ Fraud Alert Received:", alert);
      console.log("==============================");

      // Optional: store last 10 alerts per user
      const key = `user:${alert.userId}:alerts`;
      await redisClient.lPush(key, JSON.stringify(alert));
      await redisClient.lTrim(key, 0, 9);
    },
  });
}

consumeFraudAlerts().catch(console.error);
