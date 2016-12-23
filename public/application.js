/**
 * Lays out events for a single day
 *
 * @param array  events   An array of event objects. Each event object consists of a start and end
 *                        time  (measured in minutes) from 9am, as well as a unique id. The
 *                        start and end time of each event will be [0, 720]. The start time will
 *                        be less than the end time.
 *
 * @return array  An array of event objects that has the width, the left and top positions set, in addition to the id,
 *                start and end time. The object should be laid out so that there are no overlapping
 *                events.
 */
function layOutDay(events) {
    var eventsArray = []

    // Convert associative array to pure array
    for (key in events) {
        if (events.hasOwnProperty(key)) {
            eventsArray.push({
                id: key,
                start: events[key].start,
                end: events[key].end,
                index: 0,
                collisions: [],

                width: 600,
                top: events[key].start,
                maxCollisions: 0,
                index: 0,
                equal: false
            })
        }
    }

    /*
        Iterate over events and identify where there are collisions. Accumulate them
        as an array property on the object.
     */
    eventsArray.forEach(function(event) {
        // Calculate the numer of collisions an event has
        event.collisions = eventsArray.filter(function(cEvent) {
            // Don't compare an event to itself && if the time ranges overlap
            if (event.id !== cEvent.id && (event.start <= cEvent.end && cEvent.start <= event.end)) {
                return cEvent
            }
        })

        if (event.collisions.length > 0) {
            // Determine if all collisions are equivalent
            event.equal = event.collisions.reduceRight(function(previous, current) {
                return event.collisions.length === current.collisions.length
            }, true)

            // Don't bother calculating maxCollisions if all events are equal
            if (event.equal === false) {
                event.maxCollisions = Math.max.apply(Math, event.collisions.map(function(o) {
                    return o.collisions.length
                }))
            }
        }
    })


    /*
        Iterate over the array and calculate left and width properties.
     */
    return eventsArray.map(function(event) {
        console.log('Event Properties: ', event)

        // If event has the same amount of collisions as all other colliding events, then
        // they should be placed one by one next to each other
        if (event.equal === true) {
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

            // Sort collisions by the amount of collisions they have
            event.sortedCollisions = event.collisions.sort(function(firstEvent, secondEvent) {
                return firstEvent.collisions.length < secondEvent.collisions.length
            })

            // Assign an index to each collision after we've sorted them
            event.sortedCollisions.forEach(function(cEvent, index) {
                cEvent.index = index + 1
                cEvent.width = event.width / (event.collisions.length + 1)
                cEvent.left = cEvent.width * cEvent.index
            })

            // Calculate width
            event.width = event.width / event.maxCollisions
            event.index = 0
        }

        if (event.collisions.length > event.maxCollisions) {
            event.width = event.width / event.maxCollisions
        }

        // Calculate the x position of the element
        event.left = event.width * event.index

        return event
    })
}


/**
 * We're just using a vanilla JavaScript XHR request to avoid importing
 * jQuery or using a JS framework and for overall simplicity.
 *
 * @param  {[string]}       url         url of endpoint to query
 * @param  {[function]}     success     successful response callback
 * @param  {[function]}     error       error response callback
 * @return {[object]}                   JSON response from endpoint
 */
function getRequest(url, success, error) {
    var req = false
    try {
        // most browsers
        req = new XMLHttpRequest()
    } catch (e) {
        // IE
        try {
            req = new ActiveXObject('Msxml2.XMLHTTP')
        } catch (e) {
            // try an older version
            try {
                req = new ActiveXObject('Microsoft.XMLHTTP')
            } catch (e) {
                return false
            }
        }
    }

    if (!req) return false
    if (typeof success != 'function') success = function() {}
    if (typeof error != 'function') error = function() {}

    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            return req.status === 200 ?
                success(req.responseText) : error(req.status)
        }
    }

    req.open('GET', url, true)
    req.send(null)

    return req
}


/**
 * Modification of:
 * http://stackoverflow.com/a/36126706
 *
 * @param  {[integer]}  interval    interval in minutes
 * @param  {[integer]}  start       start time (60 * 9)
 * @param  {[integer]}  end         end time (60 * 21)
 * @return {[array]}                times formatted as strings
 */
var times = function generateTimes(interval, start, end) {
    var times = [] // time array
    var ap = ['AM', 'PM'] // AM-PM

    // loop to increment the time and push results in array
    for (var i = 0; start <= end; i++) {
        var hh = Math.floor(start / 60) // starting hours of day in 0-24 format
        var mm = (start % 60) // starting minutes of the hour in 0-55 format


        times.push({
            // Pushing data in array in [00:00 - 12:00 AM/PM format], exclude AM/PM if not whole hour
            date: (hh % 12 === 0 ? 12 : hh % 12) + ':' + ("0" + mm).slice(-2),
            top: i * interval,
            period: ap[Math.floor(hh / 12)],
            show: mm === 30 ? false : true
        })

        start = start + interval
    }

    return times
}(30, 540, 1260)


/**
 * When events have been loaded, proceed to create and insert elements into the DOM
 */
document.addEventListener('DOMContentLoaded', function() {
    var timeList = document.getElementById('time-list')

    times.forEach(function(time, index) {
        var timeElement = document.createElement('li')
        timeElement.setAttribute('style',
            'position: absolute; ' +
            'top: ' + time.top + 'px;'
        )

        timeElement.innerHTML = time.date
        if (time.show) {
            timeElement.innerHTML = '<span>' + time.date + '</span>' + time.period
        }

        timeList.appendChild(timeElement)
    })

    getRequest(url,
        function success(events) {
            events = layOutDay({
                // "id-1": {
                //     "start": 30,
                //     "end": 150
                // },
                // "id-2": {
                //     "start": 540,
                //     "end": 650
                // },
                "id-3": {
                    "start": 560,
                    "end": 620
                },
                "id-4": {
                    "start": 630,
                    "end": 700
                },
                "id-5": {
                    "start": 100,
                    "end": 400
                },
                "id-6": {
                    "start": 200,
                    "end": 300
                },
                "id-7": {
                    "start": 200,
                    "end": 300
                },
                // "id-8": {
                //     "start": 50,
                //     "end": 700
                // }
            })


            console.log('Calculated Events: ', events)

            var eventList = document.getElementById('event-list')
            events.forEach(function(event) {
                var eventElement = document.createElement('li')
                eventElement.setAttribute('style',
                    'position: absolute; ' +
                    'height: ' + (event.end - event.start) + 'px;' +
                    'width: ' + event.width + 'px;' +
                    'top: ' + event.top + 'px;' +
                    'left: ' + event.left + 'px;'
                )
                eventElement.innerHTML = '<span class="title">' + event.id + '</span>' + '<p>' + event.start + ' --> ' + event.end + '</p>'
                eventList.appendChild(eventElement)

                event.element = eventElement
            })

            console.log('Placed Events: ', events)
        },

        function error(error) {
            console.error(error)
        }
    )
})
