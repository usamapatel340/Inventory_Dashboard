const {
  SNSClient,
  ListSubscriptionsByTopicCommand,
  GetSubscriptionAttributesCommand,
} = require("@aws-sdk/client-sns");

const sns = new SNSClient({ region: "ap-south-1" });

async function checkSubscriptions() {
  try {
    const topicArn = "arn:aws:sns:ap-south-1:873828695513:ExpenseSNS";

    console.log("📋 Checking SNS subscriptions...\n");

    const result = await sns.send(
      new ListSubscriptionsByTopicCommand({ TopicArn: topicArn })
    );

    if (result.Subscriptions.length === 0) {
      console.log("❌ NO SUBSCRIPTIONS FOUND!");
      console.log(
        "You need to create an email subscription to receive alerts."
      );
      return;
    }

    for (const sub of result.Subscriptions) {
      console.log("Subscription Details:");
      console.log("  ARN:", sub.SubscriptionArn);
      console.log("  Protocol:", sub.Protocol);
      console.log("  Endpoint:", sub.Endpoint);
      console.log("  Owner:", sub.Owner);

      // Check subscription status
      if (sub.SubscriptionArn !== "PendingConfirmation") {
        const attrs = await sns.send(
          new GetSubscriptionAttributesCommand({
            SubscriptionArn: sub.SubscriptionArn,
          })
        );

        const status = attrs.Attributes?.PendingConfirmation;
        console.log(
          "  Status:",
          status === "true" ? "⏳ PENDING (check email)" : "✅ CONFIRMED"
        );
      }
      console.log("");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

checkSubscriptions();
