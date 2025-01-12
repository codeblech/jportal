import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function Exams({ 
  w, 
  examSchedule, 
  setExamSchedule,
  examSemesters,
  setExamSemesters,
  selectedExamSem,
  setSelectedExamSem,
  selectedExamEvent,
  setSelectedExamEvent
}) {
  const [examEvents, setExamEvents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch semesters on component mount
    const fetchSemesters = async () => {
      if (examSemesters.length === 0) {
        const examSems = await w.get_semesters_for_exam_events()
        setExamSemesters(examSems)
      }
    }
    fetchSemesters()
  }, [])

  // Fetch exam events when semester is selected
  const handleSemesterChange = async (value) => {
    setLoading(true)
    try {
      const semester = examSemesters.find(sem => sem.registration_id === value)
      setSelectedExamSem(semester)
      const events = await w.get_exam_events(semester)
      setExamEvents(events)
      setSelectedExamEvent(null)
      setExamSchedule({}) // Clear the exam schedule when changing semester
    } finally {
      setLoading(false)
    }
  }

  // Fetch exam schedule when event is selected
  const handleEventChange = async (value) => {
    setLoading(true)
    try {
      const event = examEvents.find(evt => evt.exam_event_id === value)
      setSelectedExamEvent(event)
      
      if (!examSchedule[value]) {
        const response = await w.get_exam_schedule(event)
        setExamSchedule(prev => ({
          ...prev,
          [value]: response.subjectinfo
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const currentSchedule = selectedExamEvent && examSchedule[selectedExamEvent.exam_event_id]

  // Format date string to a more readable format
  const formatDate = (dateStr) => {
    const [day, month, year] = dateStr.split('/')
    return new Date(`${month}/${day}/${year}`).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="text-white dark:text-black font-sans">
      <div className="sticky top-14 bg-[#191c20] dark:bg-white z-20">
        <div className="pt-2 pb-4 px-3">
          <Select 
            onValueChange={handleSemesterChange}
            value={selectedExamSem?.registration_id || ""}
          >
            <SelectTrigger className="bg-[#191c20] dark:bg-white text-white dark:text-black border-white dark:border-black">
              <SelectValue placeholder="Select semester">
                {selectedExamSem?.registration_code || "Select semester"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#191c20] dark:bg-white text-white dark:text-black border-white dark:border-black">
              {examSemesters.map((sem) => (
                <SelectItem key={sem.registration_id} value={sem.registration_id}>
                  {sem.registration_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedExamSem && (
            <div className="mt-2">
              <Select 
                onValueChange={handleEventChange}
                value={selectedExamEvent?.exam_event_id || ""}
              >
                <SelectTrigger className="bg-[#191c20] dark:bg-white text-white dark:text-black border-white dark:border-black">
                  <SelectValue placeholder="Select exam event">
                    {selectedExamEvent?.exam_event_desc || "Select exam event"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#191c20] dark:bg-white text-white dark:text-black border-white dark:border-black">
                  {examEvents.map((event) => (
                    <SelectItem key={event.exam_event_id} value={event.exam_event_id}>
                      {event.exam_event_desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            Loading...
          </div>
        ) : currentSchedule?.length > 0 ? (
          <div className="space-y-2 divide-y divide-muted">
            {currentSchedule.map((exam) => {
              return (
                <div 
                  key={`${exam.subjectcode}-${exam.datetime}-${exam.datetimefrom}`} 
                  className="py-4 px-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">
                        {exam.subjectdesc.split('(')[0].trim()}
                      </h3>
                      <p className="text-sm text-gray-400 dark:text-gray-600">{exam.subjectcode}</p>
                    </div>
                    {(exam.roomcode || exam.seatno) && (
                      <div className="text-2xl font-medium whitespace-nowrap">
                        {exam.roomcode && exam.seatno 
                          ? `${exam.roomcode}-${exam.seatno}`
                          : exam.roomcode || exam.seatno}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-white dark:text-black">
                    <p>{formatDate(exam.datetime)}</p>
                    <p>{exam.datetimeupto}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : selectedExamEvent ? (
          <div className="flex items-center justify-center py-4">
            No exam schedule available
          </div>
        ) : null}
      </div>
    </div>
  )
}