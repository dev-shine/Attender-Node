'use strict'
const User = use('App/Model/User')
const Message = use('App/Model/Message')
const Venue = use('App/Model/Venue')
const Staff = use('App/Model/Staff')
const Organizer = use('App/Model/Organizer')
const Player = use('App/Model/Player')
const PromisePay = use('PromisePay')
const Hash = use('Hash')
const Validator = use('Validator')

class UserController {

    * index(req, res) {
        let users = yield User.find({})
        return res.json({users})
    }

    * userAccount(req, res) {
        const assembly_user = yield PromisePay.getUser(req.user.promiseId);
        const user = yield User.findOne(req.user._id).populate('staffId');
        return res.json({ user , assembly_user});
    }

    * userUpdatePlayerId(req, res) {
        const player = yield Player.create({
            userId: req.user._id,
            playerId: req._body.playerId,
        });
        player.save();
        return  res.json({status: true, messageCode: 'Update PlayerId'})
    }

    * userUpdateAccount(req, res) {
        const assembly_user = yield PromisePay.updateUser(req.user.promiseId, req._body);
        
        yield Staff.update({
            user: req.user._id
        },
        {
            $set: {
                fullname: req._body.first_name,
                lastname: req._body.last_name,
                first_name: req._body.first_name,
                last_name: req._body.last_name,
                dob: req._body.dob,
                government_number: req._body.government_number,
                mobile: req._body.mobile,
                address_line1: req._body.address_line1,
                city: req._body.city,
                state: req._body.state,
                zip: req._body.zip
            },
        }).then(d => {
            console.log(d);
        }).catch(err => {
            console.log(err);
        });
        yield User.update({
            _id: req.user._id
        },
        {
            $set: {
                fullname: req._body.first_name,
                lastname: req._body.last_name,
                first_name: req._body.first_name,
                last_name: req._body.last_name,
                dob: req._body.dob,
                government_number: req._body.government_number,
                mobile: req._body.mobile,
                address_line1: req._body.address_line1,
                city: req._body.city,
                state: req._body.state,
                zip: req._body.zip
            },
        }).then(d => {
            console.log(d);
        }).catch(err => {
            console.log(err);
        });
        const user = yield User.findOne(req.user._id).populate('staffId');
        return res.json({user, assembly_user});
    }

    // GENERAL

    * messages(req, res) {
        let thread = yield Message.find({$or: [{sender: req.user._id}, {receiver: req.user._id}]}).sort('-sentAt').distinct().populate('sender', 'receiver')
        res.json({thread: thread})
    }

    // ORGANIZER

    * getOrganizerProfile(req, res) {
        if (req.user.isOrganizer) {
            let organizer = yield Organizer.findOne(req.user.organizerId._id)
            yield res.json({status: true, messageCode: 'SUCCESS', data: organizer})
        } else {
            yield res.json({status: false, messageCode: 'INVALID_PROFILE'})
        }
    }

    * saveOrganizerProfile(req, res) {
        let name = req.input('name', ''),
            isCompany = req.input('isCompany', "0") == "1" ? true : false,
            companyName = req.input('companyName', ''),
            location = [],
            locationName = req.input('locationName', ''),
            about = req.input('about', ''),
            eventType = [],
            image = req.input('image', '')

        try {
            location = req.input('location', '').split(',')
            eventType = req.input('eventType', '').split(',')
        } catch (e) {
            console.log(e)
            yield res.json({status: false, messageCode: 'INVALID_INPUT'})
        }

        if (req.user.isOrganizer) {
            let organizer = yield Organizer.findOne(req.user.organizerId._id)
            organizer.name = name || organizer.name
            organizer.isCompany = isCompany
            organizer.companyName = companyName || organizer.companyName
            organizer.location = location || organizer.location
            organizer.locationName = locationName || organizer.locationName
            organizer.about = about || organizer.about
            organizer.eventType = eventType || organizer.eventType
            organizer.image = image || organizer.image
            organizer.save()
            yield res.json({status: true, messageCode: 'UPDATED', data: organizer})

        } else {
            if (req.user.hasProfile) {
                yield res.json({status: false, messageCode: 'PROFILE_ALREADY_SET'})
            }
            let organizer = yield Organizer.create({
                user: req.user._id,
                name: name,
                isCompany: isCompany,
                location: location,
                locationName: locationName,
                about: about,
                eventType: eventType,
                image: image
            })
            req.user.organizerId = organizer._id
            req.user.isOrganizer = true
            req.user.hasProfile = true
            req.user.save()
            yield res.json({status: true, messageCode: 'CREATED', data: organizer})
        }
    }

    // VENUE

    * getVenueProfile(req, res) {
        if (req.user.isVenue) {
            let venue = yield Venue.findOne(req.user.venueId._id)
            yield res.json({status: true, messageCode: 'SUCCESS', data: venue})
        } else {
            yield res.json({status: false, messageCode: 'INVALID_PROFILE'})
        }
    }

