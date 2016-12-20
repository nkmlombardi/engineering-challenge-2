var Calendar = function(events) {
    this.events = (
        events instanceof Array ? events : this.purifyArray(events)
    ) || {}

    this.times = []
}


Calendar.prototype.purifyArray = function(associativeArray, callback) {
    var pureArray = []

    for (key in associativeArray) {
        if (associativeArray.hasOwnProperty(key)) {
            pureArray.push(callback(associativeArray[key], key))
        }
    }
}


Calendar.prototype.mapCollisions = function() {
    this.events = this.events.map(function(event) {
        event.collisions = this.events.filter(function(cEvent) {
            // If we aren't looking at the same event
            if (event.id !== cEvent.id) {

                // If the start of the event is in range*
                if (event.start >= cEvent.start && event.start <= cEvent.end) {
                    return cEvent
                }

                // If the end of the event is in range
                if (event.end >= cEvent.start && event.end <= cEvent.end) {
                    return cEvent
                }

                // If the median of the event range is inside the range
                if ((event.start + event.end) / 2 >= cEvent.start && (event.start + event.end) / 2 <= cEvent.end) {
                    return cEvent
                }
            }
        })

        return event
    })

    return this.events
}


Calendar.prototype.calculateEvents = function() {
    /*
        Iterate over the array and calculate left and width properties.
     */
    this.events = this.events.map(function(event) {
        event.width = 600
        event.maxCollisions = 0
        event.index = 0
        event.equal = false

        // Determine child event with most collisions
        if (event.collisions.length > 0) {
            event.maxCollisions = Math.max.apply(Math, event.collisions.map(function(o) {
                return o.collisions.length
            }))

            // Determine if all collisions are equivalent
            event.equal = event.collisions.reduceRight(function(previous, current) {
                return event.collisions.length === current.collisions.length
            }, true)
        }


        // If event has the same amount of collisions as all other colliding events, then
        // they should be placed one by one next to each other
        if (event.equal) {
            event.collisions.map(function(cEvent, index) {
                cEvent.index = index
                cEvent.width = event.width / (event.collisions.length + 1)
                cEvent.left = cEvent.width * cEvent.index
            })

            event.width = event.width / (event.collisions.length + 1)
            event.index = event.collisions.length
        }


        // If event with most collisions is more than current event's collisions, set the
        // index to be less so it is aligned to the left of that event
        if (event.collisions.length < event.maxCollisions) {
            // event.index = event.collisions.length - 1
            // event.width = event.width / event.maxCollisions + 1

            event.sortedCollisions = event.collisions.sort(function(firstEvent, secondEvent) {
                return firstEvent.collisions.length < secondEvent.collisions.length
            })

            event.sortedCollisions.map(function(cEvent, index) {
                cEvent.index = index + 1
                cEvent.width = event.width / (event.collisions.length + 1)
                cEvent.left = cEvent.width * cEvent.index
            })

            event.width = event.width / (event.maxCollisions)
            event.index = 0
        }

        // Calculate the x position of the element
        event.left = event.width * event.index

        return event
    })

    return this.events
}


Calendar.prototype.generateTimes = function(interval, start, end) {
    var ap = ['AM', 'PM'] // AM-PM

    // loop to increment the time and push results in array
    for (var i = 0; start <= end; i++) {
        var hh = Math.floor(start / 60) // starting hours of day in 0-24 format
        var mm = (start % 60) // starting minutes of the hour in 0-55 format


        this.times.push({
            // Pushing data in array in [00:00 - 12:00 AM/PM format], exclude AM/PM if not whole hour
            date: (hh % 12 === 0 ? 12 : hh % 12) + ':' + ("0" + mm).slice(-2),
            top: i * interval,
            period: ap[Math.floor(hh / 12)],
            show: mm === 30 ? false : true
        })

        start = start + interval
    }

    return this.times
}