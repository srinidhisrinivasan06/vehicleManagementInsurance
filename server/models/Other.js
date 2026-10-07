const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  date:      { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  capacity:  { type: Number, default: 1 },
  booked:    { type: Number, default: 0 }
});

const invoiceSchema = new mongoose.Schema({
  bookingId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  customerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName:  { type: String },
  customerEmail: { type: String },
  customerPhone: { type: String },
  vehicleMake:   { type: String },
  vehicleModel:  { type: String },
  vehicleNumber: { type: String },
  serviceType:   { type: String },
  providerName:  { type: String },
  totalAmount:   { type: Number, required: true },
  paymentStatus: { type: String, enum: ['PENDING','PAID','CANCELLED'], default: 'PENDING' }
}, { timestamps: true });

module.exports.TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);
module.exports.Invoice  = mongoose.model('Invoice',  invoiceSchema);
