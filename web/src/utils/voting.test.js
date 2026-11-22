import { countVotes } from "./voting";

describe("countVotes", () => {
  test("өгөгдсөн саналын тоонуудыг зөв нийлбэрлэнэ", () => {
    // Arrange: жишиг өгөгдөл бэлдэх
    const votes = [4, 7, 9];

    // Act: тестлэх функцийг дуудах
    const result = countVotes(votes);

    // Assert: үр дүнг шалгах
    expect(result).toBe(20);
  });

  test("хоосон жагсаалтанд 0 буцаана", () => {
    // Arrange
    const votes = [];

    // Act
    const result = countVotes(votes);

    // Assert
    expect(result).toBe(0);
  });

  test("сөрөг утгатай үед зөв нийлбэр гаргана", () => {
    // Arrange
    const votes = [10, -3, 5];

    // Act
    const result = countVotes(votes);

    // Assert
    expect(result).toBe(12);
  });

  test("маш том саналын тоог зөв нийлбэрлэнэ", () => {
    // Arrange
    const votes = [1_000_000_000, 2_000_000_000, 500_000_000];

    // Act
    const result = countVotes(votes);

    // Assert
    expect(result).toBe(3_500_000_000);
  });
});
