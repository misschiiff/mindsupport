"use client";

import { useEffect, useState } from "react";
import { Icon } from "./ui-icon";
import { SubscriberSignup } from "./subscriber-signup";
import { downloadReflectionImage } from "./reflection-share-card";
import { getPublicApi, mutatePublicApi } from "../lib/api-client";

type Reflection = { id: string; text: string; createdAt?: string; likes: number; liked?: boolean; example?: boolean; category: string; footer: string };

function ReflectionActions({ item }: { item: Reflection }) {
  const [engagement, setEngagement] = useState({ likes: item.likes, liked: Boolean(item.liked) });
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    setEngagement({ likes: item.likes, liked: Boolean(item.liked) });
  }, [item.likes, item.liked]);

  async function toggleLike() {
    if (item.example || pending) return;
    setPending(true);
    try {
      const result = await mutatePublicApi(`reflections/${encodeURIComponent(item.id)}/like`, { liked: !engagement.liked });
      setEngagement({ likes: Number(result.likes) || 0, liked: Boolean(result.liked) });
      setNotice("Your like has been saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Your like couldn’t be saved. Please try again.");
    } finally { setPending(false); }
  }

  function download() {
    try {
      downloadReflectionImage(item.text, item.id);
      setNotice("Reflection downloaded as an image.");
    } catch { setNotice("This browser couldn’t create the image. Please try again."); }
  }

  return <div className="reflection-actions"><button type="button" className={`reflection-action${engagement.liked ? " liked" : ""}`} aria-pressed={engagement.liked} aria-label={`${engagement.liked ? "Unlike" : "Like"} this reflection, ${engagement.likes} likes`} disabled={item.example || pending} onClick={() => void toggleLike()} title={item.example ? "Likes are available on shared reflections" : undefined}><Icon name="heart" size={16}/><span>{engagement.likes}</span></button><button type="button" className="reflection-action" onClick={download}><Icon name="download" size={16}/><span>Download</span></button>{notice && <span role="status" className="sr-only">{notice}</span>}</div>;
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
  const [published, setPublished] = useState<Reflection[]>([]);
  const [feedError, setFeedError] = useState("");
  useEffect(() => {
    let active = true;
    getPublicApi("reflections").then((result) => {
      if (!active) return;
      const values = Array.isArray(result.reflections) ? result.reflections as Array<Record<string, unknown>> : [];
      setPublished(values.filter((item) => typeof item.id === "string" && typeof item.text === "string").map((item) => ({
        id: String(item.id), text: String(item.text), createdAt: String(item.createdAt || ""),
        likes: Number(item.likes) || 0, liked: Boolean(item.liked), category: "SHARED WITH CARE",
        footer: "Reviewed by Mindsupport",
      })));
    }).catch((error: unknown) => {
      if (active) setFeedError(error instanceof Error ? error.message : "Shared reflections couldn’t be loaded.");
    });
    return () => { active = false; };
  }, []);

  const cards: Reflection[] = [...published, ...examples.map((item) => ({ ...item, likes: 0, liked: false, example: true }))];

  return <><div className="demo-label"><Icon name="shield" size={16}/> Anonymous messages appear only after review and approval.</div>{feedError && <p className="reflection-feed-notice" role="status">{feedError} Showing illustrative examples for now.</p>}<div className="reflection-grid">{cards.map((item, index) => <div className="reflection-grid-item" key={item.id}><article className={`reflection-card reflection-card-${index % 3}`}><span>{item.category}</span><p>“{item.text}”</p><small>{item.footer}</small><div className="reflection-card-foot"><span>{item.example ? "Illustrative example" : "Shared anonymously"}</span><ReflectionActions item={item}/></div></article>{(index + 1) % 6 === 0 && <SubscriberSignup/>}</div>)}</div><small className="reflection-engagement-note">Likes on shared reflections are stored as anonymous per-reflection counts. Example cards are not tracked.</small></>;
}
