'use strict'
const Venue = use('App/Model/Venue')
const Staff = use('App/Model/Staff')
const Organizer = use('App/Model/Organizer')
const Event = use('App/Model/Event')
const Validator = use('Validator')
const VenueNotification = use('App/Model/VenueNotification')

class EventController {

  * getEvent (req , res) {
    let _event =  yield Event.findOne({ _id: req.param('id') }).populate('venueId')
    if (_event) {
      return _event
    } else {
      return yield res.json({ status: false, messageCode: 'NOT_FOUND' })
    }

  }

  * index (req, res) {
    let events = yield Event.find({}).populate('venueId')
    res.json({ status: true, events: events, messageCode: 'SUCCESS' })
  }

  * create (req, res) {

    if (req.user.isOrganizer || req.user.isVenue) {
      const validation = yield Validator.validateAll(req.all(), Event.rules, Event.messages)
      if (validation.fails()) {
        res.json({ status: false, error: validation.messages(), messageCode: 'FAILED' })
      } else {
        let event = yield Event.create(req.all())
        event.staffInterest = req.input('staffs', '').split(',')
        event.date = new Date(req.input('date'))
        event.time = JSON.parse(req.input('time', '{"start": false, "end": false}'))
        if (req.user.isOrganizer) {
          event.isOrganizer = true
          event.organizerId = req.user.organizerId
        } else {
          event.isVenue = true
          event.venueId = req.user.venueId
        }
        yield event.save()

        res.json({ status: true, event: event, messageCode: 'SUCCESS'  })
      }
    } else {
      res.json({ status: false, messageCode: 'INVALID_PROFILE' })
    }
  }

  * select (req, res) {
    let _event = yield this.getEvent(req)
    return res.json({ status: true, event: _event })
  }

  * interested (req, res) {
    let _event = yield this.getEvent(req, res)
    if (req.user.isVenue) {

      if (req.user.venueId._id.toString() === _event.venueId._id.toString()) {
        let _staffs = []
        for (let _staff in _event.interested) {
            _staffs.push(_staff)
        }
        let staffs = yield Staff.find({ _id: { $in: _staffs } })

        return res.json({ status: true, messageCode: 'SUCCESS', staffs: staffs })

      } else {
        return res.json({ status: false, messageCode: 'UNAUTHORIZED', ids: [req.user.venueId._id, _event.venueId._id] })
      }

    } else {
      return res.json({ status: false, messageCode: 'INVALID_PROFILE' })
    }
  }

  * interest (req, res) {
    let _event = yield this.getEvent(req, res)
    if (req.user.isStaff) {
      _event.interested[req.user.staffId._id] = { staffId: req.user.staffId._id, interestedAt: new Date() }
      _event.markModified('interested')
      _event.save()
      let notification = yield VenueNotification.create({
        venueId: _event.venueId._id,
        staffId: req.user.staffId._id,
        eventId: _event._id,
        type: 'event-interest'
      })
      return res.json({ status: true, event: _event })
    } else {
      return res.json({ status: false, messageCode: 'INVALID_PROFILE' })
    }
  }

}

module.exports = EventController



// let venueFilter = req.input('venues', false)
// let serviceFilter = req.input('services', false)
// let venues = venueFilter.split(',')
// let rawEvents = yield Event.find({}).populate('venueId')
// // filters the event by venue type
// if (venueFilter) {
//   let events = rawEvents.filter((event) => {
//     for (let venue of venues) {
//       let i = event.venueId.type.indexOf(venue)
//       if (i >= 0) {
//         return true
//       }
//     }
//   })
