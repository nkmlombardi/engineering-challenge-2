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

                times: events[key].start + ' -> ' + events[key].end,

                index: 0,
                collisions: 0
            })
        }
    }

    /*
        Iterate over events and identify where there are collisions. Accumulate them
        as an array property on the object.
     */
    eventsArray = eventsArray.map(function(event) {
        event.collisions = eventsArray.filter(function(cEvent) {
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

    /*
        Iterate over the array and calculate left and width properties.
     */
    return eventsArray.map(function(event) {
        event.width = 600
        event.maxCollisions = 0

        // Determine child event with most collisions
        if (event.collisions.length > 0) {
            event.maxCollisions = Math.max.apply(Math, event.collisions.map(function(o) {
                return o.collisions.length }))
        }

        // Index will default to event with most collisions
        event.index = event.maxCollisions

        // If event with most collisions is more than current event's collisions, set the
        // index to be less so it is aligned to the left of that event
        if (event.collisions.length < event.maxCollisions) {
            event.index = event.collisions.length - 1
            event.width = event.width / event.maxCollisions
        }

        // If the event has the most collisions, then use it's collisions to determine the
        // width of the event
        if (event.collisions.length > event.maxCollisions) {
            event.width = event.width / event.collisions.length
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

    getRequest('https://appcues-interviews.firebaseio.com/calendar/events.json',
        function success(events) {
            events = JSON.parse(events)
            events['fake-id'] = {
                start: 0,
                end: 60
            }
            events['fake-id2'] = {
                start: 0,
                end: 60
            }

            console.log(events)

            events = layOutDay(events)

            console.log('after: ', events)

            var eventList = document.getElementById('event-list')

            events.forEach(function(event) {
                var eventElement = document.createElement('li')
                eventElement.setAttribute('style',
                    'position: absolute; ' +
                    'height: ' + (event.end - event.start) + 'px;' +
                    'width: ' + event.width + 'px;' +
                    'top: ' + event.start + 'px;' +
                    'left: ' + event.left + 'px;'
                )
                eventElement.innerHTML = '<span class="title">Sample Item</span>' +
                    '<p>Sample Location</p>'
                eventList.appendChild(eventElement)
            })
        },

        function error(error) {
            console.error(error)
        }
    )
})
