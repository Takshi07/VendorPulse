import mongoose from "mongoose";

const evaluationScoreSchema = new mongoose.Schema(
  {
    kpiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KPI",
      required: true,
    },

    kpiNameSnapshot: {
      type: String,
      required: true,
      trim: true,
    },

    weightSnapshot: {
      type: Number,
      required: true,
      min: 0.01,
      max: 100,
    },

    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Score must be a whole number",
      },
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    _id: false,
  }
);

const evaluationSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    year: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "Year must be an integer",
      },
    },

    quarter: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4],
    },

    criteriaSignature: {
      type: String,
      required: true,
      trim: true,
    },

    scores: {
      type: [evaluationScoreSchema],
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one KPI score is required",
      },
    },

    overallScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    performanceRating: {
      type: String,
      required: true,
      enum: [
        "EXCELLENT",
        "GOOD",
        "NEEDS_IMPROVEMENT",
        "POOR",
      ],
    },

    riskLevel: {
      type: String,
      required: true,
      enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
    },

    comments: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

evaluationSchema.index(
  {
    supplierId: 1,
    year: 1,
    quarter: 1,
  },
  {
    unique: true,
  }
);

evaluationSchema.index({
  year: 1,
  quarter: 1,
  createdAt: -1,
});

const Evaluation = mongoose.model("Evaluation", evaluationSchema);

export default Evaluation;