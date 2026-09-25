// Quote wording copied exactly from PROMPT.md (including "Ocian").
export const QUOTES = {
  declaration: { text: "We hold these truths to be self-evident, that all men are created equal.", by: "Declaration of Independence, 1776" },
  clark: { text: "Ocian in view! O! the joy.", by: "William Clark, 1805" },
  alamo: { text: "Remember the Alamo!", by: "Battle cry, 1836" },
  osullivan: { text: "...our manifest destiny to overspread the continent...", by: "John L. O'Sullivan, 1845" },
  lincoln: { text: "...government of the people, by the people, for the people, shall not perish from the earth.", by: "Abraham Lincoln, 1863" },
  wright: { text: "Success four flights thursday morning", by: "Orville Wright, 1903" },
  eisenhower: { text: "The eyes of the world are upon you.", by: "Dwight D. Eisenhower, 1944" },
  kennedy: { text: "We choose to go to the Moon.", by: "John F. Kennedy, 1962" },
  armstrong: { text: "That's one small step for man, one giant leap for mankind.", by: "Neil Armstrong, 1969" },
  reagan: { text: "Mr. Gorbachev, tear down this wall!", by: "Ronald Reagan, 1987" },
  jobs: { text: "Every once in a while, a revolutionary product comes along that changes everything.", by: "Steve Jobs, 2007" },
} as const;

export type QuoteId = keyof typeof QUOTES;
