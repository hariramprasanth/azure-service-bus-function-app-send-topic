const { app } = require("@azure/functions");
const { ServiceBusClient } = require("@azure/service-bus");

const connectionString =
	"Endpoint=sb://servicebus435.servicebus.windows.net/;SharedAccessKeyName=sendtopic1;SharedAccessKey=R257kOQ70HWPt79t9wKROj2Z2Kambd70C+ASbDl+QtQ=;EntityPath=topic1";
const topicName = "topic1";

const messages = [{ body: "India" }, { body: "Japan" }];

app.http("sendtopic", {
	methods: ["GET", "POST"],
	authLevel: "anonymous",
	handler: async (request, context) => {
		context.log("-------Send Topic function triggered-----");
		const sbClient = new ServiceBusClient(connectionString);
		const sender = sbClient.createSender(topicName);

		try {
			// create a batch object
			let batch = await sender.createMessageBatch();
			for (let i = 0; i < messages.length; i++) {
				// try to add the message to the batch
				if (!batch.tryAddMessage(messages[i])) {
					// if it fails to add the message to the current batch
					// send the current batch as it is full
					await sender.sendMessages(batch);

					// then, create a new batch
					batch = await sender.createMessageBatch();

					// now, add the message failed to be added to the previous batch to this batch
					if (!batch.tryAddMessage(messages[i])) {
						// if it still can't be added to the batch, the message is probably too big to fit in a batch
						throw new Error("Message too big to fit in a batch");
					}
				}
			}

			// Send the last created batch of messages to the topic
			await sender.sendMessages(batch);

			context.log(`Sent a batch of messages to the topic: ${topicName}`);
		} catch (err) {
			context.log(`Error sending messages: ${err}`);
			return { status: 500, body: `Error sending messages: ${err.message}` };
		} finally {
			await sender.close();
			await sbClient.close();
		}

		return { status: 200, body: `Messages have been sent successfully to the topic: ${topicName}` };
	},
});
