const router   = require('express').Router();
const auth     = require('../middleware/auth');
const Booking  = require('../models/Booking');
const User     = require('../models/User');
const { Invoice } = require('../models/Other');

// Stats
router.get('/stats', auth(['PROVIDER']), async (req, res) => {
  try {
    const id    = req.user.id;
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    res.json({
      total:     await Booking.countDocuments({ providerId: id }),
      active:    await Booking.countDocuments({ providerId: id, status: 'IN_PROGRESS' }),
      completed: await Booking.countDocuments({ providerId: id, status: 'COMPLETED' }),
      today:     await Booking.countDocuments({ providerId: id, scheduledDate: { $gte: today, $lt: tomorrow } })
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Today's jobs
router.get('/jobs/today', auth(['PROVIDER']), async (req, res) => {
  try {
    const today    = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const jobs = await Booking.find({ providerId: req.user.id, scheduledDate: { $gte: today, $lt: tomorrow } });
    res.json(jobs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// All jobs
router.get('/jobs', auth(['PROVIDER']), async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = { providerId: req.user.id };
    if (status) query.status = status;
    if (date) {
      const d = new Date(date); d.setHours(0,0,0,0);
      const n = new Date(d); n.setDate(n.getDate() + 1);
      query.scheduledDate = { $gte: d, $lt: n };
    }
    const jobs = await Booking.find(query).sort({ scheduledDate: 1 });
    res.json(jobs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update job
router.put('/jobs/:id', auth(['PROVIDER']), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.providerId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    const { status, notes, finalAmount } = req.body;
    if (status) booking.status = status;
    if (notes)  booking.notes  = notes;
    if (finalAmount) booking.amount = finalAmount;
    await booking.save();

    // Auto-create invoice on completion
    if (booking.status === 'COMPLETED' && booking.amount) {
      const exists = await Invoice.findOne({ bookingId: booking._id });
      if (!exists) {
        const customer = await User.findById(booking.customerId);
        await Invoice.create({
          bookingId:     booking._id,
          customerId:    booking.customerId,
          customerName:  booking.customerName,
          customerEmail: customer?.email || '',
          customerPhone: customer?.phone || '',
          vehicleMake:   booking.vehicleMake,
          vehicleModel:  booking.vehicleModel,
          vehicleNumber: booking.vehicleNumber,
          serviceType:   booking.serviceType,
          providerName:  booking.providerName,
          totalAmount:   booking.amount
        });
      }
    }
    res.json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
