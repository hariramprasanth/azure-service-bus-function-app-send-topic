const { app } = require("@azure/functions");
const { ServiceBusClient } = require("@azure/service-bus");

const connectionString =
	"Endpoint=sb://servicebus435.servicebus.windows.net/;SharedAccessKeyName=sendtopic1;SharedAccessKey=R257kOQ70HWPt79t9wKROj2Z2Kambd70C+ASbDl+QtQ=;EntityPath=topic1";
const topicName = "topic1";

app.http("sendtopic", {
	methods: ["POST"],
	authLevel: "anonymous",
	handler: async (request, context) => {
		context.log("-------Send Topic function triggered-----");

		const sbClient = new ServiceBusClient(connectionString);
		const sender = sbClient.createSender(topicName);

		try {
			// Get the body of the POST request
			const messageContent = request.body || request.text();
			context.log("---- POST Body -----");
            context.log(messageContent);
            
			// Create a message object with the body as a JSON string
            const message = { body: JSON.stringify({ name: "hari", city : "cbe"}) }; // Hard coded messgae

			// Send the message directly to the topic
			await sender.sendMessages(message);

			context.log(`Sent a message to the topic: ${topicName}`);
		} catch (err) {
			context.log(`Error sending message: ${err}`);
			return { status: 500, body: `Error sending message: ${err.message}` };
		} finally {
			await sender.close();
			await sbClient.close();
		}

		return { status: 200, body: `Message has been sent successfully to the topic: ${topicName}` };
	},
});
