export const quotes = [
  "The man who moves a mountain begins by carrying away small stones.",
  "You don't rise to the level of your goals. You fall to the level of your systems.",
  "Discipline is choosing between what you want now and what you want most.",
  "Hard work beats talent when talent doesn't work hard.",
  "The difference between ordinary and extraordinary is that little extra.",
  "Don't count the days. Make the days count.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Either you run the day or the day runs you.",
  "The future depends on what you do today.",
  "Amateurs wait for inspiration. Professionals just do the work.",
  "No one who gave their best ever regretted it.",
  "What you do today is important because you are exchanging a day of your life for it.",
  "Stop waiting for motivation. Start building momentum.",
  "Execution is the only strategy that matters.",
  "You can't build a reputation on what you're going to do.",
  "The most dangerous phrase: 'We've always done it this way.'",
  "Comfort zones are where dreams go to die.",
  "Pressure doesn't just build diamonds — it reveals them.",
  "Top performers don't have more hours. They eliminate waste.",
  "Focus is the art of knowing what to ignore.",
  "Every day you delay is a day you don't get back.",
  "The pain of discipline is nothing compared to the pain of regret.",
  "Winners act before they feel ready.",
  "If it's important, do it every day. If it's not, do it when you feel like it.",
  "The goal isn't to be busy — it's to be effective.",
  "Your future self is watching you right now through memories.",
  "A year from now you'll wish you had started today.",
  "Ship more. Perfect less. Iterate always.",
  "Talent is a starting point. Discipline is the destination.",
  "The secret of getting ahead is getting started.",
  "Chase the vision, not the applause.",
  "Done is better than perfect. Perfect never ships.",
  "You miss 100% of the work you don't do.",
  "Excellence is not a destination — it's a continuous process.",
  "Average people plan. Elite people execute — then adjust.",
]

export function getDailyQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return quotes[dayOfYear % quotes.length]
}
