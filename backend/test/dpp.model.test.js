
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const DPP = require("../model/dpp.model");

const makeValidDPP = (overrides = {}) => ({
    title: "Physics DPP 01",
    description: "Mechanics practice",
    chapterId: new mongoose.Types.ObjectId(),
    questions: [
        {
            questionId: new mongoose.Types.ObjectId(),
            order: 1,
        },
        {
            questionId: new mongoose.Types.ObjectId(),
            order: 2,
        },
    ],
    durationMinutes: 60,
    deadline: new Date("2027-01-01T12:00:00.000Z"),
    createdBy: new mongoose.Types.ObjectId(),
    ...overrides,
});

test("valid DPP should pass validation", async () => {
    const dpp = new DPP(makeValidDPP());

    await assert.doesNotReject(() => dpp.validate());
});

test("DPP without a title should fail validation", async () => {
    const data = makeValidDPP();
    delete data.title;

    const dpp = new DPP(data);

    await assert.rejects(() => dpp.validate());
});

test("DPP without a chapter should fail validation", async () => {
    const data = makeValidDPP();
    delete data.chapterId;

    const dpp = new DPP(data);

    await assert.rejects(() => dpp.validate());
});

test("duplicate questions should fail validation", async () => {
    const questionId = new mongoose.Types.ObjectId();

    const dpp = new DPP(
        makeValidDPP({
            questions: [
                { questionId, order: 1 },
                { questionId, order: 2 },
            ],
        })
    );

    await assert.rejects(
        () => dpp.validate(),
        (error) => {
            assert.ok(error.errors.questions);
            return true;
        }
    );
});

test("duplicate question order should fail validation", async () => {
    const dpp = new DPP(
        makeValidDPP({
            questions: [
                {
                    questionId: new mongoose.Types.ObjectId(),
                    order: 1,
                },
                {
                    questionId: new mongoose.Types.ObjectId(),
                    order: 1,
                },
            ],
        })
    );

    await assert.rejects(
        () => dpp.validate(),
        (error) => {
            assert.ok(error.errors.questions);
            return true;
        }
    );
});

test("duration below one minute should fail validation", async () => {
    const dpp = new DPP(
        makeValidDPP({ durationMinutes: 0 })
    );

    await assert.rejects(() => dpp.validate());
});

test("duration above 600 minutes should fail validation", async () => {
    const dpp = new DPP(
        makeValidDPP({ durationMinutes: 601 })
    );

    await assert.rejects(() => dpp.validate());
});

test("new DPP should default to draft status", () => {
    const dpp = new DPP(makeValidDPP());

    assert.equal(dpp.status, "draft");
    assert.equal(dpp.isArchived, false);
    assert.equal(dpp.creationMethod, "MANUAL");
});
