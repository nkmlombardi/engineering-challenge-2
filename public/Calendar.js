/**
 * Takes a series of events in array format and places them
 * into a calendar UI element.
 * @param {[int]}       width       width of the calendar UI element
 * @param {[array]}     events      array of event objects
 */
var Calendar = function(options) {
    // Make sure we have an array, otherwise throw error and render empty calendar
    if (!(options.events instanceof Array)) {
        Error('Calendar input must be of type Array', events)
        options.events = []
    }

    // Object properties
    this.width = options.width || 600
    this.events = []

    // Only add events if they are defined
    if (options.events) {
        this.addEvents(options.events)
    }
}


Calendar.prototype.addEvents = function(newEvents) {
    var scope = this

    // Sort the input ascending by time so we iterate them first
    newEvents.sort(function(a, b) {
        return a.start > b.start

    // Add computed properties to each event object
    }).map(function(event) {
        scope.events.push({
            // Static Properties
            id: event.id,
            start: event.start,
            end: event.end,
            top: event.start,

            // Computed Properties
            index: 0,
            width: scope.width,
            collisions: [],
            maxCollisions: 0,
            equal: false
        })
    })

    /*
        Since we have new events, let's recalculate both
        collisions and the positions of the events
     */
    scope.collisions()
    scope.placeEvents()

    return scope.events
}


Calendar.prototype.collisions = function() {
    console.log('Before Collisions Function: ', this.events.slice(0).map(function(item) { return Object.assign({}, item) }))
    var scope = this

    /*
        We want the objects in the collisions array to be references
        to the actual event objects, not copies. That way when we are
        iterating through and calculating properties, we are effecting
        the actual events.
     */
    this.events = this.events.map(function(event) {
        event.collisions = scope.events.filter(function(cEvent) {
            // Don't compare an event to itself && if the time ranges overlap
            if (event.id !== cEvent.id && (event.start <= cEvent.end && cEvent.start <= event.end)) {
                return cEvent
            }
        })

        return event
    })

    /*
        Now we either want to determine if all colliding events are equal, or if we need
        to determine what the maxCollisions are which will help us determine width / index
     */
    this.events = this.events.map(function(event) {
        if (event.collisions.length > 0) {
            // event.equal = event.collisions.reduceRight(function(previous, current) {
            //     return event.collisions.length === current.collisions.length
            // }, true)

            // Determine if all collisions are equivalent
            event.equal = (event.collisions.reduce(function(previous, current) {
                return previous + current.collisions.length
            }, 0) / event.collisions.length) === event.collisions.length ? true : false

            // Don't bother calculating maxCollisions if all events are equal
            if (event.equal === false) {
                event.maxCollisions = Math.max.apply(Math, event.collisions.map(function(o) {
                    return o.collisions.length
                }))
            }
        }

        return event
    }).sort(function(firstEvent, secondEvent) {
        return firstEvent.collisions.length < secondEvent.collisions.length
    })
}

Calendar.prototype.placeEvents = function() {
    console.log('Before placeEvents Function: ', this.events.slice(0).map(function(item) { return Object.assign({}, item) }))
    var scope = this

    this.events = this.events.map(function(event) {

        // If event has the same amount of collisions as all other colliding events, then
        // they should be placed one by one next to each other
        if (event.equal === true) {
            event.collisions.map(function(cEvent, index) {
                cEvent.index = index
                cEvent.width = scope.width / (event.collisions.length + 1)
                cEvent.left = cEvent.width * cEvent.index
            })

            event.width = scope.width / (event.collisions.length + 1)
            event.index = event.collisions.length
            event.left = event.width * event.index

            event.condition = 1

            console.log('Event ' + event.id + ' exiting because equal: ', event.width, event.index, event.left)

            return event
        }

        // If event with most collisions is more than current event's collisions, set the
        // index to be less so it is aligned to the left of that event
        if (event.collisions.length < event.maxCollisions) {

            // Sort collisions by the amount of collisions they have
            var sortedCollisions = event.collisions.sort(function(firstEvent, secondEvent) {
                return firstEvent.collisions.length < secondEvent.collisions.length
            })

            // Assign an index to each collision after we've sorted them
            sortedCollisions.forEach(function(cEvent, index) {
                cEvent.index = index + 1
                cEvent.width = scope.width / event.maxCollisions
                cEvent.left = cEvent.width * cEvent.index
            })

            event.sorted = sortedCollisions

            // Calculate width
            event.width = scope.width / event.maxCollisions
            event.index = 0
            event.left = scope.width * event.index

            event.condition = 2

            console.log('Event', event)

            return event
        }


        if (event.collisions.length > event.maxCollisions) {
            event.width = scope.width / event.maxCollisions
            event.condition = 3
            event.left = scope.width * event.index

            return event
        }

        return event
    })
}