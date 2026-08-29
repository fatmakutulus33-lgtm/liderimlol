"use client";

import { useEffect, useRef, useState } from "react";

type City = { name: string; votes: number };
type MapLeader = { title: string; logoUrl: string };

export function TurkeyMap({ cities, leaders, onSelect }: { cities: City[]; leaders: Record<string, MapLeader>; onSelect: (name: string) => void }) {
  const [svg, setSvg] = useState("");
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => { fetch("/turkiye-illeri.svg").then((response) => response.text()).then(setSvg); }, []);
  useEffect(() => {
    const root = container.current;
    if (!root || !svg) return;
    const score = new Map(cities.map((city) => [city.name, city.votes]));
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element;
      const city = target.closest("[data-iladi]")?.getAttribute("data-iladi")?.replace(/ \(.*\)$/, "");
      if (city) onSelect(city);
    };
    root.querySelectorAll<SVGGElement>("[data-iladi]").forEach((element) => {
      element.querySelectorAll(".leader-marker").forEach((marker) => marker.remove());
      if (["Kuzey Kıbrıs", "Güney Kıbrıs"].includes(element.dataset.iladi ?? "")) {
        element.style.display = "none";
        return;
      }
      const name = (element.dataset.iladi ?? "").replace(/ \(.*\)$/, "");
      const value = score.get(name) ?? 0;
      element.dataset.level = value > 800 ? "high" : value > 400 ? "mid" : value > 0 ? "low" : "none";
      const leader = leaders[name];
      if (leader) {
        const box = element.getBBox(); const size = Math.max(13, Math.min(25, Math.min(box.width, box.height) * 0.55)); const ns = "http://www.w3.org/2000/svg";
        const marker = document.createElementNS(ns, "g"); marker.setAttribute("class", "leader-marker"); marker.setAttribute("pointer-events", "none");
        const circle = document.createElementNS(ns, "circle"); circle.setAttribute("cx", String(box.x + box.width / 2)); circle.setAttribute("cy", String(box.y + box.height / 2)); circle.setAttribute("r", String(size / 2 + 2)); circle.setAttribute("fill", "#ffffff"); circle.setAttribute("stroke", "#e11d48"); circle.setAttribute("stroke-width", "1.5");
        const image = document.createElementNS(ns, "image"); image.setAttribute("href", leader.logoUrl); image.setAttribute("x", String(box.x + box.width / 2 - size / 2)); image.setAttribute("y", String(box.y + box.height / 2 - size / 2)); image.setAttribute("width", String(size)); image.setAttribute("height", String(size)); image.setAttribute("preserveAspectRatio", "xMidYMid slice");
        marker.append(circle, image); element.append(marker);
      }
    });
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [cities, leaders, onSelect, svg]);

  return <div ref={container} className="turkey-map min-w-[720px] px-3" dangerouslySetInnerHTML={{ __html: svg }} />;
}
