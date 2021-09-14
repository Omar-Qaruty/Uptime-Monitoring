// Create and export cinfiguration variables

// container for all the environmets

const envirnments = {};

//  Staging (default) environment
envirnments.staging = {
  httpPort: 3001,
  httpsPort: 3002,
  envName: "staging",
  hashingSecret: "thisIsASecret",
};

// production env
envirnments.production = {
  httpPort: 5001,
  httpsPort: 5002,
  envName: "production",
  hashingSecret: "thisIsASecret",
};

//Determine which environment was passed as a command-line argument.
const currentEnvironment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

// Check that the current environment is one of the envs. above , if not , default to staging
const environmentToExport =
  typeof envirnments[currentEnvironment] == "object"
    ? envirnments[currentEnvironment]
    : envirnments.staging;

module.exports = environmentToExport;
