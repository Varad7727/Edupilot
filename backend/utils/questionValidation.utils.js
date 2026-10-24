
const mongoose = require("mongoose");

const QUESTION_TYPES = [
    "SINGLE_CORRECT",
    "MULTIPLE_CORRECT",
    "NUMERICAL",
];

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

const SUBJECTS = [
    "PHYSICS",
    "CHEMISTRY",
    "MATHEMATICS",
];

const isNonEmptyString = (value) =>
    typeof value === "string" && value.trim().length > 0;

const isFiniteNumber = (value) =>
    typeof value === "number" && Number.isFinite(value);

const validateQuestion = (data) => {
    const errors = [];

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
            isValid: false,
            errors: ["Question data must be an object."],
        };
    }

    // 1. Question text
    if (!isNonEmptyString(data.questionText)) {
        errors.push("Question text is required.");
    }

    // 2. Question type
    if (!QUESTION_TYPES.includes(data.questionType)) {
        errors.push("Invalid question type.");
    }

    // 3. Difficulty
    if (!DIFFICULTIES.includes(data.difficulty)) {
        errors.push("Invalid difficulty.");
    }

    // 4. Subject
    if (!SUBJECTS.includes(data.subject)) {
        errors.push("Invalid subject.");
    }

    // 5. Chapter ID
    if (
        typeof data.chapterId !== "string" ||
        !mongoose.isValidObjectId(data.chapterId)
    ) {
        errors.push("A valid chapter ID is required.");
    }

    // 6. Topic tags
    if (
        data.topicTags !== undefined &&
        (
            !Array.isArray(data.topicTags) ||
            !data.topicTags.every(isNonEmptyString)
        )
    ) {
        errors.push("Topic tags must be an array of non-empty strings.");
    }

    // 7. Options
    const options = data.options ?? [];

    if (!Array.isArray(options)) {
        errors.push("Options must be an array.");
    } else {
        const optionKeys = options.map((option) => option?.key);

        if (
            options.some(
                (option) =>
                    !option ||
                    typeof option !== "object" ||
                    !isNonEmptyString(option.key) ||
                    !isNonEmptyString(option.text)
            )
        ) {
            errors.push("Every option must have a key and text.");
        }

        if (
            optionKeys.filter((key) => typeof key === "string").length !==
            new Set(
                optionKeys.filter((key) => typeof key === "string")
            ).size
        ) {
            errors.push("Option keys must be unique.");
        }

        if (
            ["SINGLE_CORRECT", "MULTIPLE_CORRECT"].includes(
                data.questionType
            ) &&
            options.length < 2
        ) {
            errors.push("MCQs must contain at least two options.");
        }

        if (
            data.questionType === "NUMERICAL" &&
            options.length > 0
        ) {
            errors.push("Numerical questions must not contain MCQ options.");
        }
    }

    // 8. Correct options
    const correctOptions = data.correctOptions ?? [];

    if (!Array.isArray(correctOptions)) {
        errors.push("Correct options must be an array.");
    } else if (
        correctOptions.some(
            (key) => typeof key !== "string" || !key.trim()
        )
    ) {
        errors.push("Correct option keys must be non-empty strings.");
    } else {
        if (new Set(correctOptions).size !== correctOptions.length) {
            errors.push("Correct option keys must be unique.");
        }

        if (Array.isArray(options)) {
            const optionKeys = options.map((option) => option?.key);

            if (
                correctOptions.some((key) => !optionKeys.includes(key))
            ) {
                errors.push(
                    "Every correct option must exist in the options array."
                );
            }
        }

        if (
            data.questionType === "SINGLE_CORRECT" &&
            correctOptions.length !== 1
        ) {
            errors.push(
                "Single-correct questions must have exactly one correct option."
            );
        }

        if (
            data.questionType === "MULTIPLE_CORRECT" &&
            correctOptions.length < 1
        ) {
            errors.push(
                "Multiple-correct questions must have at least one correct option."
            );
        }

        if (
            data.questionType === "NUMERICAL" &&
            correctOptions.length > 0
        ) {
            errors.push(
                "Numerical questions must not use correct option keys."
            );
        }
    }

    // 9. Numerical answer
    if (
        data.questionType === "NUMERICAL" &&
        !isFiniteNumber(data.numericalAnswer)
    ) {
        errors.push("A valid numerical answer is required.");
    }

    if (
        data.questionType !== "NUMERICAL" &&
        data.numericalAnswer !== undefined
    ) {
        errors.push(
            "Numerical answers are only allowed for numerical questions."
        );
    }

    // 10. Numerical tolerance
    if (
        data.numericalTolerance !== undefined &&
        (
            !isFiniteNumber(data.numericalTolerance) ||
            data.numericalTolerance < 0
        )
    ) {
        errors.push("Numerical tolerance must be a non-negative number.");
    }

    // 11. Marking configuration
   const marking = data.marking ?? {};

    if (!marking || typeof marking !== "object" || Array.isArray(marking)) {
        errors.push("Marking configuration is required.");
    } else {
        for (const field of [
            "correctMarks",
            "incorrectMarks",
            "unattemptedMarks",
        ]) {
            if (
                marking[field] !== undefined &&
                !isFiniteNumber(marking[field])
            ) {
                errors.push(`${field} must be a finite number.`);
            }
        }

        if (
            marking.partialMarkingRules !== undefined &&
            !Array.isArray(marking.partialMarkingRules)
        ) {
            errors.push("Partial marking rules must be an array.");
        } else if (Array.isArray(marking.partialMarkingRules)) {
            const optionKeys = Array.isArray(options)
                ? options.map((option) => option?.key)
                : [];

            for (const rule of marking.partialMarkingRules) {
                if (
                    !rule ||
                    !Array.isArray(rule.selectedOptions) ||
                    !isFiniteNumber(rule.marks)
                ) {
                    errors.push("Invalid partial marking rule.");
                    continue;
                }

                if (
                    rule.selectedOptions.some(
                        (key) => !optionKeys.includes(key)
                    )
                ) {
                    errors.push(
                        "Partial marking rules contain an unknown option key."
                    );
                }

                if (
                    new Set(rule.selectedOptions).size !==
                    rule.selectedOptions.length
                ) {
                    errors.push(
                        "Partial marking rules cannot repeat option keys."
                    );
                }

                if (
                    data.questionType !== "MULTIPLE_CORRECT"
                ) {
                    errors.push(
                        "Partial marking rules are only allowed for multiple-correct questions."
                    );
                }
            }
        }
    }

    // 12. Optional question image
    if (data.image !== undefined && data.image !== null) {
        if (
            typeof data.image !== "object" ||
            Array.isArray(data.image) ||
            typeof data.image.url !== "string" ||
            !/^https:\/\//i.test(data.image.url.trim())
        ) {
            errors.push("Question image must contain a valid HTTPS URL.");
        }
        if (
            data.image.altText !== undefined &&
            (typeof data.image.altText !== "string" || data.image.altText.length > 250)
        ) {
            errors.push("Image alt text must be a string of at most 250 characters.");
        }
    }

    // 13. Explanation
    if (
        data.explanation !== undefined &&
        typeof data.explanation !== "string"
    ) {
        errors.push("Explanation must be a string.");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

module.exports = {
    validateQuestion,
};
