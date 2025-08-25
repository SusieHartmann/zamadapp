const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const PrivacyFundraisingModule = buildModule("PrivacyFundraisingModule", (m) => {
  const privacyFundraising = m.contract("PrivacyFundraising");

  return { privacyFundraising };
});

module.exports = PrivacyFundraisingModule;