import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    contactPerson: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    taxId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    contractStart: {
      type: Date,
    },

    contractEnd: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!value || !this.contractStart) return true;

          return value >= this.contractStart;
        },
        message: "Contract end date cannot be before contract start date",
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;