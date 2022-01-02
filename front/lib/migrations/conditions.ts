const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB({ region: "ap-northeast-1" });

const params = {
  TableName: "conditions",
  AttributeDefinitions: [
    { AttributeName: "device_name", AttributeType: "S" }, // number
    { AttributeName: "created_unix", AttributeType: "N" }, // number
  ],
  KeySchema: [
    { AttributeName: "device_name", KeyType: "HASH" }, // Partition key
    { AttributeName: "created_unix", KeyType: "RANGE" }, // Sort key
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10,
  },
};

dynamoDB.createTable(params, (err, data) => {
  if (err) {
    console.error(
      "Unable to create table. Error JSON:",
      JSON.stringify(err, null, 2)
    );
  } else {
    console.log(
      "Created table. Table description JSON:",
      JSON.stringify(data, null, 2)
    );
  }
});
