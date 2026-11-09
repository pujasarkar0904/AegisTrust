"use client";
import { useEffect, useRef } from "react";
import cytoscape, { type ElementDefinition } from "cytoscape";
import type { ThreatGraphEdge, ThreatGraphNode } from "@aegistrust/core";
export function ThreatGraph({ nodes, edges }: { nodes: ThreatGraphNode[]; edges: ThreatGraphEdge[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const elements: ElementDefinition[] = [...nodes, ...edges];
    const cy = cytoscape({ container: ref.current, elements, layout: { name: "cose", animate: true, padding: 48 }, style: [
      { selector: "node", style: { label: "data(label)", color: "#d8e5e9", "font-size": 10, "text-wrap": "wrap", "text-max-width": "100px", "text-valign": "bottom", "text-margin-y": 8, "background-color": "#13b8a6", width: 26, height: 26, "border-width": 1, "border-color": "#8de6db" } },
      { selector: 'node[kind = "domain"]', style: { "background-color": "#f45e72", "border-color": "#ffb1b9", width: 34, height: 34 } },
      { selector: 'node[kind = "certificate"]', style: { "background-color": "#d5a654", "border-color": "#f0d39d" } },
      { selector: 'node[kind = "dom"]', style: { "background-color": "#8e7cf3", "border-color": "#c3baff" } },
      { selector: "edge", style: { width: 1, "line-color": "#28454e", "target-arrow-color": "#4f7982", "target-arrow-shape": "triangle", "curve-style": "bezier" } }
    ] });
    return () => cy.destroy();
  }, [nodes, edges]);
  return <div className="graph-canvas" ref={ref} aria-label="Interactive threat relationship graph"/>;
}
