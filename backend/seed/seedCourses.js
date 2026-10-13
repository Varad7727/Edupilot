
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../db/db.js");

const Course = require("../model/course.model.js");
const Subject = require("../model/subject.model.js");

const courses = [
  {
    name: "JEE Class 11",
    code: "JEE-11",
    classLevel: 11,
    description: "JEE preparation course for Class 11"
  },
  {
    name: "JEE Class 12",
    code: "JEE-12",
    classLevel: 12,
    description: "JEE preparation course for Class 12"
  }
];

const subjects = [
  {
    name: "Physics",
    code: "PHY",
    displayOrder: 1
  },
  {
    name: "Chemistry",
    code: "CHEM",
    displayOrder: 2
  },
  {
    name: "Mathematics",
    code: "MATH",
    displayOrder: 3
  }
];

const seedCourses = async () => {
  try {
    await connectDB();

    for (const courseData of courses) {
      const course = await Course.findOneAndUpdate(
        { classLevel: courseData.classLevel },
        {
          $set: {
            name: courseData.name,
            code: courseData.code,
            description: courseData.description,
            isActive: true
          }
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

      console.log(`Course ready: ${course.name}`);

      for (const subjectData of subjects) {
        await Subject.findOneAndUpdate(
          {
            courseId: course._id,
            code: subjectData.code
          },
          {
            $set: {
              name: subjectData.name,
              displayOrder: subjectData.displayOrder,
              isActive: true
            }
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true
          }
        );

        console.log(
          `  Subject ready: ${subjectData.name}`
        );
      }
    }

    console.log("Course and subject seeding completed.");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedCourses();