    * saveVenueProfile(req, res) {
        let name = req.input('name', ''),
            managerName = req.input('managerName', ''),
            type = [],
            image = req.input('image', ''),
            info = req.input('info', ''),
            tag1 = req.input('tag1', ''),
            tag2 = req.input('tag2', ''),
            location = [],
            openingHours = {},
            numberEmployees = req.input('numberEmployees', 0),
            services = [],
            socialMedia = [],
            locationName = req.input('locationName', '')

        try {
            type = req.input('type', '').split(',')
            location = req.input('location', '').split(',')
            services = req.input('services', '').split(',')
            openingHours = JSON.parse(req.input('openingHours', '{}'))
            socialMedia = req.input('socialMedia', '').split(',')
            // socialMedia = JSON.parse(req.input('socialMedia', '{}'))
        } catch (e) {
            console.log(e);
            yield res.json({status: false, messageCode: 'INVALID_INPUT'})
        }

        if (req.user.isVenue) {
            let venue = yield Venue.findOne(req.user.venueId._id)
            venue.name = name || venue.name
            venue.image = image || venue.image
            venue.info = info || venue.info
            venue.tag1 = tag1 || venue.tag1
            venue.tag2 = tag2 || venue.tag2
            venue.managerName = managerName || venue.managerName
            venue.type = type || venue.type
            venue.location = location || venue.location
            venue.locationName = locationName || locationName
            venue.openingHours = openingHours || venue.openingHours
            venue.numberEmployees = numberEmployees || venue.numberEmployees
            venue.services = services || venue.services
            venue.socialMedia = socialMedia || venue.socialMedia
            venue.save()
            yield res.json({status: true, messageCode: 'UPDATED', data: venue})

        } else {
            if (req.user.hasProfile) {
                yield res.json({status: false, messageCode: 'PROFILE_ALREADY_SET'})
            }
            let venue = yield Venue.create({
                user: req.user._id,
                name: name,
                tag1: tag1,
                tag2: tag2,
                info: info,
                image: image,
                managerName: managerName,
                type: type,
                location: location,
                locationName: locationName,
                openingHours: openingHours,
                numberEmployees: numberEmployees,
                services: services,
                socialMedia: socialMedia
            })
            req.user.venueId = venue._id
            req.user.isVenue = true
            req.user.hasProfile = true
            req.user.save()

            yield res.json({status: true, messageCode: 'CREATED', data: venue})
        }

    }

    // STAFF

    * getStaffProfile(req, res) {
        if (req.user.isStaff) {
            let staff = yield Staff.findOne(req.user.staffId._id)
            yield res.json({status: true, messageCode: 'SUCCESS', data: staff})
        } else {
            yield res.json({status: false, messageCode: 'INVALID_PROFILE'})
        }
    }

