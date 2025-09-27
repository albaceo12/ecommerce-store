import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  total_products: {
    type: Number,
    required: true,
    default: 0,
  },
});

const Counter = mongoose.model("Counter", CounterSchema);
export default Counter;
