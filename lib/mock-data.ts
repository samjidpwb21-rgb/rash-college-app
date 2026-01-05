
import { addDays, subHours, subDays } from "date-fns"

export type NoticeType = "academic" | "exam" | "event" | "general"

export interface Notice {
  id: string
  title: string
  description: string
  postedBy: string
  date: Date
  type: NoticeType
  isUnread?: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  date: Date
  organizer: string
  location?: string
  imageUrl?: string
}

export const NOTICES: Notice[] = [
  {
    id: "1",
    title: "Mid-Semester Exam Schedule Released",
    description: "The tentative schedule for the upcoming mid-semester examinations has been published. Please check the examination portal for details.",
    postedBy: "Admin Office",
    date: subHours(new Date(), 2),
    type: "exam",
    isUnread: true,
  },
  {
    id: "2",
    title: "Guest Lecture: AI in Healthcare",
    description: "Join us for an insightful session with Dr. Sarah Connor on the impact of Artificial Intelligence in modern healthcare systems.",
    postedBy: "Dept. of Computer Science",
    date: subDays(new Date(), 1),
    type: "academic",
    isUnread: true,
  },
  {
    id: "3",
    title: "Annual Sports Day Registration",
    description: "Registration for the Annual Sports Day is now open. Interested students can register at the sports complex.",
    postedBy: "Sports Committee",
    date: subDays(new Date(), 2),
    type: "event",
  },
  {
    id: "4",
    title: "Library Maintenance",
    description: "The main library will remain closed this Sunday for scheduled maintenance work.",
    postedBy: "Librarian",
    date: subDays(new Date(), 3),
    type: "general",
  },
]

export const EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "Tech Symposium 2025",
    description: "Annual technology symposium featuring student projects and industry expert talks.",
    date: addDays(new Date(), 2),
    organizer: "Tech Club",
    location: "Main Auditorium",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    title: "Career Fair",
    description: "Meet top recruiters from leading tech companies using our campus placement drive.",
    date: addDays(new Date(), 5),
    organizer: "Placement Cell",
    location: "Campus Grounds",
    imageUrl: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    title: "Cultural Fest Night",
    description: "A night of music, dance, and drama to celebrate our diverse culture.",
    date: addDays(new Date(), 10),
    organizer: "Student Council",
    location: "Amphitheater",
    imageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=300&fit=crop",
  },
  {
    id: "4",
    title: "Python Workshop",
    description: "Hands-on workshop on Python programming for data science.",
    date: addDays(new Date(), 12),
    organizer: "CS Department",
    location: "Lab 2",
    imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=300&fit=crop",
  },
]

export async function getNotices(): Promise<Notice[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return NOTICES
}

export async function getEvents(): Promise<CalendarEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return EVENTS
}
