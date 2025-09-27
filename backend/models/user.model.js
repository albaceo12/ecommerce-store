import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
// given to mongoose doc: required,min, max , minlength,maxlength,enum, match are built in validator

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required!"] },
    email: {
      type: String,
      required: [true, "Email is required!"],
      unique: true,
      lowercase: true,
      trim: true,
      //using regex was kinda okay but doesnt cover all kinda email and thats why We’d better use validator
      // ✅ Use validator as custom validator
      validate: {
        validator: function (v) {
          // 'v' is the email value entered
          return validator.isEmail(v);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      // minlength: [6, "Password must be at least 6 characters"],
      //passwrod may be number and minlength doesnt cover that that why we use validator

      // ✅ Custom validation for password length
      validate: {
        validator: function (v) {
          // 'v' is the input value. First we convert it to a string.
          // user may write for the password sth like 123 (number)..so it doesnt meet the requirement of this condition... password.length <6...number.length:undefined...undefined < 6 is always false so thats why we set String(password)
          return String(v).length >= 6;
        },
        message: (props) => "Password must be at least 6 characters.",
      },
    },
    cartItems: [
      {
        quantity: { type: Number, default: 1 },
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        // ✅ NEW: Store the price at the time the item was added
        price: { type: Number, required: true },
      },
    ],
    totalOrders: {
      type: Number,
      default: 0,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(this.password, salt);
    this.password = hashedpassword;
    next();
  } catch (error) {
    next(error);
  }
});
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(String(candidatePassword), this.password);
};
export default mongoose.model("User", userSchema);
