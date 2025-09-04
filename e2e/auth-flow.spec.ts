import { test } from "./fixtures";
import { openSidePanel } from "./pages/sidepanel";
import { loginWithCredentials, verifyLoginSuccess } from "./authUtils";
import { testUsers } from "./testData";

test.describe("Authentication Flow", () => {
  test("User can complete login flow with test credentials", async ({ page, extensionId }) => {
    await openSidePanel(page, extensionId);
    await loginWithCredentials(page, testUsers.validUser.email, testUsers.validUser.otp);
    await verifyLoginSuccess(page, testUsers.validUser.email);
  });
});