    * saveStaffProfile(req, res) {
        let description = [],
            position = [],
            qualifications = [],
            skills = [],
            experiences = [],
            certificates = [],
            availability = [],
            licenses = [],
            languages = [],
            birthdate = '',
            avatar = '',
            startRate='',
            endRate=''

        try {
            description = req.input('description', '').split(',')
            position = req.input('position', '').split(',')
            qualifications = req.input('qualifications', '').split(',')
            skills = req.input('skills', '').split(',')
            experiences = JSON.parse(req.input('experiences', '{}'))
            certificates = req.input('certificates', '').split(',').filter(item => item.length > 0)
            licenses = req.input('licenses', '').split(',').filter(item => item.length > 0)
            languages = req.input('languages', '').split(',')
            availability = JSON.parse(req.input('availability', '{}'))
            birthdate = new Date(req.input('birthdate'))
            avatar = req.input('avatar', '')
            startRate = isNaN(req.input('startRate', ""))? "": req.input('startRate', "")
            endRate = isNaN(req.input('endRate', ""))? "": req.input('endRate', "")
            console.log("1st ", birthdate)
        } catch (e) {
            yield res.json({status: false, messageCode: 'INVALID_INPUT'})
        }
        if (req.user.isStaff) {
            let staff = yield Staff.findOne(req.user.staffId._id)
            console.log(avatar)
            staff.avatar = avatar
            staff.email = req.user.email
            staff.mobile = req.user.mobile
            staff.fullname = req.input('fullname', req.user.fullname)
            staff.lastname = req.input('lastname', req.user.lastname)
            staff.bio = req.input('bio', '') || staff.bio
            staff.description = description || staff.description
            staff.gender = req.input('gender', staff.gender)
            staff.birthdate = birthdate || staff.birthdate
            staff.preferredLocation = req.input('preferredLocation', staff.preferredLocation)
            staff.preferredDistance = req.input('preferredDistance', staff.preferredDistance)
            staff.frequency = req.input('frequency', staff.frequency)
            staff.position = position || staff.position
            console.log(startRate, req.input('startRate', ""))
            console.log(isNaN(req.input('startRate', "")), isNaN(1))
            staff.startRate = startRate || staff.startRate
            staff.endRate = endRate || staff.endRate
            staff.rateBadge = req.input('rateBadge', staff.rateBadge)
            staff.rateType = req.input('rateType', staff.rateType)
            staff.qualifications = qualifications || staff.qualifications
            staff.skills = skills || staff.skills
            staff.experiences = experiences || staff.experiences
            staff.certificates = certificates.length > 0 ? certificates : staff.certificates
            staff.availability = availability || staff.availability
            staff.licenses = licenses.length > 0 ? licenses : staff.licenses
            staff.languages = languages || staff.languages
            staff.save((val1, val2)=>{
                console.log("val1", val1)
                console.log("val2", val2)
            })

            // let user = yield User.findOne(req.user._id)
            // user.avatar = avatar
            // user.staffId = staff._id
            // user.isStaff = true
            // user.hasProfile = true
            // user.save()

            yield User.update({
                _id: req.user._id
            },
            {
                $set: {
                    avatar: avatar,
                    staffId: staff._id,
                    isStaff: true,
                    hasProfile: true,
                },
            }).then(d => {
                console.log(d);
            }).catch(err => {
                console.log(err);
            });

            var dd = birthdate.getDate();
            var mm = birthdate.getMonth()+1; //January is 0!

            var yyyy = birthdate.getFullYear();
            if(dd<10){
                dd='0'+dd;
            }
            if(mm<10){
                mm='0'+mm;
            }
            var dob = dd+'/'+mm+'/'+yyyy;

            PromisePay.updateUser(req.user.promiseId, {
                last_name: staff.lastname,
                first_name: staff.fullname,
                dob
            }).then((res)=>{
                PromisePay.kycapproved(req.user.promiseId)
            })

            yield res.json({status: true, messageCode: 'UPDATED', data: staff})
        } else {
            if (req.user.hasProfile) {
                yield res.json({status: false, messageCode: 'PROFILE_ALREADY_SET'})
            }
            let staff = yield Staff.create({
                user: req.user._id,
                avatar: avatar,
                email: req.user.email,
                mobile: req.user.mobile,
                fullname: req.input('fullname', req.user.fullname),
                lastname: req.input('lastname', req.user.lastname),
                bio: req.input('bio', ''),
                description: description,
                gender: req.input('gender'),
                birthdate: birthdate,
                preferredLocation: req.input('preferredLocation'),
                preferredDistance: req.input('preferredDistance'),
                frequency: req.input('frequency'),
                position: position,
                startRate: req.input('startRate', 10),
                endRate: req.input('endRate', 15),
                rateBadge: req.input('rateBadge'),
                rateType: req.input('rateType', 'hourly'),
                qualifications: qualifications,
                skills: skills,
                experiences: experiences,
                certificates: certificates,
                availability: availability,
                licenses: licenses,
                languages: languages,
            })
            // let user = yield User.findOne(req.user._id)
            // user.avatar = avatar
            // user.staffId = staff._id
            // user.isStaff = true
            // user.hasProfile = true
            // user.save()
            yield User.update({
                _id: req.user._id
            },
            {
                $set: {
                    avatar: avatar,
                    staffId: staff._id,
                    isStaff: true,
                    hasProfile: true,
                },
            }).then(d => {
                console.log(d);
            }).catch(err => {
                console.log(err);
            });
            yield res.json({status: true, messageCode: 'CREATED', data: staff})
        }
    }

    * changeEmail (req, res) {
    let oldEmail = req.input('oldEmail')
    let newEmail = req.input('newEmail')

    if (oldEmail != req.user.email) {
        return res.json({ status: false, message: 'Old email doesn\'t match' })
    }

    if (oldEmail == newEmail) {
        return res.json({ status: false, message: 'New email must not match with old email' })
    }
  
    let user = yield User.findOne({ email: req.user.email})
  
    if (user) {
      user.verified = false
      user.email = newEmail
      user.save()
  
      return res.json({ status: true, message: 'Email Changed' })
    } else {
      return res.json({ status: false, message: 'Not Found' })
    }
  }

  * changePassword (req, res) {
  let newPassword = req.input('newPassword')
  let newPasswordConfirm = req.input('newPasswordConfirm')

  if (newPassword != newPasswordConfirm) {
      return res.json({ status: false, message: 'Passwords don\'t match' })
  }

  let user = yield User.findOne({ email: req.user.email})

  if (user) {
    user.password = yield Hash.make(newPassword)
    user.save()

    return res.json({ status: true, message: 'Password Changed' })
  } else {
    return res.json({ status: false, message: 'Not Found' })
  }
}

* deactivateUser (req, res) {
    const user = yield User.findOne({ email: req.user.email})
    let password = req.input('password') 
    const account = {
        email: req.user.email,
        password: password
    }

    const validation = yield Validator.validateAll(account, User.loginRules)
    if (validation.fails()) {
      return res.json({ status: false, message: 'Invalid input' })
    } else {
      if (Hash.verify(password, user.password)) {
        user.isActive = false;
        user.save()

        return res.json({ status: true, message: 'Deactivated' })
      }  else {
        return res.json({ status: false, message: 'Incorrect password' })
      }
    }
}

}

module.exports = UserController
