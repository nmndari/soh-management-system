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
});