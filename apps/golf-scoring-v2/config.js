// ====================================================================
// APP CONFIGURATION v2 (multiple competitions) - see SETUP.md
// ====================================================================
const APP_CONFIG = {
  // From jsonbin.io: the ID of your REGISTRY bin.
  // Create it once with this exact content: {"competitions":[],"courses":{}}
  REGISTRY_BIN_ID: "6a339aa6f5f4af5e2906e744",

  // From jsonbin.io: an Access Key with Create + Read + Update (+ Delete) rights on Bins.
  // Create rights are needed because every competition gets its own bin.
  JSONBIN_ACCESS_KEY: "$2a$10$ojNdkxgzV.mt8I3QVAXkReISYF3oOForL0yzFT6xqGdwPPfNd6nNK",

  // PIN code to open the admin page. Change this to your own code.
  ADMIN_PIN: "2468",

  // How often phones refresh the scoreboard, in seconds
  REFRESH_SECONDS: 30
};
