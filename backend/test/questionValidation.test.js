
const test = require("node:test");
const assert = require("node:assert/strict");

const {
    validateQuestion,
} = require("../utils/questionValidation.utils");

const validQuestion = {
    questionText: "What is 2 + 2?",
    questionType: "SINGLE_CORRECT",
    options: [
        { key: "A", text: "3" },
        { key: "B", text: "4" },
        { key: "C", text: "5" },
        { key: "D", text: "6" },
    ],
    correctOptions: ["B"],
    difficulty: "EASY",
    subject: "MATHEMATICS",
    // Replace with a real Chapter ObjectId
    chapterId: "507f1f77bcf86cd799439011",
};

test("valid question should pass validation", () => {
    const result = validateQuestion(validQuestion);

    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, []);
});

test("single-correct question without an answer should fail", () => {
    const question = {
        ...validQuestion,
        correctOptions: [],
    };

    const result = validateQuestion(question);

    assert.equal(result.isValid, false);
    assert.ok(
        result.errors.some((error) =>
            error.includes("exactly one correct option")
        )
    );
});

test("MCQ with duplicate option keys should fail", () => {
    const question = {
        ...validQuestion,
        options: [
            { key: "A", text: "3" },
            { key: "A", text: "4" },
        ],
    };

    const result = validateQuestion(question);

    assert.equal(result.isValid, false);
    assert.ok(
        result.errors.some((error) =>
            error.includes("unique")
        )
    );
});

test("question image is optional", () => {
    const result = validateQuestion(validQuestion);

    assert.equal(result.isValid, true);
});

test("valid HTTPS question image should pass validation", () => {
    const question = {
        ...validQuestion,
        image: {
            url: "https://ik.imagekit.io/edupilot/question-images/example.png",
            fileId: "image-file-id",
            filePath: "/edupilot/question-images/example.png",
            altText: "Physics circuit diagram",
        },
    };

    const result = validateQuestion(question);

    assert.equal(result.isValid, true);
});

test("question image must use HTTPS", () => {
    const question = {
        ...validQuestion,
        image: {
            url: "http://example.com/image.png",
        },
    };

    const result = validateQuestion(question);

    assert.equal(result.isValid, false);

    assert.ok(
        result.errors.some((error) =>
            error.includes("HTTPS URL")
        )
    );
});
