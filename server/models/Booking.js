const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName:  { type: String, required: true },
  providerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  providerName:  { type: String },
  slotId:        { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot' },
  slotTime:      { type: String },
  vehicleMake:   { type: String, required: true },
  vehicleModel:  { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  vehicleYear:   { type: Number },
  serviceType:   { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING','CONFIRMED','IN_PROGRESS','QUALITY_CHECK','COMPLETED','CANCELLED'],
    default: 'PENDING'
  },
  scheduledDate: { type: Date, required: true },
  notes:         { type: String },
  amount:        { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
