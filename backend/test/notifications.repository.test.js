jest.mock("../src/core/db/postgres", () => ({
  query: jest.fn(),
}));

const { query } = require("../src/core/db/postgres");
const NotificationsRepository = require("../src/app/notifications/notifications.repository");

describe("NotificationsRepository.markRead", () => {
  beforeEach(() => {
    query.mockReset();
  });

  test("scopes mark-read updates to the authenticated user", async () => {
    query.mockResolvedValue({ rowCount: 2 });

    const result = await NotificationsRepository.markRead(
      ["notification-1", "notification-2"],
      "user-123"
    );

    expect(result).toBe(2);
    expect(query).toHaveBeenCalledWith(
      `UPDATE notifications
     SET read = true
     WHERE id = ANY($1) AND to_uid = $2 AND read = false`,
      [["notification-1", "notification-2"], "user-123"]
    );
  });
});
