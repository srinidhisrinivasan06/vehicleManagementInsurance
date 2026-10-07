const router = require('express').Router();
const auth   = require('../middleware/auth');
const { TimeSlot } = require('../models/Other');

router.get('/available', auth(), async (req, res) => {
  try {
    const date = new Date(req.query.date);
    const next = new Date(date); next.setDate(next.getDate() + 1);
    const slots = await TimeSlot.find({ date: { $gte: date, $lt: next }, $expr: { $lt: ['$booked','$capacity'] } });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
