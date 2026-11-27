"use client";

import { useEffect, useState } from "react";
import { AnonymousMessage, DEMO_CHANGE_EVENT, readDemoData } from "../lib/demo-store";
import { Icon } from "./ui-icon";
import { SubscriberSignup } from "./subscriber-signup";
import { downloadReflectionImage } from "./reflection-share-card";

type Engagement = Record<string, { likes: number; liked: boolean }>;
const ENGAGEMENT_KEY = "mindsupport.reflection-engagement.v1";

function readEngagement(): Engagement {
  try {
    const value = JSON.parse(window.localStorage.getItem(ENGAGEMENT_KEY) ?? "{}");
    return value && typeof value === "object" ? value as Engagement : {};
  } catch { return {}; }
}

function ReflectionActions({ id, text }: { id: string; text: string }) {
  const [engagement, setEngagement] = useState({ likes: 0, liked: false });
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setEngagement(readEngagement()[id] ?? { likes: 0, liked: false }), 0);
    return () => window.clearTimeout(timer);
  }, [id]);

  function toggleLike() {
    const all = readEngagement();
    const current = all[id] ?? { likes: 0, liked: false };
    const next = { likes: Math.max(0, current.likes + (current.liked ? -1 : 1)), liked: !current.liked };
    const updated = { ...all, [id]: next };
    try { window.localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(updated)); } catch { /* Keep the interaction available for this page view. */ }
    setEngagement(next);
  }

  function download() {
    try {
      downloadReflectionImage(text, id);
      setNotice("Reflection downloaded as an image.");
    } catch { setNotice("This browser couldn’t create the image. Please try again."); }
  }

  return <div className="reflection-actions"><button type="button" className={`reflection-action${engagement.liked ? " liked" : ""}`} aria-pressed={engagement.liked} aria-label={`${engagement.liked ? "Unlike" : "Like"} this reflection, ${engagement.likes} likes`} onClick={toggleLike}><Icon name="heart" size={16}/><span>{engagement.likes}</span></button><button type="button" className="reflection-action" onClick={download}><Icon name="download" size={16}/><span>Download</span></button>{notice && <span role="status" className="sr-only">{notice}</span>}</div>;
}

const examples = [
  { id: "sample-1", category: "BEGINNING", text: "I don’t know what I need yet. I just know I don’t want to keep carrying it on my own.", footer: "A thought about getting started" },
  { id: "sample-2", category: "FEELING STUCK", text: "What if I’m not looking for answers, just a place where I can say it out loud?", footer: "A question about being heard" },
  { id: "sample-3", category: "MAKING SPACE", text: "I want to understand why I keep showing up for everyone else and forgetting myself.", footer: "A reflection on caring for yourself" },
  { id: "sample-4", category: "TAKING A PAUSE", text: "Maybe I can begin by noticing what I need, without having to fix everything today.", footer: "A note on moving gently" },
  { id: "sample-5", category: "FINDING WORDS", text: "It helps to remember that not knowing where to start can still be a place to start.", footer: "A thought about beginning" },
  { id: "sample-6", category: "MAKING ROOM", text: "I’m learning that asking for a little space can be part of caring for myself.", footer: "A reflection on self-kindness" },
];

export function ReflectionsFeed() {
  const [published, setPublished] = useState<AnonymousMessage[]>([]);
  useEffect(() => {
    const refresh = () => setPublished(readDemoData().messages.filter((item) => item.status === "Published" && item.reflectionText.trim()));
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener(DEMO_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.clearTimeout(timer); window.removeEventListener(DEMO_CHANGE_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, []);

  const cards = [
    ...published.map((item) => ({ id: item.id, category: "SHARED WITH CARE", text: item.reflectionText, footer: "Reviewed by Mindsupport" })),
    ...examples,
  ];

  return <><div className="demo-label"><Icon name="shield" size={16}/> Clearly marked examples · Not submitted by visitors</div><div className="reflection-grid">{cards.map((item, index) => <div className="reflection-grid-item" key={item.id}><article className={`reflection-card reflection-card-${index % 3}`}><span>{item.category}</span><p>“{item.text}”</p><small>{item.footer}</small><div className="reflection-card-foot"><span>{item.category === "SHARED WITH CARE" ? "Shared anonymously" : "Illustrative example"}</span><ReflectionActions id={item.id} text={item.text}/></div></article>{(index + 1) % 6 === 0 && <SubscriberSignup/>}</div>)}</div><small className="reflection-engagement-note">Like counts in this preview are saved in this browser only. Shared counts need the backend.</small></>;
}
