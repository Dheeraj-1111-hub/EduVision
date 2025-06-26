const { getHash } = require("react-native-sms-retriever");

getHash()
  .then((hashes) => {
    console.log("App Hashes:", hashes);
  })
  .catch(console.error);
