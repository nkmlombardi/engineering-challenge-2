
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
            events = JSON.parse(events)

            var eventsArray = []

            // Convert associative array to pure array
            for (key in events) {
                if (events.hasOwnProperty(key)) {
                    eventsArray.push({
                        id: key,
                        start: events[key].start,
                        end: events[key].end
                    })
                }
            }

            var calendar = new Calendar({
                width: 600,
                events: eventsArray
            })

            var eventList = document.getElementById('event-list')
            calendar.events.forEach(function(event) {
                var eventElement = document.createElement('li')
                eventElement.setAttribute('style',
                    'position: absolute; ' +
                    'height: ' + (event.end - event.start) + 'px;' +
                    'width: ' + event.width + 'px;' +
                    'top: ' + event.top + 'px;' +
                    'left: ' + event.left + 'px;'
                )
                eventElement.innerHTML = '<span class="title">Sample Item</span>' + '<p>Sample Location</p>'
                eventList.appendChild(eventElement)

                event.element = eventElement
            })

            console.log('After placeEvents Function: ', calendar.events.slice(0).map(function(item) { return Object.assign({}, item) }))
        },

        function error(error) {
            console.error(error)
        }
    )
})
